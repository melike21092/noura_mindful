import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const artifactDirectory = join(root, 'artifacts');
const port = 8766;
const debugPort = 9224;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = await mkdtemp(join(tmpdir(), 'noura-app-shell-chrome-'));
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
    `http://127.0.0.1:${port}/app/`
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
    assert.ok(target, 'Chrome DevTools endpoint unavailable');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
    });
    socket.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (!message.id || !pending.has(message.id)) return;
        const handlers = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) handlers.reject(new Error(message.error.message));
        else handlers.resolve(message.result);
    });
}

function command(method, params = {}) {
    const id = ++commandId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
}

try {
    await connect();
    await command('Page.enable');
    await command('Runtime.enable');

    for (const viewport of [
        { width: 390, height: 844, mobile: true },
        { width: 1440, height: 900, mobile: false }
    ]) {
        await command('Emulation.setDeviceMetricsOverride', {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.mobile
        });
        await command('Page.navigate', { url: `http://127.0.0.1:${port}/app/?viewport=${viewport.width}#/calculator` });

        for (let attempt = 0; attempt < 50; attempt += 1) {
            if (await evaluate("Boolean(document.querySelector('#calculator-form .start-hero:not([hidden])') && document.getElementById('safety-gate')?.hidden)")) break;
            await wait(100);
        }
        await evaluate(`(async () => {
            await document.fonts.ready;
            const animations = document.querySelector('.start-hero')
                .getAnimations({ subtree: true })
                .filter(animation => animation.effect?.getTiming().iterations !== Infinity);
            await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
            return true;
        })()`);

        const state = await evaluate(`(() => {
            const links = [...document.querySelectorAll('.app-navigation a')];
            const shell = document.querySelector('.app-shell');
            const header = document.querySelector('.app-header');
            const navigation = document.querySelector('.app-navigation');
            const startHero = document.querySelector('.start-hero');
            const activeLinkStyle = getComputedStyle(links[0]);
            const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
            return {
                title: document.querySelector('.start-hero h1')?.textContent.replace(/\s+/g, ' ').trim(),
                documentTitle: document.title,
                routeHash: location.hash,
                shellMode: shell?.dataset.shellMode,
                favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
                appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
                shellWordmark: document.querySelector('.app-brand img')?.getAttribute('src'),
                appStylesheet: document.querySelector('link[rel="stylesheet"]')?.getAttribute('href'),
                loadedStylesheets: [
                    ...[...document.styleSheets].map(sheet => sheet.href).filter(Boolean),
                    ...performance.getEntriesByType('resource').map(entry => entry.name)
                ],
                navigationLabels: links.map(link => link.textContent.trim()),
                currentRoutes: links.filter(link => link.getAttribute('aria-current') === 'page').length,
                navigationLabel: navigation?.getAttribute('aria-label'),
                navigationVisible: navigation?.getBoundingClientRect().height > 0,
                navigationPosition: activeLinkStyle.position,
                activeBackground: activeLinkStyle.backgroundColor,
                bottomNavigationCount: document.querySelectorAll('.bottom-navigation, .mobile-navigation').length,
                calculatorHref: links[0]?.getAttribute('href'),
                supportHrefs: Object.fromEntries([...document.querySelectorAll('.legal-links a')].map(link => [link.textContent.trim(), link.getAttribute('href')])),
                overflow: document.documentElement.scrollWidth > innerWidth,
                shellWidth: shell?.getBoundingClientRect().width,
                headerWorkspaceClearance: startHero?.getBoundingClientRect().top - header?.getBoundingClientRect().bottom,
                storageEntries: localStorage.length + sessionStorage.length,
                navigationHeight: links[0]?.getBoundingClientRect().height,
                calculatorForms: document.querySelectorAll('#calculator-form').length,
                pageShells: document.querySelectorAll('.app-workspace > .page-shell').length,
                duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
                startVisible: !document.querySelector('.start-hero')?.hidden,
                safetyHidden: document.getElementById('safety-gate')?.hidden,
                failedAssets: [...document.images].filter(image => image.offsetParent !== null && (!image.complete || image.naturalWidth === 0)).length
            };
        })()`);

        assert.match(state.title, /braucht dein Körper wirklich\?$/);
        assert.equal(state.documentTitle, 'NOURA – Rechner');
        assert.equal(state.routeHash, '#/calculator');
        assert.equal(state.shellMode, 'entry');
        assert.equal(state.favicon, './assets/brand/noura-mark.svg');
        assert.equal(state.appleTouchIcon, './assets/brand/apple-touch-icon.png');
        assert.equal(state.shellWordmark, './assets/brand/noura-wordmark.svg');
        assert.equal(state.appStylesheet, './styles/app.css');
        assert.ok(state.loadedStylesheets.some(href => href.endsWith('/app/styles/noura-design-system.css?v=20260801-5')));
        assert.ok(state.loadedStylesheets.some(href => href.endsWith('/app/styles/shell.css?v=20260803-1')));
        assert.ok(state.loadedStylesheets.some(href => href.endsWith('/app/workspaces/calculator/calculator-workspace.css?v=20260801-1')));
        assert.ok(state.loadedStylesheets.some(href => href.endsWith('/app/workspaces/calculator/calculator.css?v=20260801-25')));
        assert.deepEqual(state.navigationLabels, ['Rechner']);
        assert.equal(state.currentRoutes, 1);
        assert.equal(state.navigationLabel, 'Hauptnavigation');
        assert.equal(state.navigationVisible, true);
        assert.equal(state.navigationPosition, 'static');
        assert.notEqual(state.activeBackground, 'rgba(0, 0, 0, 0)');
        assert.equal(state.bottomNavigationCount, 0);
        assert.equal(state.calculatorHref, '#/calculator');
        assert.ok(state.supportHrefs.Impressum.endsWith('/app/support/impressum.html'));
        assert.ok(state.supportHrefs.Datenschutz.endsWith('/app/support/datenschutz.html'));
        assert.ok(state.supportHrefs.Designsystem.endsWith('/app/support/design-system.html'));
        assert.equal(state.overflow, false, `${viewport.width}px: horizontaler Overflow`);
        assert.ok(state.shellWidth <= Math.min(viewport.width, 1440));
        assert.ok(state.headerWorkspaceClearance >= 0, `${viewport.width}px: Rechner überlagert die App-Shell-Navigation`);
        assert.equal(state.storageEntries, 0);
        assert.ok(state.navigationHeight >= 44, `${viewport.width}px: Rechnernavigation unterschreitet 44px`);
        assert.equal(state.calculatorForms, 1);
        assert.equal(state.pageShells, 1);
        assert.deepEqual(state.duplicateIds, []);
        assert.equal(state.startVisible, true, `${viewport.width}px: Rechner startet nicht im Hero-Zustand`);
        assert.equal(state.safetyHidden, true, `${viewport.width}px: Safety Gate ist vor dem Start sichtbar`);
        assert.equal(state.failedAssets, 0);

        const initialAppState = await evaluate(`(() => {
            const state = globalThis[Symbol.for('noura.appState')];
            return {
                activeWorkspaceId: state.activeWorkspaceId,
                shellMode: state.shellMode,
                personalOrientation: state.personalOrientation
            };
        })()`);
        assert.deepEqual(initialAppState, {
            activeWorkspaceId: 'calculator',
            shellMode: 'entry',
            personalOrientation: null
        });

        const focusState = await evaluate(`(() => {
            const link = document.querySelector('.app-navigation a');
            link.focus();
            const style = getComputedStyle(link);
            return {
                focused: document.activeElement === link,
                outlineWidth: parseFloat(style.outlineWidth),
                height: link.getBoundingClientRect().height
            };
        })()`);
        assert.equal(focusState.focused, true);
        assert.ok(focusState.outlineWidth >= 3, `${viewport.width}px: Hauptnavigation besitzt keinen deutlichen Tastaturfokus`);
        assert.ok(focusState.height >= 44, `${viewport.width}px: Hauptnavigation unterschreitet 44px`);
        await evaluate("document.activeElement?.blur(); true");

        const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true });
        await mkdir(artifactDirectory, { recursive: true });
        await writeFile(
            join(artifactDirectory, `noura-app-shell-${viewport.width}x${viewport.height}.png`),
            Buffer.from(screenshot.data, 'base64')
        );

        await evaluate("document.querySelector('.start-hero [data-next]').click()");
        for (let attempt = 0; attempt < 30; attempt += 1) {
            if (await evaluate("!document.getElementById('safety-gate').hidden")) break;
            await wait(50);
        }
        const initializedInteraction = await evaluate(`(() => ({
                startHidden: document.querySelector('.start-hero').hidden,
                safetyVisible: !document.getElementById('safety-gate').hidden,
                shellMode: document.querySelector('.app-shell').dataset.shellMode,
                navigationVisible: document.querySelector('.app-navigation').getBoundingClientRect().height > 0,
                brandVisible: document.querySelector('.app-brand').getBoundingClientRect().height > 0
            }))()`);
        assert.equal(initializedInteraction.startHidden, true);
        assert.equal(initializedInteraction.safetyVisible, true);
        assert.equal(initializedInteraction.shellMode, 'task');
        assert.equal(initializedInteraction.navigationVisible, !viewport.mobile);
        assert.equal(initializedInteraction.brandVisible, true);
        const taskStoreMode = await evaluate("globalThis[Symbol.for('noura.appState')].shellMode");
        assert.equal(taskStoreMode, 'task');

        const shellModeStates = await evaluate(`(async () => {
            const shell = document.querySelector('.app-shell');
            const navigation = document.querySelector('.app-navigation');
            const start = document.querySelector('.start-hero');
            const safety = document.getElementById('safety-gate');
            const result = document.getElementById('result');
            const planner = document.getElementById('weekly-planner');
            const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            safety.hidden = true;
            result.hidden = false;
            await nextFrame();
            const resultState = {
                mode: shell.dataset.shellMode,
                navigationVisible: navigation.getBoundingClientRect().height > 0
            };

            result.hidden = true;
            planner.hidden = false;
            await nextFrame();
            const plannerState = {
                mode: shell.dataset.shellMode,
                navigationVisible: navigation.getBoundingClientRect().height > 0,
                brandVisible: document.querySelector('.app-brand').getBoundingClientRect().height > 0
            };

            planner.hidden = true;
            start.hidden = false;
            await nextFrame();
            return { resultState, plannerState, restoredMode: shell.dataset.shellMode };
        })()`);
        assert.deepEqual(shellModeStates.resultState, { mode: 'result', navigationVisible: true });
        assert.deepEqual(shellModeStates.plannerState, {
            mode: 'planner',
            navigationVisible: !viewport.mobile,
            brandVisible: true
        });
        assert.equal(shellModeStates.restoredMode, 'entry');
    }

    await command('Page.navigate', { url: `http://127.0.0.1:${port}/app/#/not-available` });
    for (let attempt = 0; attempt < 50; attempt += 1) {
        if (await evaluate("location.hash === '#/calculator' && Boolean(document.querySelector('#calculator-form'))")) break;
        await wait(100);
    }
    const fallbackState = await evaluate(`({
        hash: location.hash,
        forms: document.querySelectorAll('#calculator-form').length,
        currentRoutes: document.querySelectorAll('[aria-current="page"]').length,
        focusedOutlet: document.activeElement?.id === 'workspace-outlet'
    })`);
    assert.equal(fallbackState.hash, '#/calculator');
    assert.equal(fallbackState.forms, 1);
    assert.equal(fallbackState.currentRoutes, 1);
    assert.equal(fallbackState.focusedOutlet, true);

    console.log('NOURA app shell browser tests passed');
} finally {
    socket?.close();
    chrome.kill();
    server.kill();
    await wait(500);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
