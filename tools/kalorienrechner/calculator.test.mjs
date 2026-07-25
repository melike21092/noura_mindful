import assert from 'node:assert/strict';
import { calculateOrientation, parseGermanNumber, roundTo } from './calculator.mjs';

const baseInput = {
    age: 34,
    heightCm: 165,
    weightKg: 82.5,
    activity: 'mixed',
    lifePhase: 'none',
    obstacle: 'cravings',
    medicalFlag: false
};

assert.equal(parseGermanNumber('82,5'), 82.5, 'German decimal commas are supported');
assert.equal(roundTo(2073, 50), 2050, 'Energy values are rounded to calm 50 kcal steps');

const result = calculateOrientation(baseInput);
assert.equal(result.ok, true);
assert.equal(result.specialPhase, false);
assert.ok(result.resting > 1400 && result.resting < 1800);
assert.ok(result.maintenance.low < result.maintenance.high);
assert.ok(result.loss.low < result.loss.high);
assert.ok(result.loss.low > result.resting, 'The moderate range stays above estimated resting expenditure');
assert.ok(result.protein.low < result.protein.target);
assert.ok(result.protein.target < result.protein.high);
assert.ok(result.fat.target >= result.targetCalories * 0.25 / 9 - 5);
assert.ok(result.fat.target <= result.targetCalories * 0.35 / 9 + 5);
assert.ok(result.carbs.target > 0);
assert.equal(result.mission.lever, 'Abendlichen Essdrang verstehen');

const displayedEnergy =
    (result.protein.target * 4) +
    (result.fat.target * 9) +
    (result.carbs.target * 4);
assert.ok(Math.abs(displayedEnergy - result.targetCalories) <= 35, 'Rounded macros remain close to target calories');

for (const lifePhase of ['pregnant', 'breastfeeding', 'postpartum', 'unsure']) {
    const special = calculateOrientation({ ...baseInput, lifePhase });
    assert.equal(special.ok, true);
    assert.equal(special.specialPhase, true);
    assert.equal(special.loss, undefined);
    assert.equal(special.protein, undefined);
    assert.ok(special.mission.actions.every(action => !action.includes('Abnahmebereich')));
}

const medical = calculateOrientation({ ...baseInput, medicalFlag: true });
assert.equal(medical.ok, true);
assert.equal(medical.medicallyLimited, true);
assert.equal(medical.loss, undefined);

const capped = calculateOrientation({ ...baseInput, weightKg: 180 });
const bmiThirtyWeight = 30 * 1.65 * 1.65;
assert.ok(Math.abs(capped.calculationWeight - bmiThirtyWeight) < 0.2);

const invalid = calculateOrientation({ ...baseInput, age: 17, heightCm: 0 });
assert.equal(invalid.ok, false);
assert.ok(invalid.errors.age);
assert.ok(invalid.errors.heightCm);

console.log('NOURA calculator tests passed');
