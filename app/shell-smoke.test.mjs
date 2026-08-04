import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relativePath => readFile(new URL(relativePath, import.meta.url), 'utf8');

const [html, bootstrap, shell, routes, router, outlet, styles, calculatorWorkspace, store, schema, selectors, bridge, plannerBridge] = await Promise.all([
    read('./index.html'),
    read('./bootstrap.mjs'),
    read('./shell/app-shell.mjs'),
    read('./shell/route-config.mjs'),
    read('./shell/router.mjs'),
    read('./shell/workspace-outlet.mjs'),
    read('./styles/app.css'),
    read('./workspaces/calculator/calculator-workspace.mjs'),
    read('./state/app-store.mjs'),
    read('./state/app-state-schema.mjs'),
    read('./state/selectors.mjs'),
    read('./workspaces/calculator/calculator-result-bridge.mjs'),
    read('./workspaces/calculator/planner-orientation-bridge.mjs')
]);

assert.match(html, /id="app"/);
assert.match(html, /\.\/assets\/brand\/noura-mark\.svg/);
assert.match(html, /\.\/assets\/brand\/apple-touch-icon\.png/);
assert.match(html, /href="#workspace-outlet"/);
assert.match(html, /type="module" src="\.\/bootstrap\.mjs"/);
assert.match(bootstrap, /createAppShell/);
assert.match(bootstrap, /createAppStore/);
assert.match(bootstrap, /onModeChange: appStore\.setShellMode/);
assert.match(bootstrap, /onOrientation: appStore\.setPersonalOrientation/);
assert.match(bootstrap, /getOrientation: \(\) => selectPersonalOrientation/);
assert.match(bootstrap, /clearOrientation: appStore\.clearPersonalOrientation/);
assert.match(bootstrap, /Symbol\.for\('noura\.appState'\)/);
assert.match(bootstrap, /Object\.defineProperty\(globalThis, appStateKey/);
assert.match(bootstrap, /createRouter/);
assert.match(shell, /aria-label', 'Hauptnavigation'/);
assert.match(shell, /\.\/assets\/brand\/noura-wordmark\.svg/);
assert.match(outlet, /id = 'workspace-outlet'/);
assert.match(routes, /id: 'calculator'/);
assert.match(routes, /path: '\/calculator'/);
assert.equal((routes.match(/id:/g) || []).length, 1, 'Release 1 darf nur den Rechner konfigurieren');
assert.doesNotMatch(routes, /Heute|Wochenplan|Rezepte|Einkauf/);
assert.doesNotMatch(`${html}\n${bootstrap}\n${shell}\n${outlet}`, /bottom-navigation|mobile-navigation/);
assert.doesNotMatch(`${bootstrap}\n${shell}`, /calculator\.mjs|weekly-planner|recipe-data/);
assert.match(styles, /noura-design-system\.css/);
assert.match(styles, /shell\.css/);
assert.doesNotMatch(styles, /tools\/kalorienrechner/);
assert.doesNotMatch(`${bootstrap}\n${shell}\n${outlet}\n${calculatorWorkspace}`, /localStorage|sessionStorage/);
assert.match(calculatorWorkspace, /fetch\(CALCULATOR_DOCUMENT_URL\)/);
assert.match(calculatorWorkspace, /\.\/calculator-template\.html/);
assert.match(calculatorWorkspace, /APP_BRAND_ASSET_URL/);
assert.match(calculatorWorkspace, /CALCULATOR_ASSET_URL/);
assert.match(calculatorWorkspace, /APP_SUPPORT_URL/);
assert.doesNotMatch(calculatorWorkspace, /tools\/kalorienrechner|LEGACY_DOCUMENT_URL/);
assert.match(calculatorWorkspace, /CALCULATOR_STYLESHEET_URL/);
assert.match(calculatorWorkspace, /\.\/calculator-workspace\.css/);
assert.doesNotMatch(calculatorWorkspace, /tools\/kalorienrechner\/noura-product\.css/);
assert.match(calculatorWorkspace, /mountedOutlets = new WeakSet/);
assert.match(calculatorWorkspace, /querySelector\('\.page-shell'\)/);
assert.match(calculatorWorkspace, /getCalculatorShellMode/);
assert.match(calculatorWorkspace, /MutationObserver/);
assert.match(calculatorWorkspace, /attributeFilter: \['hidden'\]/);
assert.match(calculatorWorkspace, /workspaceReady = 'true'/);
assert.doesNotMatch(calculatorWorkspace, /currentStep|directAnswers|calculator-form.*FormData/);
assert.match(shell, /setMode\(mode\)/);
assert.match(schema, /personalOrientation: null/);
assert.match(selectors, /selectPersonalOrientation/);
assert.doesNotMatch(`${store}\n${schema}\n${selectors}`, /localStorage|sessionStorage/);
assert.match(bridge, /calculateCoreOrientation\(input\)/);
assert.match(bridge, /publishOrientation\(result\)/);
assert.match(bridge, /from '\.\/calculator\.mjs'/);
assert.doesNotMatch(`${bridge}\n${plannerBridge}`, /tools\/kalorienrechner\/calculator\.mjs/);
assert.match(calculatorWorkspace, /PLANNER_BRIDGE_URL/);
assert.match(calculatorWorkspace, /setPlannerOrientationSource\(orientationSource\)/);
assert.match(plannerBridge, /initCoreWeeklyPlanner\(options\)/);
assert.match(plannerBridge, /from '\.\/weekly-planner-ui\.mjs'/);
assert.doesNotMatch(plannerBridge, /tools\/kalorienrechner/);
assert.match(plannerBridge, /orientationSource\.subscribe\(applyOrientation\)/);
assert.match(plannerBridge, /if \(dailyTarget === null\) orientationSource\.clearOrientation\(\)/);
assert.doesNotMatch(plannerBridge, /localStorage|sessionStorage|WEEKLY_PLAN_STORAGE_KEY/);
assert.match(router, /hashchange/);
assert.match(router, /replaceState/);
assert.doesNotMatch(router, /localStorage|sessionStorage/);

console.log('NOURA app shell smoke tests passed');
