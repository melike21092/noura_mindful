import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const port = 8765;
const debugPort = 9223;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = await mkdtemp(join(tmpdir(), 'noura-chrome-'));
const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore'
});
const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--disable-gpu',
    '--hide-scrollbars',
    `http://127.0.0.1:${port}/tools/kalorienrechner/`
], { stdio: 'ignore' });

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let socket;
let commandId = 0;
const pending = new Map();

async function connect() {
    let target;
    for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
            const targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then(response => response.json());
            target = targets.find(item => item.type === 'page');
            if (target) break;
        } catch {}
        await wait(100);
    }
    if (!target) throw new Error('Chrome DevTools endpoint unavailable');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
    });
    socket.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (!message.id || !pending.has(message.id)) return;
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
    });
}

function command(method, params = {}) {
    const id = ++commandId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(body) {
    const result = await command('Runtime.evaluate', {
        expression: `(async () => { ${body} })()`,
        awaitPromise: true,
        returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
}

async function waitForCondition(expression, message) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
            if (await evaluate(`return Boolean(${expression});`)) return;
        } catch {}
        await wait(50);
    }
    throw new Error(message);
}

async function reload() {
    await command('Page.navigate', { url: `http://127.0.0.1:${port}/tools/kalorienrechner/` });
    await waitForCondition(
        `document.readyState === 'complete' && document.querySelector('[data-step="0"] [data-next]')`,
        'Startseite wurde nach der Navigation nicht bereit'
    );
}

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

async function chooseTarget(value) {
    await evaluate(`
        document.querySelector('[data-step="0"] [data-next]').click();
        return true;
    `);
    await waitForCondition(
        `!document.getElementById('safety-gate').hidden && !document.querySelector('.safety-gate__question').hidden`,
        'Zielgruppen-Weiche wurde nicht sichtbar'
    );
    await evaluate(`
        document.querySelector('[data-target-situation="${value}"]').click();
        return true;
    `);
    const expectedState = value === 'standard'
            ? `!document.querySelector('[data-step="1"]').hidden`
            : value === 'postpartum'
                ? `!document.querySelector('.safety-gate__timing').hidden`
                : `!document.querySelector('.guidance-view').hidden`;
    await waitForCondition(expectedState, `Zielgruppenpfad ${value} erreichte nicht den erwarteten Zustand`);
    return evaluate(`
        return {
            guidance: !document.querySelector('.guidance-view').hidden,
            title: document.getElementById('safety-gate-guidance-title').textContent,
            step1: !document.querySelector('[data-step="1"]').hidden,
            result: !document.getElementById('result').hidden,
            visibleSteps: [...document.querySelectorAll('.step')].filter(step => !step.hidden).length
        };
    `);
}

async function readGuidancePresentation() {
    return evaluate(`
        const view = document.querySelector('.guidance-view');
        return {
            renderer: view.dataset.guidanceRenderer,
            title: document.getElementById('safety-gate-guidance-title').textContent,
            intro: document.getElementById('safety-gate-guidance-copy').textContent,
            sectionTitle: document.getElementById('safety-gate-guidance-section-title').textContent,
            noticeVisible: !document.getElementById('safety-gate-guidance-notice').hidden,
            noticeText: document.getElementById('safety-gate-guidance-notice').textContent.trim(),
            noticeIcon: Boolean(document.querySelector('.guidance-view__notice-icon svg[aria-hidden="true"]')),
            itemCount: document.querySelectorAll('.guidance-item').length,
            icons: [...document.querySelectorAll('.guidance-item')].map(item => item.dataset.icon),
            decorativeIconsHidden: [...document.querySelectorAll('.guidance-item__icon svg')]
                .every(icon => icon.getAttribute('aria-hidden') === 'true'),
            oldCopyVisible: /nicht sinnvoll pauschal berechnen|Starte ohne aggressives Defizit|die bessere Anlaufstelle|klassisches Kaloriendefizit/.test(view.textContent),
            emphasizedConclusion: document.querySelectorAll('.guidance-view__closing strong').length,
            backIsButton: document.getElementById('safety-gate-change').tagName === 'BUTTON',
            backLabel: document.getElementById('safety-gate-change').textContent.trim(),
            backHeight: document.getElementById('safety-gate-change').getBoundingClientRect().height
        };
    `);
}

async function assertGuidanceBackReturnsToSelection(value) {
    await evaluate(`
        document.getElementById('safety-gate-change').click();
        return true;
    `);
    await waitForCondition(
        `!document.querySelector('.safety-gate__question').hidden`,
        `Zurücknavigation aus ${value} erreichte die Auswahl nicht`
    );
    const cleanState = await evaluate(`
        return {
            buttons: document.querySelectorAll('[data-target-situation]').length,
            radios: document.querySelectorAll('[name="targetSituation"]').length,
            selectedState: document.querySelectorAll('.situation-option[aria-pressed="true"], .situation-option.is-selected').length
        };
    `);
    assert(cleanState.buttons === 5 && cleanState.radios === 0 && cleanState.selectedState === 0, `Rückkehr aus ${value} zeigt einen Auswahlzustand`);
}

