export function normalizeRouteHash(hash = '') {
    const value = hash.replace(/^#/, '').trim();
    if (!value || value === '/') return '/calculator';
    return value.startsWith('/') ? value : `/${value}`;
}

export function findRoute(routes, hash) {
    const path = normalizeRouteHash(hash);
    return routes.find(route => route.path === path) || null;
}

export function createRouter({ routes, onRoute, windowRef = window }) {
    if (!Array.isArray(routes) || routes.length === 0) throw new TypeError('Router benötigt mindestens eine Route.');
    if (typeof onRoute !== 'function') throw new TypeError('Router benötigt einen onRoute-Handler.');

    const fallbackRoute = routes[0];
    let currentRouteId = null;

    async function resolve() {
        const route = findRoute(routes, windowRef.location.hash);
        if (!route) {
            windowRef.history.replaceState(null, '', fallbackRoute.href);
            return resolve();
        }

        if (windowRef.location.hash !== route.href) {
            windowRef.history.replaceState(null, '', route.href);
        }

        if (currentRouteId === route.id) return route;
        currentRouteId = route.id;
        await onRoute(route);
        return route;
    }

    function start() {
        windowRef.addEventListener('hashchange', resolve);
        return resolve();
    }

    function stop() {
        windowRef.removeEventListener('hashchange', resolve);
    }

    return { start, stop, resolve };
}
