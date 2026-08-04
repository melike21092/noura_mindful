import assert from 'node:assert/strict';
import { findRoute, normalizeRouteHash } from './shell/router.mjs';
import { APP_ROUTES } from './shell/route-config.mjs';

assert.equal(normalizeRouteHash(''), '/calculator');
assert.equal(normalizeRouteHash('#/'), '/calculator');
assert.equal(normalizeRouteHash('#/calculator'), '/calculator');
assert.equal(normalizeRouteHash('#calculator'), '/calculator');
assert.equal(normalizeRouteHash('#/unknown'), '/unknown');
assert.equal(findRoute(APP_ROUTES, '#/calculator')?.id, 'calculator');
assert.equal(findRoute(APP_ROUTES, '#/unknown'), null);
assert.equal(APP_ROUTES.length, 1);
assert.equal(APP_ROUTES[0].href, '#/calculator');

console.log('NOURA router tests passed');
