import assert from 'node:assert/strict';
import { getPlannerDailyTarget } from './planner-orientation-bridge.mjs';
import { RESULT_MODES } from './calculator.mjs';

assert.equal(getPlannerDailyTarget(null), null);
assert.equal(getPlannerDailyTarget({ mode: RESULT_MODES.STANDARD, targetCalories: 2100 }), 2100);
assert.equal(getPlannerDailyTarget({ mode: RESULT_MODES.POSTPARTUM_LOSS, targetCalories: 2300 }), 2300);
assert.equal(getPlannerDailyTarget({ mode: RESULT_MODES.EXCLUSIVE_BREASTFEEDING, targetCalories: 2400 }), null);
assert.equal(getPlannerDailyTarget({ mode: RESULT_MODES.PARTIAL_BREASTFEEDING, targetCalories: 2400 }), null);
assert.equal(getPlannerDailyTarget({ mode: RESULT_MODES.STANDARD, targetCalories: Number.NaN }), null);
assert.equal(getPlannerDailyTarget({ mode: RESULT_MODES.STANDARD, targetCalories: 0 }), null);

console.log('NOURA planner orientation bridge tests passed');
