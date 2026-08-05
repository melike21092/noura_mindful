const CALCULATOR_DOCUMENT_URL = new URL('./calculator-template.html', import.meta.url);
const CALCULATOR_STYLESHEET_URL = new URL('./calculator-workspace.css?v=20260801-1', import.meta.url);
const APP_BRAND_ASSET_URL = new URL('../../assets/brand/', import.meta.url);
const CALCULATOR_ASSET_URL = new URL('./assets/', import.meta.url);
const APP_SUPPORT_URL = new URL('../../support/', import.meta.url);
const CALCULATOR_BRIDGE_URL = new URL('./calculator-result-bridge.mjs', import.meta.url);
const PLANNER_BRIDGE_URL = new URL('./planner-orientation-bridge.mjs', import.meta.url);
const mountedOutlets = new WeakSet();

export function getCalculatorShellMode(outlet) {
    if (outlet.querySelector('#weekly-planner:not([hidden])')) return 'planner';
    if (outlet.querySelector('#result:not([hidden])')) return 'result';
    if (outlet.querySelector('.start-hero:not([hidden])')) return 'entry';
    return 'task';
}

function observeCalculatorShellMode(outlet, onModeChange) {
    if (typeof onModeChange !== 'function') return;
    let currentMode;
    const publish = () => {
        const mode = getCalculatorShellMode(outlet);
        if (mode === currentMode) return;
        currentMode = mode;
        onModeChange(mode);
    };
    const observer = new MutationObserver(publish);
    observer.observe(outlet, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    publish();
}

function toAbsoluteUrl(value) {
    if (!value || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)) return value;
    if (value.startsWith('assets/')) {
        const assetPath = value.slice('assets/'.length);
        const brandAssets = new Set(['apple-touch-icon.png', 'n-logo.svg', 'noura-mark.svg', 'noura-wordmark.svg']);
        return new URL(assetPath, brandAssets.has(assetPath.split('#')[0]) ? APP_BRAND_ASSET_URL : CALCULATOR_ASSET_URL).href;
    }
    if (new Set(['impressum.html', 'datenschutz.html', 'design-system.html']).has(value)) {
        return new URL(value, APP_SUPPORT_URL).href;
    }
    return new URL(value, CALCULATOR_DOCUMENT_URL).href;
}

function resolveWorkspaceUrls(workspace) {
    for (const element of workspace.querySelectorAll('[src], [href]')) {
        for (const attribute of ['src', 'href']) {
            if (element.hasAttribute(attribute)) {
                element.setAttribute(attribute, toAbsoluteUrl(element.getAttribute(attribute)));
            }
        }
    }
}

function loadLegacyStylesheet() {
    const href = CALCULATOR_STYLESHEET_URL.href;
    const existing = [...document.styleSheets].some(sheet => sheet.href === href);
    if (existing) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.calculatorWorkspaceStyle = '';
        link.addEventListener('load', resolve, { once: true });
        link.addEventListener('error', () => reject(new Error('Rechner-Stylesheet konnte nicht geladen werden.')), { once: true });
        document.head.append(link);
    });
}

function resolveModuleImports(source) {
    return source.replace(
        /from\s+(['"])(\.\/[^'"]+)\1/g,
        (_match, quote, specifier) => {
            const url = specifier === './calculator.mjs'
                ? CALCULATOR_BRIDGE_URL
                : specifier === './weekly-planner-ui.mjs'
                    ? PLANNER_BRIDGE_URL
                : new URL(specifier, CALCULATOR_DOCUMENT_URL);
            return `from ${quote}${url.href}${quote}`;
        }
    );
}

async function runLegacyModule(source) {
    const moduleUrl = URL.createObjectURL(new Blob([resolveModuleImports(source)], { type: 'text/javascript' }));
    try {
        await import(moduleUrl);
    } finally {
        URL.revokeObjectURL(moduleUrl);
    }
}

export async function mountCalculatorWorkspace(outlet, { onModeChange, onOrientation, orientationSource } = {}) {
    if (!(outlet instanceof HTMLElement)) throw new TypeError('Calculator Workspace benötigt ein HTMLElement als Outlet.');
    if (mountedOutlets.has(outlet)) return;

    const response = await fetch(CALCULATOR_DOCUMENT_URL);
    if (!response.ok) throw new Error(`Rechner konnte nicht geladen werden (${response.status}).`);

    const legacyDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const workspace = legacyDocument.querySelector('.page-shell');
    const legacyModule = legacyDocument.querySelector('script[type="module"]');
    if (!workspace || !legacyModule?.textContent) throw new Error('Der bestehende Rechner erfüllt den erwarteten Workspace-Vertrag nicht.');

    await loadLegacyStylesheet();
    const { setOrientationPublisher } = await import(CALCULATOR_BRIDGE_URL);
    const { setPlannerOrientationSource } = await import(PLANNER_BRIDGE_URL);
    setOrientationPublisher(onOrientation);
    setPlannerOrientationSource(orientationSource);
    resolveWorkspaceUrls(legacyDocument.body);
    const workspaceNodes = [...legacyDocument.body.children]
        .filter(element => element.tagName !== 'SCRIPT')
        .map(element => document.importNode(element, true));
    document.body.classList.add('noura-product');
    outlet.removeAttribute('aria-label');
    outlet.replaceChildren(...workspaceNodes);
    await runLegacyModule(legacyModule.textContent);
    observeCalculatorShellMode(outlet, onModeChange);
    outlet.dataset.workspaceReady = 'true';
    mountedOutlets.add(outlet);
}
