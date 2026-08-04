import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
    calculateOrientation,
    RESULT_MODES
} from './calculator.mjs';

const [appEngine, legacyEngine, resultBridge, plannerBridge] = await Promise.all([
    readFile(new URL('./calculator.mjs', import.meta.url)),
    readFile(new URL('../../../tools/kalorienrechner/calculator.mjs', import.meta.url)),
    readFile(new URL('./calculator-result-bridge.mjs', import.meta.url), 'utf8'),
    readFile(new URL('./planner-orientation-bridge.mjs', import.meta.url), 'utf8')
]);

const hash = content => createHash('sha256').update(content).digest('hex');
const expectedHash = '9c46e1f826d33c9354713bc9e2fd4651453ca04a24fdcdbb14ddc3ae194a5759';
assert.equal(hash(appEngine), expectedHash);
assert.equal(hash(legacyEngine), expectedHash);
assert.equal(hash(appEngine), hash(legacyEngine));
assert.match(resultBridge, /from '\.\/calculator\.mjs'/);
assert.match(plannerBridge, /from '\.\/calculator\.mjs'/);
assert.doesNotMatch(`${resultBridge}\n${plannerBridge}`, /tools\/kalorienrechner\/calculator\.mjs/);

const result = calculateOrientation({
    sex: 'female',
    age: 34,
    heightCm: 165,
    weightKg: 69,
    dailyActivity: 'mixed',
    exactSteps: 10000,
    trainingSessions: 3,
    trainingMinutes: 60,
    trainingType: 'strength',
    goal: 'lose',
    obstacle: 'consistency',
    pregnant: 'no',
    birthWithin12Months: 'no',
    breastfeeding: 'no'
});
assert.equal(result.ok, true);
assert.equal(result.mode, RESULT_MODES.STANDARD);
assert.ok(Number.isFinite(result.targetCalories));

console.log('NOURA calculator engine contract tests passed');
