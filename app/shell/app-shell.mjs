import { APP_ROUTES } from './route-config.mjs';
import { createWorkspaceOutlet } from './workspace-outlet.mjs';

function createBrandLink() {
    const brand = document.createElement('a');
    brand.className = 'app-brand';
    brand.href = './index.html';
    brand.setAttribute('aria-label', 'NOURA App');
    brand.innerHTML = `
        <img src="./assets/brand/noura-wordmark.svg" alt="" aria-hidden="true">
    `;
    return brand;
}

function createNavigation() {
    const navigation = document.createElement('nav');
    navigation.className = 'app-navigation';
    navigation.setAttribute('aria-label', 'Hauptnavigation');

    const list = document.createElement('ul');
    for (const route of APP_ROUTES) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = route.href;
        link.textContent = route.label;
        link.dataset.routeId = route.id;
        item.append(link);
        list.append(item);
    }

    navigation.append(list);
    return navigation;
}

export function createAppShell(root) {
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.dataset.shellMode = 'loading';

    const header = document.createElement('header');
    header.className = 'app-header';
    header.append(createBrandLink(), createNavigation());

    const outlet = createWorkspaceOutlet();
    shell.append(header, outlet);
    root.replaceChildren(shell);

    return {
        outlet,
        setActiveRoute(routeId) {
            for (const link of header.querySelectorAll('[data-route-id]')) {
                if (link.dataset.routeId === routeId) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            }
        },
        setMode(mode) {
            shell.dataset.shellMode = mode;
        }
    };
}
