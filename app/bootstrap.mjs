import { createAppShell } from './shell/app-shell.mjs';
import { createRouter } from './shell/router.mjs';
import { APP_ROUTES } from './shell/route-config.mjs';
import { createAppStore } from './state/app-store.mjs';
import { selectActiveWorkspaceId, selectPersonalOrientation, selectShellMode } from './state/selectors.mjs';
import { mountCalculatorWorkspace } from './workspaces/calculator/calculator-workspace.mjs';

const root = document.getElementById('app');

if (!root) {
    throw new Error('NOURA App Shell: Mount-Punkt #app fehlt.');
}

const shell = createAppShell(root);
export const appStore = createAppStore();
const appStateKey = Symbol.for('noura.appState');
Object.defineProperty(globalThis, appStateKey, {
    configurable: false,
    enumerable: false,
    get: () => appStore.getState()
});

appStore.subscribe(state => {
    shell.setActiveRoute(selectActiveWorkspaceId(state));
    shell.setMode(selectShellMode(state));
});

const router = createRouter({
    routes: APP_ROUTES,
    onRoute: async route => {
        appStore.setActiveWorkspace(route.id);
        document.title = `NOURA – ${route.label}`;

        if (route.id === 'calculator') {
            await mountCalculatorWorkspace(shell.outlet, {
                onModeChange: appStore.setShellMode,
                onOrientation: appStore.setPersonalOrientation,
                orientationSource: {
                    getOrientation: () => selectPersonalOrientation(appStore.getState()),
                    subscribe: listener => appStore.subscribe(state => listener(selectPersonalOrientation(state))),
                    clearOrientation: appStore.clearPersonalOrientation
                }
            });
        }

        shell.outlet.focus({ preventScroll: true });
    }
});

router.start();