try {
    await connect();
    await command('Page.enable');
    await command('Runtime.enable');
    await waitForCondition(
        `document.readyState === 'complete' && document.querySelector('[data-step="0"] [data-next]')`,
        'Initiale Startseite wurde nicht bereit'
    );

    for (const viewport of [
        { width: 375, height: 812, expectedHeadlineLines: 3 },
        { width: 390, height: 844, expectedHeadlineLines: 3 },
        { width: 430, height: 932, expectedHeadlineLines: 3 },
        { width: 1440, height: 900, expectedHeadlineLines: 2 }
    ]) {
        await command('Emulation.setDeviceMetricsOverride', {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.width < 900
        });
        await reload();
        const startComposition = await evaluate(`
            const lineCount = element => {
                const range = document.createRange();
                range.selectNodeContents(element);
                return new Set([...range.getClientRects()]
                    .filter(rect => rect.width > 1 && rect.height > 1)
                    .map(rect => Math.round(rect.top))).size;
            };
            const hero = document.querySelector('.start-hero__content');
            const headline = document.querySelector('.start-hero h1');
            const lead = document.querySelector('.start-hero .lead');
            const actions = document.querySelector('.start-hero .actions');
            const button = actions.querySelector('.primary');
            const heroRect = hero.getBoundingClientRect();
            const wordmark = document.querySelector('.brand-wordmark');
            const signet = document.getElementById('brand-home');
            const wordmarkRect = wordmark.getBoundingClientRect();
            const eyebrowRect = document.querySelector('.start-hero__topic').getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            const footerRect = document.querySelector('.legal-links').getBoundingClientRect();
            return {
                headlineLines: lineCount(headline),
                leadLines: lineCount(lead),
                headlineSize: parseFloat(getComputedStyle(headline).fontSize),
                ctaGap: parseFloat(getComputedStyle(actions).marginTop),
                ctaNearlyFull: button.getBoundingClientRect().width >= heroRect.width * 0.9,
                heroTop: heroRect.top,
                heroBottom: heroRect.bottom,
                eyebrowTop: eyebrowRect.top,
                ctaTop: buttonRect.top,
                ctaBottom: buttonRect.bottom,
                footerTop: footerRect.top,
                ctaFooterGap: footerRect.top - buttonRect.bottom,
                viewportHeight: innerHeight,
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                wordmarkVisible: getComputedStyle(wordmark).display !== 'none',
                wordmarkWidth: wordmarkRect.width,
                logoHeroAxisDelta: Math.abs(wordmarkRect.left - heroRect.left),
                heroCtaRightDelta: Math.abs(heroRect.right - button.getBoundingClientRect().right),
                wordmarkUses: wordmark.querySelectorAll('use').length,
                wordmarkLabel: wordmark.querySelector('svg').getAttribute('aria-label'),
                descriptorPresent: Boolean(wordmark.querySelector(':scope > span')),
                oldHeaderCopy: document.querySelector('.brand').textContent.includes('von Mukaddes Mandirali'),
                signetHidden: getComputedStyle(signet).display === 'none',
                favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
                appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
                footerBrand: [...document.querySelectorAll('.legal-links__brand')]
                    .filter(element => getComputedStyle(element).display !== 'none')
                    .map(element => element.textContent.trim()).join(' '),
                footerOneLine: document.querySelector('.legal-links').getBoundingClientRect().height < 55,
                footerLinksUnderlined: [...document.querySelectorAll('.legal-links a')]
                    .some(link => getComputedStyle(link).textDecorationLine.includes('underline'))
            };
        `);
        assert(startComposition.headlineLines === viewport.expectedHeadlineLines, `Startseiten-Headline hat bei ${viewport.width}px nicht ${viewport.expectedHeadlineLines} kontrollierte Zeilen`);
        assert(!startComposition.overflow, `Startseite läuft bei ${viewport.width}px horizontal über`);
        assert(startComposition.wordmarkVisible && startComposition.wordmarkUses === 2 && startComposition.wordmarkLabel === 'NOURA', `Offizielle Wortmarke wird bei ${viewport.width}px nicht korrekt referenziert`);
        assert(!startComposition.descriptorPresent && !startComposition.oldHeaderCopy && startComposition.signetHidden, `Startseiten-Header enthält bei ${viewport.width}px nicht ausschließlich die Wortmarke`);
        assert(startComposition.favicon === 'assets/noura-mark.svg' && startComposition.appleTouchIcon === 'assets/apple-touch-icon.png', 'Browser-Icon-Verweise sind nicht korrekt');
        assert(!startComposition.footerLinksUnderlined, 'Footer-Links sind dauerhaft unterstrichen');
        if (viewport.width < 900) {
            assert(startComposition.wordmarkWidth >= 105 && startComposition.wordmarkWidth <= 120, `Mobile Wortmarke hat bei ${viewport.width}px nicht die vorgesehene Breite`);
            assert(startComposition.logoHeroAxisDelta <= 1 && startComposition.heroCtaRightDelta <= 1, `Logo, Hero und CTA liegen bei ${viewport.width}px nicht auf einer gemeinsamen Achse`);
            assert(startComposition.footerBrand === '© 2026 NOURA ·' && startComposition.footerOneLine, `Mobiler Footer ist bei ${viewport.width}px nicht als ruhige Zeile aufgebaut`);
            assert(startComposition.leadLines <= 3, `Startseiten-Subline überschreitet bei ${viewport.width}px drei Zeilen`);
            assert(startComposition.headlineSize <= 48, `Mobile Headline ist bei ${viewport.width}px zu groß`);
            assert(startComposition.ctaGap >= 28 && startComposition.ctaGap <= 32, `Abstand zwischen Subline und CTA ist bei ${viewport.width}px nicht kontrolliert`);
            assert(startComposition.ctaNearlyFull, `CTA nutzt bei ${viewport.width}px nicht nahezu die Inhaltsbreite`);
            assert(startComposition.heroTop >= 0, `Hero wird bei ${viewport.width}px oben abgeschnitten`);
            assert(startComposition.ctaFooterGap >= 80, `Zwischen CTA und Footer bleibt bei ${viewport.width}px nicht genügend Landschaft sichtbar`);
            if (viewport.width === 430) {
                assert(startComposition.eyebrowTop >= 280 && startComposition.eyebrowTop <= 310, `Eyebrow liegt bei 430px nicht im Zielbereich: ${startComposition.eyebrowTop}`);
                assert(startComposition.ctaTop >= 600 && startComposition.ctaTop <= 650, `CTA liegt bei 430px nicht im Zielbereich: ${startComposition.ctaTop}`);
            }
            if (process.env.CAPTURE_START_SCREENSHOTS === '1') {
                await waitForCondition(
                    `document.fonts.status === 'loaded' &&
                        getComputedStyle(document.querySelector('.dawn-image')).backgroundImage.includes('noura-dawn-mobile') &&
                        document.querySelector('.start-hero__content').getAnimations({ subtree: true })
                            .every(animation => animation.playState === 'finished')`,
                    `Startseiten-Assets wurden für ${viewport.width}px nicht vollständig geladen`
                );
                const screenshot = await command('Page.captureScreenshot', {
                    format: 'png',
                    fromSurface: true,
                    captureBeyondViewport: false
                });
                const artifactDirectory = join(root, 'artifacts');
                await mkdir(artifactDirectory, { recursive: true });
                await writeFile(
                    join(artifactDirectory, `noura-start-${viewport.width}x${viewport.height}.png`),
                    Buffer.from(screenshot.data, 'base64')
                );
            }
        } else {
            assert(startComposition.wordmarkWidth >= 150 && startComposition.wordmarkWidth <= 170, 'Desktop-Wortmarke hat nicht die vorgesehene Breite');
            assert(startComposition.footerBrand === '© 2026 NOURA ·', `Desktop-Footer-Marke ist nicht korrekt: ${startComposition.footerBrand}`);
        }
    }
    await command('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
    });
    await reload();

    await evaluate(`
        document.querySelector('[data-step="0"] [data-next]').click();
        return true;
    `);
    await waitForCondition(
        `!document.getElementById('safety-gate').hidden && !document.querySelector('.safety-gate__question').hidden`,
        'Lebensphasen-Screen wurde nicht sichtbar'
    );
    const initialSituationScreen = await evaluate(`
        const options = [...document.querySelectorAll('.situation-option')];
        const signet = document.getElementById('brand-home');
        return {
            subtitle: document.querySelector('.safety-gate__question > p').textContent,
            optionCount: options.length,
            titles: options.map(option => option.querySelector('strong').textContent),
            icons: options.filter(option => option.querySelector('svg[aria-hidden="true"]')).length,
            chevrons: options.filter(option => option.querySelector('.situation-option__chevron[aria-hidden="true"]')).length,
            minHeights: options.map(option => option.getBoundingClientRect().height),
            allButtons: options.every(option => option.tagName === 'BUTTON'),
            radios: document.querySelectorAll('[name="targetSituation"]').length,
            continueButton: Boolean(document.getElementById('safety-gate-continue')),
            backIsButton: document.getElementById('safety-gate-back').tagName === 'BUTTON',
            backHeight: document.getElementById('safety-gate-back').getBoundingClientRect().height,
            signetVisible: getComputedStyle(signet).display !== 'none',
            signetSize: signet.querySelector('svg').getBoundingClientRect().width,
            signetLabel: signet.getAttribute('aria-label'),
            signetUse: signet.querySelector('use')?.getAttribute('href'),
            wordmarkHidden: getComputedStyle(document.querySelector('.brand-wordmark')).display === 'none'
        };
    `);
    assert(initialSituationScreen.subtitle === 'So erhältst du eine Orientierung, die zu deiner aktuellen Lebensphase passt.', 'Unterzeile des Lebensphasen-Screens ist falsch');
    assert(initialSituationScreen.signetVisible && initialSituationScreen.wordmarkHidden && initialSituationScreen.signetLabel === 'Zur NOURA Startseite', 'Rechnernavigation verwendet nicht ausschließlich das zugängliche Signet');
    assert(initialSituationScreen.signetSize >= 32 && initialSituationScreen.signetSize <= 36 && initialSituationScreen.signetUse === 'assets/noura-mark.svg#Ebene_1', 'Desktop-Signet hat nicht die korrekte Asset-Referenz oder Größe');
    assert(initialSituationScreen.optionCount === 5, 'Lebensphasen-Screen enthält nicht genau fünf Optionen');
    assert(initialSituationScreen.titles[0] === 'Nichts davon trifft auf mich zu', 'Standardoption ist falsch beschriftet');
    assert(initialSituationScreen.icons === 5, 'Nicht jede Lebensphasenoption hat ein verborgenes Line-Icon');
    assert(initialSituationScreen.chevrons === 5, 'Nicht jede Lebensphasenoption hat einen verborgenen Chevron');
    assert(initialSituationScreen.minHeights.every(height => height >= 68), 'Eine Lebensphasenoption unterschreitet 68px');
    assert(initialSituationScreen.allButtons && initialSituationScreen.radios === 0, 'Lebensphasenoptionen sind keine eigenständigen Buttons');
    assert(!initialSituationScreen.continueButton, 'Der alte Weiter-Button ist noch vorhanden');
    assert(initialSituationScreen.backIsButton && initialSituationScreen.backHeight >= 44, 'Zurück ist kein ausreichendes Touch-Ziel');
    const unifiedBackButtons = await evaluate(`
        const buttons = [...document.querySelectorAll('button')].filter(button => button.textContent.includes('Zurück'));
        return {
            count: buttons.length,
            unified: buttons.every(button => button.classList.contains('button-secondary-back')),
            minHeights: buttons.map(button => parseFloat(getComputedStyle(button).minHeight))
        };
    `);
    assert(unifiedBackButtons.count >= 9 && unifiedBackButtons.unified, 'Nicht alle Zurück-Aktionen verwenden die gemeinsame Secondary-Komponente');
    assert(unifiedBackButtons.minHeights.every(height => height >= 44), 'Eine Zurück-Aktion unterschreitet das gemeinsame Touch-Ziel');

    await evaluate(`
        document.querySelector('[data-target-situation="pregnant"]').focus();
        return true;
    `);
    const focusOutline = await evaluate(`return getComputedStyle(document.activeElement).outlineWidth;`);
    assert(parseFloat(focusOutline) >= 3, 'Tastaturfokus ist nicht deutlich sichtbar');
    await command('Page.bringToFront');
    await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await waitForCondition(`!document.querySelector('.guidance-view').hidden`, 'Enter aktiviert den Schwangerschaftsbutton nicht');
    await assertGuidanceBackReturnsToSelection('pregnant');

    await evaluate(`document.querySelector('[data-target-situation="exclusive"]').focus(); return true;`);
    await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
    await waitForCondition(`!document.querySelector('.guidance-view').hidden`, 'Leertaste aktiviert den Vollstillbutton nicht');
    await assertGuidanceBackReturnsToSelection('exclusive');

    await evaluate(`document.getElementById('safety-gate-back').click(); return true;`);
    await waitForCondition(`!document.querySelector('[data-step="0"]').hidden`, 'Zurück führt nicht zur Startseite');

    let state = await chooseTarget('standard');
    assert(state.step1 && !state.result, 'Standardpfad erreicht die Körperdaten nicht sauber');
    await evaluate(`document.querySelector('[data-step="1"] [data-back]').click(); return true;`);
    await waitForCondition(`!document.querySelector('.safety-gate__question').hidden`, 'Standardpfad kehrt nicht zur Lebensphasen-Auswahl zurück');
    const standardReturnState = await evaluate(`
        return document.querySelectorAll('.situation-option[aria-pressed="true"], .situation-option.is-selected').length;
    `);
    assert(standardReturnState === 0, 'Rückkehr aus dem Standardpfad zeigt eine Vorauswahl');
    state = await chooseTarget('standard');
    assert(state.step1 && !state.result, 'Standardpfad lässt sich nach der Rückkehr nicht erneut öffnen');
    const bodyDataPresentation = await evaluate(`
        const step = document.querySelector('[data-step="1"]');
        const inputs = [...step.querySelectorAll('.body-data-step__input')];
        document.getElementById('age').focus();
        return {
            title: step.querySelector('h2').textContent,
            privacy: step.querySelector('.body-data-step__privacy').textContent.trim(),
            privacyIconHidden: step.querySelector('.body-data-step__privacy-icon').getAttribute('aria-hidden') === 'true',
            fieldCount: inputs.length,
            fieldHeights: inputs.map(field => field.getBoundingClientRect().height),
            units: inputs.map(field => field.lastElementChild.textContent),
            focusRing: getComputedStyle(inputs[0]).boxShadow,
            backIsButton: step.querySelector('[data-back]').tagName === 'BUTTON',
            backHeight: step.querySelector('[data-back]').getBoundingClientRect().height,
            decorativeNumberHidden: getComputedStyle(step, '::after').display === 'none'
        };
    `);
    assert(bodyDataPresentation.title === 'Erzähl mir kurz von deinem Körper.', 'Körperdaten-Headline wurde verändert');
    assert(bodyDataPresentation.privacy.includes('Deine Angaben bleiben in diesem Browser und werden nicht gespeichert.'), 'Kurzer Datenschutzhinweis fehlt');
    assert(bodyDataPresentation.privacyIconHidden, 'Schloss-Icon ist nicht dekorativ verborgen');
    assert(bodyDataPresentation.fieldCount === 3 && bodyDataPresentation.fieldHeights.every(height => height >= 58), 'Körperdatenfelder sind nicht klar dimensioniert');
    assert(bodyDataPresentation.units.join(',') === 'Jahre,cm,kg', 'Feldeinheiten fehlen oder sind editierbar');
    assert(bodyDataPresentation.focusRing !== 'none', 'Körperdatenfeld hat keinen sichtbaren Fokuszustand');
    assert(bodyDataPresentation.backIsButton && bodyDataPresentation.backHeight >= 44, 'Zurück im Körperdaten-Schritt ist kein ausreichendes Touch-Ziel');
    assert(bodyDataPresentation.decorativeNumberHidden, 'Dekorative Schrittnummer 01 ist noch sichtbar');

    const emptyBodyValidation = await evaluate(`
        const next = document.querySelector('[data-step="1"] [data-next]');
        const disabled = next.disabled;
        next.click();
        return {
            disabled,
            remainsOnStep: !document.querySelector('[data-step="1"]').hidden,
            errors: [...document.querySelectorAll('[data-step="1"] .field-error')].filter(node => node.textContent.trim()).length
        };
    `);
    assert(
        emptyBodyValidation.disabled && emptyBodyValidation.remainsOnStep,
        `Körperdaten-Weiter ist ohne gültige Angaben aktiv: ${JSON.stringify(emptyBodyValidation)}`
    );
    const legacyLifecycleRemoved = await evaluate(`
        return {
            count: document.querySelectorAll('.lifecycle-question').length,
            heading: [...document.querySelectorAll('h2')].some(node => node.textContent === 'Was braucht gerade besondere Aufmerksamkeit?')
        };
    `);
    assert(legacyLifecycleRemoved.count === 0 && !legacyLifecycleRemoved.heading, 'Redundanter Lebensphasen-Schritt ist noch vorhanden');
    const v1SafetyUi = await evaluate(`
        return {
            medicalOptions: document.querySelectorAll('[name="medicalStatus"], [name="eatingDisorder"]').length,
            confirmation: Boolean(document.querySelector('[name="generalConfirmation"]'))
        };
    `);
    assert(v1SafetyUi.medicalOptions === 0, 'Die V1-Oberfläche enthält medizinische Auswahloptionen');
    assert(v1SafetyUi.confirmation, 'Die allgemeine V1-Bestätigung fehlt');

    await evaluate(`
        document.getElementById('age').value = '34';
        document.getElementById('heightCm').value = '165';
        document.getElementById('weightKg').value = '70,5';
        document.getElementById('weightKg').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('[data-step="1"] [data-next]').click();
        return true;
    `);
    await waitForCondition(`!document.querySelector('[data-step="2"]').hidden`, 'Körperdaten führten nicht direkt zum Alltag');

    const activityStructure = await evaluate(`
        return {
            buttons: document.querySelectorAll('[data-step="2"] [data-daily-activity]').length,
            radios: document.querySelectorAll('[name="dailyActivity"]').length,
            next: Boolean(document.querySelector('[data-step="2"] [data-next]')),
            chevronsHidden: [...document.querySelectorAll('[data-step="2"] .direct-choice__chevron')]
                .every(chevron => chevron.getAttribute('aria-hidden') === 'true')
        };
    `);
    assert(activityStructure.buttons === 4 && activityStructure.radios === 0 && !activityStructure.next, 'Alltag verwendet nicht ausschließlich direkte Navigation');
    assert(activityStructure.chevronsHidden, 'Alltag-Chevrons sind für Screenreader sichtbar');
    for (const activity of ['sedentary', 'mixed', 'standing', 'strenuous']) {
        await evaluate(`document.querySelector('[data-daily-activity="${activity}"]').click(); return true;`);
        await waitForCondition(`!document.querySelector('[data-step="3"]').hidden`, `Alltagsoption ${activity} führte nicht zu Schritte`);
        const activityNavigationState = await evaluate(`
            return {
                weight: document.getElementById('weightKg').value,
                headingFocused: document.activeElement === document.querySelector('[data-step="3"] h2')
            };
        `);
        assert(activityNavigationState.weight === '70,5', `Zur Navigation über ${activity} gingen Körperdaten verloren`);
        assert(activityNavigationState.headingFocused, `Fokus wurde nach ${activity} nicht auf die neue Überschrift gesetzt`);
        await evaluate(`document.querySelector('[data-step="3"] [data-back]').click(); return true;`);
        await waitForCondition(`!document.querySelector('[data-step="2"]').hidden`, `Zurück aus Schritte erreichte Alltag nach ${activity} nicht`);
    }
    await evaluate(`
        const button = document.querySelector('[data-daily-activity="sedentary"]');
        button.click();
        button.click();
        return true;
    `);
    await waitForCondition(`!document.querySelector('[data-step="3"]').hidden`, 'Doppelklick im Alltag erreichte Schritte nicht stabil');
    const visibleAfterDoubleClick = await evaluate(`return [...document.querySelectorAll('.step')].filter(step => !step.hidden).length;`);
    assert(visibleAfterDoubleClick === 1, 'Schneller Doppelklick löst eine Doppelnavigation aus');

    const emptyStepsState = await evaluate(`
        return {
            nextDisabled: document.querySelector('[data-step="3"] [data-next]').disabled,
            chevrons: document.querySelectorAll('[data-step="3"] .direct-choice__chevron').length,
            choices: document.querySelectorAll('[data-step="3"] .form-choice').length,
            inputUnit: document.querySelector('#exactSteps').parentElement.lastElementChild.textContent
        };
    `);
    assert(emptyStepsState.nextDisabled && emptyStepsState.chevrons === 0, 'Schritte ist ohne Angabe aktiv oder enthält Chevrons');
    assert(emptyStepsState.choices === 5 && emptyStepsState.inputUnit === 'Schritte', 'Schritte-Formular ist unvollständig');
    await evaluate(`
        const first = document.querySelector('[name="stepBand"][value="under4000"]');
        first.focus();
        first.click();
        return true;
    `);
    await command('Page.bringToFront');
    await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40, nativeVirtualKeyCode: 40 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40, nativeVirtualKeyCode: 40 });
    const radioKeyboardState = await evaluate(`
        return document.querySelector('[name="stepBand"][value="from4000to7000"]').checked;
    `);
    assert(radioKeyboardState, 'Schrittbereiche lassen sich nicht mit Pfeiltasten bedienen');
    const invalidStepsState = await evaluate(`
        document.getElementById('exactSteps').value = '60000';
        document.getElementById('exactSteps').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('[data-step="3"] [data-next]').click();
        return {
            nextDisabled: document.querySelector('[data-step="3"] [data-next]').disabled,
            remainsOnStep: !document.querySelector('[data-step="3"]').hidden
        };
    `);
    assert(invalidStepsState.nextDisabled && invalidStepsState.remainsOnStep, 'Ungültige konkrete Schrittzahl verlässt den Screen');
    await evaluate(`
        document.querySelector('[name="stepBand"][value="from4000to7000"]').click();
        document.getElementById('exactSteps').value = '8200';
        document.getElementById('exactSteps').dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    `);
    const exactStepsOverride = await evaluate(`
        return {
            bandSelected: Boolean(document.querySelector('[name="stepBand"]:checked')),
            nextDisabled: document.querySelector('[data-step="3"] [data-next]').disabled
        };
    `);
    assert(!exactStepsOverride.bandSelected && !exactStepsOverride.nextDisabled, 'Konkrete Schrittzahl überschreibt den Bereich nicht eindeutig');
    await evaluate(`document.querySelector('[data-step="3"] [data-next]').click(); return true;`);
    await waitForCondition(`!document.querySelector('[data-step="4"]').hidden`, 'Gültige Schrittzahl führte nicht zu Training');

    const emptyTrainingState = await evaluate(`
        return {
            nextDisabled: document.querySelector('[data-step="4"] [data-next]').disabled,
            detailsHidden: document.querySelector('[data-when="training"]').hidden,
            unit: document.getElementById('trainingSessions').parentElement.lastElementChild.textContent,
            chevrons: document.querySelectorAll('[data-step="4"] .direct-choice__chevron').length
        };
    `);
    assert(emptyTrainingState.nextDisabled && emptyTrainingState.detailsHidden, 'Training ist ohne Eingabe aktiv oder zeigt Detailfelder');
    assert(emptyTrainingState.unit === 'pro Woche' && emptyTrainingState.chevrons === 0, 'Trainingseinheit oder Choice-Darstellung ist falsch');
    const zeroTrainingState = await evaluate(`
        document.getElementById('trainingSessions').value = '0';
        document.getElementById('trainingSessions').dispatchEvent(new Event('input', { bubbles: true }));
        return {
            detailsHidden: document.querySelector('[data-when="training"]').hidden,
            nextDisabled: document.querySelector('[data-step="4"] [data-next]').disabled
        };
    `);
    assert(zeroTrainingState.detailsHidden && !zeroTrainingState.nextDisabled, 'Training mit 0 blendet Details nicht aus oder aktiviert Weiter nicht');
    await evaluate(`
        document.getElementById('trainingSessions').value = '2';
        document.getElementById('trainingSessions').dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    `);
    let trainingState = await evaluate(`
        return {
            detailsHidden: document.querySelector('[data-when="training"]').hidden,
            nextDisabled: document.querySelector('[data-step="4"] [data-next]').disabled
        };
    `);
    assert(!trainingState.detailsHidden && trainingState.nextDisabled, 'Training über 0 verlangt Art und Dauer nicht');
    await evaluate(`
        document.querySelector('[name="trainingType"][value="strength"]').click();
        document.getElementById('trainingMinutes').value = '60';
        document.getElementById('trainingMinutes').dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    `);
    trainingState = await evaluate(`return { nextDisabled: document.querySelector('[data-step="4"] [data-next]').disabled };`);
    assert(!trainingState.nextDisabled, 'Gültiges Training aktiviert Weiter nicht');
    await evaluate(`document.querySelector('[data-step="4"] [data-next]').click(); return true;`);
    await waitForCondition(
        `!document.querySelector('[data-step="5"]').hidden`,
        'Der Standardpfad erreichte die allgemeine Bestätigung nicht'
    );
    await evaluate(`document.querySelector('[data-step="5"] [data-back]').click(); return true;`);
    await waitForCondition(`!document.querySelector('[data-step="4"]').hidden`, 'Zurück aus Herausforderung erreichte Training nicht');
    const retainedTraining = await evaluate(`
        return {
            sessions: document.getElementById('trainingSessions').value,
            type: document.querySelector('[name="trainingType"]:checked')?.value,
            minutes: document.getElementById('trainingMinutes').value,
            nextDisabled: document.querySelector('[data-step="4"] [data-next]').disabled
        };
    `);
    assert(
        retainedTraining.sessions === '2' && retainedTraining.type === 'strength' &&
        retainedTraining.minutes === '60' && !retainedTraining.nextDisabled,
        'Zurücknavigation erhält Trainingsangaben nicht'
    );
    await evaluate(`document.querySelector('[data-step="4"] [data-next]').click(); return true;`);
    await waitForCondition(`!document.querySelector('[data-step="5"]').hidden`, 'Erneutes Weiter aus Training erreichte Herausforderung nicht');
    const challengeStructure = await evaluate(`
        return {
            buttons: document.querySelectorAll('[data-obstacle]').length,
            radios: document.querySelectorAll('[name="obstacle"]').length,
            submit: Boolean(document.querySelector('[data-step="5"] [type="submit"]')),
            values: [...document.querySelectorAll('[data-obstacle]')].map(button => button.dataset.obstacle)
        };
    `);
    assert(challengeStructure.buttons === 8 && challengeStructure.radios === 0 && !challengeStructure.submit, 'Herausforderung verwendet nicht direkte Navigation');
    assert(challengeStructure.values.join(',') === 'hunger,cravings,irregular,family,stress,weekend,consistency,unsure', 'Herausforderungswerte oder Reihenfolge wurden verändert');
    const blockedWithoutConfirmation = await evaluate(`
        document.querySelector('[data-obstacle="unsure"]').click();
        return {
            resultHidden: document.getElementById('result').hidden,
            error: document.querySelector('[data-error="generalConfirmation"]').textContent
        };
    `);
    assert(blockedWithoutConfirmation.resultHidden && blockedWithoutConfirmation.error, 'Berechnung war ohne allgemeine Bestätigung möglich');
    await evaluate(`
        document.querySelector('[name="generalConfirmation"]').click();
        document.querySelector('[data-obstacle="hunger"]').focus();
        return true;
    `);
    await command('Page.bringToFront');
    await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
    await waitForCondition(`!document.getElementById('result').hidden`, 'Bestätigter Standardpfad zeigte kein Ergebnis');
    const privacyState = await evaluate(`
        return {
            search: window.location.search,
            hash: window.location.hash,
            localStorageEntries: window.localStorage.length,
            sessionStorageEntries: window.sessionStorage.length,
            cookie: document.cookie,
            thirdPartyResources: performance.getEntriesByType('resource')
                .map(entry => entry.name)
                .filter(url => new URL(url).origin !== window.location.origin)
        };
    `);
    assert(privacyState.search === '' && privacyState.hash === '', 'Rechnerdaten tauchen in der URL auf');
    assert(privacyState.localStorageEntries === 0, 'Rechnerdaten oder Zustand wurden in localStorage abgelegt');
    assert(privacyState.sessionStorageEntries === 0, 'Rechnerdaten oder Zustand wurden in sessionStorage abgelegt');
    assert(privacyState.cookie === '', 'Der Rechner hat Cookies gesetzt');
    assert(privacyState.thirdPartyResources.length === 0, 'Der Rechner lädt Drittanbieterressourcen');

    const resultHierarchy = await evaluate(`
        const firstCardDetails = [...document.querySelectorAll('.start-result-card > details')];
        const standardChildren = [...document.getElementById('standard-results').children];
        return {
            detailTitles: firstCardDetails.map(details => details.querySelector('summary').textContent.trim()),
            detailsClosed: firstCardDetails.every(details => !details.open),
            order: standardChildren.map(element => element.id || [...element.classList].join('.')),
            missionTitle: document.getElementById('mission-title').textContent.trim(),
            missionIntro: document.getElementById('mission-intro').textContent.trim(),
            missionActions: [...document.querySelectorAll('#mission-actions li')].map(item => item.textContent.trim()),
            missionQuestion: document.getElementById('mission-question').textContent.trim(),
            protein: document.getElementById('protein-result').textContent.trim(),
            proteinRange: document.getElementById('protein-range').textContent.trim(),
            calorieTitle: document.querySelector('.calorie-result-title').textContent.trim(),
            startValue: document.getElementById('start-result-number').textContent.trim(),
            startValueGroup: document.querySelector('.primary-metric > strong').textContent.trim(),
            rangeLow: document.getElementById('calorie-range').dataset.low,
            rangeHigh: document.getElementById('calorie-range').dataset.high,
            rangeStart: document.getElementById('calorie-range').dataset.start,
            rangePosition: Number(document.getElementById('calorie-range').dataset.position),
            markerLeft: document.getElementById('calorie-range-marker').style.left,
            rangeDescription: document.getElementById('calorie-range-description').textContent.trim(),
            activityChips: [...document.querySelectorAll('#activity-summary > span')].map(chip => chip.textContent.trim()),
            macrosClosed: !document.querySelector('.macro-details').open,
            macroSummary: document.querySelector('.macro-details summary').textContent.trim(),
            macroValues: ['macro-protein', 'macro-fat', 'macro-carbs', 'macro-fiber']
                .map(id => document.getElementById(id).textContent.trim()),
            duplicateCard: Boolean(document.getElementById('standard-next-step')),
            ctaTitle: document.getElementById('cta-title').textContent.trim(),
            ctaCopy: document.getElementById('cta-copy').textContent.trim(),
            ctaLabel: document.getElementById('cta-button').textContent.trim(),
            ctaHref: document.getElementById('cta-button').href
        };
    `);
    assert(resultHierarchy.detailTitles.join('|') === 'So entsteht dein Startwert|So testest du deinen Startwert', 'Die Kalorienkarte enthält nicht genau die zwei neuen Akkordeons');
    assert(resultHierarchy.detailsClosed, 'Die Akkordeons der Kalorienkarte sind nicht initial geschlossen');
    assert(resultHierarchy.order[0] === 'mission-result' && resultHierarchy.order[1].includes('protein-card') && resultHierarchy.order[2].includes('macro-details'), 'Die Ergebnishierarchie ist nicht Hebel, Protein, Nährwertdetails');
    assert(resultHierarchy.missionTitle === 'Nicht tiefer starten. Erst stabiler essen.', 'Die Hunger-Personalisierung zeigt die falsche Überschrift');
    assert(resultHierarchy.missionIntro.startsWith('Starker Hunger ist kein Beweis'), 'Die Hunger-Personalisierung zeigt die falsche Einleitung');
    assert(resultHierarchy.missionActions.length === 3, 'Das 7-Tage-Experiment enthält nicht genau drei Schritte');
    assert(resultHierarchy.missionQuestion === 'Wird dein Hunger dadurch ruhiger – besonders am Nachmittag oder Abend?', 'Die Hunger-Personalisierung zeigt die falsche Abschlussfrage');
    assert(resultHierarchy.protein && resultHierarchy.proteinRange, 'Dynamische Proteinwerte fehlen');
    assert(resultHierarchy.calorieTitle === 'Dein realistischer Startpunkt', 'Die Kalorienkarte zeigt nicht die neue Ergebnishierarchie');
    assert(resultHierarchy.startValue && resultHierarchy.startValueGroup.endsWith('kcal'), 'Startwert und Einheit werden nicht gemeinsam ausgegeben');
    const expectedRangePosition = (Number(resultHierarchy.rangeStart) - Number(resultHierarchy.rangeLow)) /
        (Number(resultHierarchy.rangeHigh) - Number(resultHierarchy.rangeLow));
    assert(Math.abs(resultHierarchy.rangePosition - expectedRangePosition) < 0.000001, 'Der Range-Marker wird nicht relativ aus Untergrenze, Startwert und Obergrenze berechnet');
    assert(resultHierarchy.markerLeft === `${expectedRangePosition * 100}%`, 'Die visuelle Markerposition entspricht nicht der berechneten Position');
    assert(resultHierarchy.rangeDescription.includes('Kilokalorien') && resultHierarchy.rangeDescription.includes(resultHierarchy.startValue), 'Die Screenreader-Zusammenfassung des Korridors fehlt');
    assert(resultHierarchy.activityChips.length === 3 && resultHierarchy.activityChips.every(Boolean), 'Die Aktivitätszusammenfassung besteht nicht aus drei dynamischen Chips');
    assert(resultHierarchy.macrosClosed && resultHierarchy.macroSummary === 'Weitere Nährwertdetails', 'Makros sind nicht als geschlossenes Detail erreichbar');
    assert(resultHierarchy.macroValues.every(Boolean), 'Dynamische Makrowerte fehlen');
    assert(!resultHierarchy.duplicateCard, 'Der doppelte Nächster-Schritt-Inhalt ist noch vorhanden');
    assert(resultHierarchy.ctaTitle === 'Eine Zahl ist ein Startpunkt. Dein Alltag entscheidet, ob sie funktioniert.', 'Der Coaching-Abschluss zeigt die falsche Überschrift');
    assert(resultHierarchy.ctaCopy.startsWith('Im NOURA Coaching übersetzen wir deine Orientierung'), 'Der Coaching-Abschluss zeigt den falschen Text');
    assert(resultHierarchy.ctaLabel === 'Meinen persönlichen Start besprechen' && resultHierarchy.ctaHref.includes('zeeg.me/nouraxbalance/kennenlernen'), 'Der Coaching-CTA ist nicht korrekt verknüpft');

    const markerScenarios = [
        { low: 1800, start: 1850, high: 1900, expected: 0.5 },
        { low: 1800, start: 1825, high: 1900, expected: 0.25 },
        { low: 1800, start: 1875, high: 1900, expected: 0.75 }
    ];
    markerScenarios.forEach(({ low, start, high, expected }) => {
        const position = Math.min(1, Math.max(0, (start - low) / (high - low)));
        assert(position === expected, `Marker-Test für ${low}/${start}/${high} ist fehlgeschlagen`);
    });

    for (const viewport of [
        { width: 375, height: 812, mobile: true },
        { width: 430, height: 932, mobile: true },
        { width: 1440, height: 900, mobile: false }
    ]) {
        await command('Emulation.setDeviceMetricsOverride', {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.mobile
        });
        const responsiveResult = await evaluate(`
            return {
                documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                bodyOverflow: document.body.scrollWidth > document.body.clientWidth,
                clipped: [...document.querySelectorAll('#result .result-card')].some(card => {
                    const rect = card.getBoundingClientRect();
                    return rect.left < -0.5 || rect.right > document.documentElement.clientWidth + 0.5;
                }),
                metricWrapped: (() => {
                    const value = document.getElementById('start-result-number').getBoundingClientRect();
                    const unit = document.querySelector('.primary-metric .metric-unit').getBoundingClientRect();
                    return unit.top >= value.bottom || unit.bottom <= value.top;
                })(),
                clippedKeyValues: [
                    ['metric', document.querySelector('.primary-metric > strong')],
                    ['range', document.querySelector('.calorie-range__visual')],
                    ...[...document.querySelectorAll('.basis-value strong')].map((element, index) => [\`basis-\${index}\`, element])
                ].filter(([, element]) => element.scrollWidth > element.clientWidth + 1).map(([name]) => name)
            };
        `);
        assert(!responsiveResult.documentOverflow && !responsiveResult.bodyOverflow && !responsiveResult.clipped && !responsiveResult.metricWrapped && responsiveResult.clippedKeyValues.length === 0, `Ergebnis läuft bei ${viewport.width}px horizontal über oder schneidet Werte ab: ${JSON.stringify(responsiveResult)}`);
    }
    await command('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
    });

    await reload();
    state = await chooseTarget('pregnant');
    assert(state.guidance && state.visibleSteps === 0 && !state.result, 'Schwangerschaft erreicht nicht ausschließlich die Informationsansicht');
    assert(state.title === 'Jetzt zählt gute Versorgung.', 'Falsche Schwangerschaftsüberschrift');
    const pregnancyPresentation = await readGuidancePresentation();
    assert(pregnancyPresentation.renderer === 'renderGuidanceView', 'Schwangerschaft verwendet nicht die gemeinsame Renderfunktion');
    assert(pregnancyPresentation.sectionTitle === 'Worauf du jetzt achten kannst', 'Zwischenüberschrift der Schwangerschaftsansicht fehlt');
    assert(pregnancyPresentation.noticeVisible && pregnancyPresentation.noticeIcon, 'Hinweisbox der Schwangerschaftsansicht fehlt');
    assert(pregnancyPresentation.itemCount === 3, 'Schwangerschaftsansicht zeigt nicht drei Icon-Zeilen');
    assert(pregnancyPresentation.icons.join(',') === 'meal,leaf,conversation', 'Schwangerschaftsansicht zeigt falsche Icons');
    assert(pregnancyPresentation.decorativeIconsHidden, 'Schwangerschaftsicons sind für Screenreader nicht verborgen');
    assert(pregnancyPresentation.backLabel.includes('Zurück zur Auswahl'), 'Zurück-Button der Schwangerschaftsansicht ist falsch beschriftet');
    assert(pregnancyPresentation.backIsButton && pregnancyPresentation.backHeight >= 44, 'Zurück-Button der Schwangerschaftsansicht ist nicht zugänglich');
    assert(!pregnancyPresentation.oldCopyVisible, 'Schwangerschaftsansicht rendert alte Textblöcke');
    await assertGuidanceBackReturnsToSelection('pregnant');

    await reload();
    state = await chooseTarget('exclusive');
    assert(state.guidance && state.visibleSteps === 0 && !state.result, 'Vollstillpfad erreicht eine Berechnung');
    const exclusivePresentation = await readGuidancePresentation();
    assert(exclusivePresentation.renderer === 'renderGuidanceView', 'Vollstillansicht verwendet nicht die gemeinsame Renderfunktion');
    assert(exclusivePresentation.title === 'Dein Körper versorgt gerade nicht nur dich.', 'Falsche Vollstillüberschrift');
    assert(exclusivePresentation.sectionTitle === 'Worauf du jetzt achten kannst', 'Zwischenüberschrift der Vollstillansicht fehlt');
    assert(exclusivePresentation.itemCount === 3, 'Vollstillansicht zeigt nicht drei Icon-Zeilen');
    assert(exclusivePresentation.icons.join(',') === 'meal,hydration,body-signal', 'Vollstillansicht zeigt falsche Icons');
    assert(exclusivePresentation.noticeVisible && exclusivePresentation.noticeIcon, 'Hinweisbox der Vollstillansicht fehlt');
    assert(exclusivePresentation.emphasizedConclusion === 2, 'Abschlusshinweis der Vollstillansicht ist falsch hervorgehoben');
    assert(exclusivePresentation.backIsButton && exclusivePresentation.backHeight >= 44, 'Zurück-Button der Vollstillansicht ist nicht zugänglich');
    assert(!exclusivePresentation.oldCopyVisible, 'Vollstillansicht rendert alte Textblöcke');
    await assertGuidanceBackReturnsToSelection('exclusive');

    await reload();
    state = await chooseTarget('partial');
    assert(state.guidance && state.visibleSteps === 0 && !state.result, 'Teilstillpfad erreicht eine Berechnung');
    const partialPresentation = await readGuidancePresentation();
    assert(partialPresentation.renderer === 'renderGuidanceView', 'Teilstillansicht verwendet nicht die gemeinsame Renderfunktion');
    assert(partialPresentation.title === 'Beim Teilstillen ist dein Bedarf besonders individuell.', 'Falsche Teilstillüberschrift');
    assert(partialPresentation.intro.includes('Deshalb gibt dir NOURA hier bewusst keine feste Abnehmzahl.'), 'Falsche Teilstilleinleitung');
    assert(partialPresentation.sectionTitle === 'Worauf du jetzt achten kannst', 'Zwischenüberschrift der Teilstillansicht fehlt');
    assert(!partialPresentation.noticeVisible && !partialPresentation.noticeText, 'Teilstillansicht rendert einen leeren Hinweisblock');
    assert(partialPresentation.itemCount === 3, 'Teilstillansicht zeigt nicht drei Icon-Zeilen');
    assert(partialPresentation.icons.join(',') === 'meal,body-signal,adjust', 'Teilstillansicht zeigt falsche Icons');
    assert(partialPresentation.backIsButton && partialPresentation.backHeight >= 44, 'Zurück-Button der Teilstillansicht ist nicht zugänglich');
    assert(!partialPresentation.oldCopyVisible, 'Teilstillansicht rendert alte Textblöcke');
    await assertGuidanceBackReturnsToSelection('partial');

    await reload();
    await chooseTarget('postpartum');
    const postpartumTimingPresentation = await evaluate(`
        return {
            choices: document.querySelectorAll('.safety-gate__timing .form-choice').length,
            indicators: document.querySelectorAll('.safety-gate__timing .form-choice__indicator').length,
            chevrons: document.querySelectorAll('.safety-gate__timing .direct-choice__chevron').length,
            continueDisabled: document.getElementById('postpartum-timing-continue').disabled
        };
    `);
    assert(
        postpartumTimingPresentation.choices === 2 &&
        postpartumTimingPresentation.indicators === 2 &&
        postpartumTimingPresentation.chevrons === 0,
        'Postpartum-Zeitabfrage verwendet nicht das gemeinsame Formular-Choice-Muster'
    );
    assert(postpartumTimingPresentation.continueDisabled, 'Postpartum-Weiter ist ohne Auswahl aktiv');
    state = await evaluate(`
        document.querySelector('[name="postpartumTiming"][value="under6"]').click();
        const continueEnabled = !document.getElementById('postpartum-timing-continue').disabled;
        document.getElementById('postpartum-timing-continue').click();
        return {
            title: document.getElementById('safety-gate-guidance-title').textContent,
            visibleSteps: [...document.querySelectorAll('.step')].filter(step => !step.hidden).length,
            result: !document.getElementById('result').hidden,
            continueEnabled
        };
    `);
    assert(state.continueEnabled, 'Postpartum-Auswahl aktiviert Weiter nicht');
    assert(state.title === 'Dein Körper darf gerade regenerieren.' && state.visibleSteps === 0 && !state.result, 'Früher Postpartum-Pfad erreicht eine Berechnung');
    const earlyPostpartumPresentation = await readGuidancePresentation();
    assert(earlyPostpartumPresentation.renderer === 'renderGuidanceView', 'Postpartum-Ansicht verwendet nicht die gemeinsame Renderfunktion');
    assert(earlyPostpartumPresentation.title === 'Dein Körper darf gerade regenerieren.', 'Falsche Postpartum-Überschrift');
    assert(earlyPostpartumPresentation.sectionTitle === 'Was jetzt wichtiger ist', 'Zwischenüberschrift der frühen Postpartum-Ansicht fehlt');
    assert(!earlyPostpartumPresentation.noticeVisible && !earlyPostpartumPresentation.noticeText, 'Frühe Postpartum-Ansicht enthält eine zusätzliche Hinweisbox');
    assert(earlyPostpartumPresentation.itemCount === 3, 'Frühe Postpartum-Ansicht zeigt nicht drei Icon-Zeilen');
    assert(earlyPostpartumPresentation.icons.join(',') === 'meal,recovery,scale-wave', 'Postpartum-Ansicht zeigt falsche Icons');
    assert(earlyPostpartumPresentation.emphasizedConclusion === 2, 'Abschlusshinweis der frühen Postpartum-Ansicht ist falsch hervorgehoben');
    assert(earlyPostpartumPresentation.backIsButton && earlyPostpartumPresentation.backHeight >= 44, 'Zurück-Button der frühen Postpartum-Ansicht ist nicht zugänglich');
    assert(!earlyPostpartumPresentation.oldCopyVisible, 'Postpartum-Ansicht rendert alte Textblöcke');
    await assertGuidanceBackReturnsToSelection('postpartum');

    await reload();
    await chooseTarget('postpartum');
    state = await evaluate(`
        document.querySelector('[name="postpartumTiming"][value="over6"]').click();
        document.getElementById('postpartum-timing-continue').click();
        const readiness = !document.querySelector('.safety-gate__readiness').hidden;
        document.getElementById('postpartum-readiness-continue').click();
        return { readiness, step1: !document.querySelector('[data-step="1"]').hidden };
    `);
    assert(state.readiness && state.step1, 'Postpartum ab sechs Wochen erreicht den Standardrechner nicht über die Bereitschaftsansicht');

    await reload();
    await chooseTarget('standard');
    state = await evaluate(`
        document.getElementById('age').value = '17';
        document.getElementById('heightCm').value = '165';
        document.getElementById('weightKg').value = '70';
        document.getElementById('weightKg').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('[data-step="1"] [data-next]').click();
        return {
            title: document.getElementById('safety-gate-guidance-title').textContent,
            result: !document.getElementById('result').hidden,
            visibleSteps: [...document.querySelectorAll('.step')].filter(step => !step.hidden).length
        };
    `);
    assert(state.title === 'Dieser Rechner ist für deine Lebensphase nicht ausgelegt.' && !state.result && state.visibleSteps === 0, 'U18-Stopp verhindert die Berechnung nicht');

    for (const viewport of [
        { width: 375, height: 812 },
        { width: 430, height: 932 },
        { width: 768, height: 1024 },
        { width: 1440, height: 900 }
    ]) {
        await command('Emulation.setDeviceMetricsOverride', {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.width < 600
        });
        await reload();
        await chooseTarget('standard');
        const bodyLayout = await evaluate(`
            const step = document.querySelector('[data-step="1"]');
            const fields = [...step.querySelectorAll('.field')];
            const firstTop = fields[0].getBoundingClientRect().top;
            const columnCount = new Set(fields.map(field => Math.round(field.getBoundingClientRect().top))).size;
            return {
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                clipped: [...step.querySelectorAll('h2, p, label, input, .body-data-step__input > span')]
                    .some(node => node.scrollWidth > node.clientWidth + 1),
                cardHeight: step.getBoundingClientRect().height,
                columnCount,
                firstTop
            };
        `);
        assert(!bodyLayout.overflow, `Horizontaler Überlauf im Körperdaten-Schritt bei ${viewport.width}px`);
        assert(!bodyLayout.clipped, `Abgeschnittener Inhalt im Körperdaten-Schritt bei ${viewport.width}px`);
        assert(bodyLayout.cardHeight < viewport.height, `Körperdatenkarte wird bei ${viewport.width}px künstlich auf Viewporthöhe gestreckt`);
        if (viewport.width < 768) assert(bodyLayout.columnCount === 3, `Körperdatenfelder stehen bei ${viewport.width}px nicht untereinander`);
        else assert(bodyLayout.columnCount === 1, `Körperdatenfelder bilden bei ${viewport.width}px keine kompakte Reihe`);

        if (viewport.width <= 430) {
            const interactionLayout = await evaluate(`
                const states = [];
                const capture = step => {
                    const node = document.querySelector('[data-step="' + step + '"]');
                    states.push({
                        step,
                        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                        clipped: [...node.querySelectorAll('h2, p, strong, small, label')]
                            .some(element => element.scrollWidth > element.clientWidth + 1)
                    });
                };
                document.getElementById('age').value = '34';
                document.getElementById('heightCm').value = '165';
                document.getElementById('weightKg').value = '70';
                document.getElementById('weightKg').dispatchEvent(new Event('input', { bubbles: true }));
                document.querySelector('[data-step="1"] [data-next]').click();
                capture(2);
                document.querySelector('[data-daily-activity="mixed"]').click();
                capture(3);
                document.querySelector('[name="stepBand"][value="from4000to7000"]').click();
                document.querySelector('[data-step="3"] [data-next]').click();
                capture(4);
                document.getElementById('trainingSessions').value = '0';
                document.getElementById('trainingSessions').dispatchEvent(new Event('input', { bubbles: true }));
                document.querySelector('[data-step="4"] [data-next]').click();
                capture(5);
                return {
                    states,
                    directMinHeights: [...document.querySelectorAll('.direct-choice')]
                        .map(button => parseFloat(getComputedStyle(button).minHeight)),
                    formChoiceMinHeights: [...document.querySelectorAll('.form-choice')]
                        .map(choice => parseFloat(getComputedStyle(choice).minHeight)),
                    backMinHeights: [...document.querySelectorAll('.button-secondary-back')]
                        .map(button => parseFloat(getComputedStyle(button).minHeight))
                };
            `);
            assert(interactionLayout.states.every(item => !item.overflow && !item.clipped), `Rechnerinhalt läuft bei ${viewport.width}px über`);
            assert(interactionLayout.directMinHeights.every(height => height >= 64), `Direktes Touch-Ziel ist bei ${viewport.width}px zu klein`);
            assert(interactionLayout.formChoiceMinHeights.every(height => height >= 56), `Formular-Choice ist bei ${viewport.width}px zu klein`);
            assert(interactionLayout.backMinHeights.every(height => height >= 44), `Zurück-Touchziel ist bei ${viewport.width}px zu klein`);
        }
    }

    for (const width of [375, 430]) {
        await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
        await reload();
        await evaluate(`document.querySelector('[data-step="0"] [data-next]').click(); return true;`);
        await waitForCondition(
            `!document.getElementById('safety-gate').hidden && !document.querySelector('.safety-gate__question').hidden`,
            `Lebensphasen-Screen wurde bei ${width}px nicht sichtbar`
        );
        const situationLayout = await evaluate(`
            return {
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                clippedDescriptions: [...document.querySelectorAll('.situation-option__content small')]
                    .some(copy => copy.scrollHeight > copy.clientHeight + 1)
            };
        `);
        assert(!situationLayout.overflow, `Horizontaler Überlauf im Lebensphasen-Screen bei ${width}px`);
        assert(!situationLayout.clippedDescriptions, `Abgeschnittener Erklärungstext im Lebensphasen-Screen bei ${width}px`);

        for (const target of ['pregnant', 'exclusive', 'partial', 'postpartum']) {
            await reload();
            await chooseTarget(target);
            if (target === 'postpartum') {
                await evaluate(`
                    document.querySelector('[name="postpartumTiming"][value="under6"]').click();
                    document.getElementById('postpartum-timing-continue').click();
                    return true;
                `);
                await waitForCondition(
                    `!document.querySelector('.guidance-view').hidden`,
                    `Postpartum-Ansicht wurde bei ${width}px nicht sichtbar`
                );
            }
            const overflow = await evaluate('return document.documentElement.scrollWidth > document.documentElement.clientWidth;');
            assert(!overflow, `Horizontaler Überlauf im Pfad ${target} bei ${width}px`);
        }
    }

    console.log('NOURA target-gate browser tests passed');
} finally {
    socket?.close();
    chrome.kill();
    server.kill();
    await wait(250);
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            await rm(profile, { recursive: true, force: true });
            break;
        } catch (error) {
            if (error.code !== 'EBUSY' || attempt === 4) throw error;
            await wait(250);
        }
    }
}
