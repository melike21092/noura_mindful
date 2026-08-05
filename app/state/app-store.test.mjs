import assert from 'node:assert/strict';
import { createAppStore } from './app-store.mjs';
import { APP_STATE_VERSION } from './app-state-schema.mjs';
import { selectActiveWorkspaceId, selectPersonalOrientation, selectShellMode } from './selectors.mjs';

const store = createAppStore();
const states = [];
const unsubscribe = store.subscribe(state => states.push(state));

assert.equal(store.getState().version, APP_STATE_VERSION);
assert.equal(selectActiveWorkspaceId(store.getState()), null);
assert.equal(selectShellMode(store.getState()), 'loading');
assert.equal(selectPersonalOrientation(store.getState()), null);

store.setActiveWorkspace('calculator');
store.setShellMode('entry');
const orientation = Object.freeze({ targetCalories: 2100, mode: 'deficit' });
store.setPersonalOrientation(orientation);

assert.equal(selectActiveWorkspaceId(store.getState()), 'calculator');
assert.equal(selectShellMode(store.getState()), 'entry');
assert.equal(selectPersonalOrientation(store.getState()), orientation);
assert.equal(states.length, 4);

store.setPersonalOrientation(orientation);
assert.equal(states.length, 4, 'Identische Wahrheit darf kein zweites Store-Update auslösen');
store.clearPersonalOrientation();
assert.equal(selectPersonalOrientation(store.getState()), null);
unsubscribe();

assert.doesNotMatch(`${createAppStore}`, /localStorage|sessionStorage/);
console.log('NOURA app store tests passed');
