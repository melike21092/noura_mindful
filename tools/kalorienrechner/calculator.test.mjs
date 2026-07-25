import assert from 'node:assert/strict';
import {
    calculateOrientation,
    determineResultMode,
    parseGermanNumber,
    RESULT_MODES,
    roundTo
} from './calculator.mjs';

const baseInput = {
    age: 34,
    heightCm: 165,
    weightKg: 82.5,
    activity: 'mixed',
    pregnant: 'no',
    birthWithin12Months: 'no',
    breastfeeding: 'no',
    obstacle: 'cravings',
    medicalFlag: false
};

assert.equal(parseGermanNumber('82,5'), 82.5, 'German decimal commas are supported');
assert.equal(roundTo(2073, 50), 2050, 'Energy values are rounded to calm 50 kcal steps');
assert.equal(determineResultMode(baseInput), RESULT_MODES.STANDARD);

const result = calculateOrientation(baseInput);
assert.equal(result.ok, true);
assert.equal(result.mode, RESULT_MODES.STANDARD);
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

const protectedCases = [
    {
        name: 'pregnancy first trimester',
        input: { ...baseInput, pregnant: 'yes', trimester: 'first', activity: '', obstacle: '' },
        mode: RESULT_MODES.PREGNANCY,
        guideline: 0
    },
    {
        name: 'pregnancy third trimester',
        input: { ...baseInput, pregnant: 'yes', trimester: 'third', activity: '', obstacle: '' },
        mode: RESULT_MODES.PREGNANCY,
        guideline: 500
    },
    {
        name: 'two weeks postpartum overrides breastfeeding',
        input: { ...baseInput, birthWithin12Months: 'yes', weeksPostpartum: 2, breastfeeding: 'exclusive', activity: '', obstacle: '' },
        mode: RESULT_MODES.EARLY_POSTPARTUM
    },
    {
        name: 'medical warning',
        input: { ...baseInput, medicalFlag: true, activity: '', obstacle: '' },
        mode: RESULT_MODES.SAFETY
    }
];

for (const testCase of protectedCases) {
    const protectedResult = calculateOrientation(testCase.input);
    assert.equal(protectedResult.ok, true, testCase.name);
    assert.equal(protectedResult.mode, testCase.mode, testCase.name);
    assert.equal(protectedResult.maintenance, undefined, testCase.name);
    assert.equal(protectedResult.loss, undefined, testCase.name);
    assert.equal(protectedResult.protein, undefined, testCase.name);
    assert.equal(protectedResult.mission, undefined, testCase.name);
    assert.ok(protectedResult.guidance, testCase.name);
    if ('guideline' in testCase) assert.equal(protectedResult.trimesterGuideline, testCase.guideline);
}

const exclusivelyBreastfeeding = calculateOrientation({
    ...baseInput,
    birthWithin12Months: 'yes',
    weeksPostpartum: 20,
    breastfeeding: 'exclusive',
    obstacle: ''
});
assert.equal(exclusivelyBreastfeeding.mode, RESULT_MODES.EXCLUSIVE_BREASTFEEDING);
assert.ok(exclusivelyBreastfeeding.maintenance);
assert.equal(exclusivelyBreastfeeding.loss, undefined);
assert.equal(exclusivelyBreastfeeding.targetCalories, undefined);

const partiallyBreastfeeding = calculateOrientation({
    ...baseInput,
    birthWithin12Months: 'yes',
    weeksPostpartum: 20,
    breastfeeding: 'partial',
    obstacle: ''
});
assert.equal(partiallyBreastfeeding.mode, RESULT_MODES.PARTIAL_BREASTFEEDING);
assert.ok(partiallyBreastfeeding.maintenance);
assert.equal(partiallyBreastfeeding.loss, undefined);

const sixWeeksPostpartum = calculateOrientation({
    ...baseInput,
    birthWithin12Months: 'yes',
    weeksPostpartum: 6,
    breastfeeding: 'no',
    activity: '',
    obstacle: ''
});
assert.equal(sixWeeksPostpartum.mode, RESULT_MODES.EARLY_POSTPARTUM);
assert.equal(sixWeeksPostpartum.loss, undefined);

const postpartumLoss = calculateOrientation({
    ...baseInput,
    birthWithin12Months: 'yes',
    weeksPostpartum: 20,
    breastfeeding: 'no',
    recovered: 'yes',
    complications: 'no',
    advisedAgainstLoss: 'no'
});
assert.equal(postpartumLoss.mode, RESULT_MODES.POSTPARTUM_LOSS);
assert.ok(postpartumLoss.loss);

for (const warning of [
    { recovered: 'no', complications: 'no', advisedAgainstLoss: 'no' },
    { recovered: 'yes', complications: 'yes', advisedAgainstLoss: 'no' },
    { recovered: 'yes', complications: 'no', advisedAgainstLoss: 'yes' },
    { recovered: 'unsure', complications: 'no', advisedAgainstLoss: 'no' }
]) {
    const safety = calculateOrientation({
        ...baseInput,
        birthWithin12Months: 'yes',
        weeksPostpartum: 20,
        breastfeeding: 'no',
        ...warning,
        activity: '',
        obstacle: ''
    });
    assert.equal(safety.mode, RESULT_MODES.SAFETY);
    assert.equal(safety.loss, undefined);
}

assert.equal(determineResultMode({
    ...baseInput,
    birthWithin12Months: 'no',
    breastfeeding: 'exclusive'
}), RESULT_MODES.EXCLUSIVE_BREASTFEEDING, 'Breastfeeding can continue beyond twelve months');

const invalidPostpartumWeeks = calculateOrientation({
    ...baseInput,
    birthWithin12Months: 'yes',
    weeksPostpartum: 53,
    breastfeeding: 'no'
});
assert.equal(invalidPostpartumWeeks.ok, false);
assert.ok(invalidPostpartumWeeks.errors.weeksPostpartum);

const missingTrimester = calculateOrientation({
    ...baseInput,
    pregnant: 'yes',
    trimester: '',
    activity: '',
    obstacle: ''
});
assert.equal(missingTrimester.ok, false);
assert.ok(missingTrimester.errors.trimester);

const capped = calculateOrientation({ ...baseInput, weightKg: 180 });
const bmiThirtyWeight = 30 * 1.65 * 1.65;
assert.ok(Math.abs(capped.calculationWeight - bmiThirtyWeight) < 0.2);

const invalid = calculateOrientation({ ...baseInput, age: 17, heightCm: 0 });
assert.equal(invalid.ok, false);
assert.ok(invalid.errors.age);
assert.ok(invalid.errors.heightCm);

console.log('NOURA calculator tests passed');
