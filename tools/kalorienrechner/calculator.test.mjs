import assert from 'node:assert/strict';
import {
    BASIS_ACTIVITY_RANGES,
    calculateDailyTrainingRange,
    calculateOrientation,
    determineResultMode,
    distributeProteinAnchors,
    getStepBand,
    getCtaContent,
    parseGermanNumber,
    RESULT_MODES,
    roundTo
} from './calculator.mjs';

const baseInput = {
    age: 34,
    heightCm: 165,
    weightKg: 82.5,
    dailyActivity: 'sedentary',
    stepBand: 'from4000to7000',
    exactSteps: '',
    trainingSessions: 0,
    trainingType: '',
    trainingMinutes: '',
    pregnant: 'no',
    birthWithin12Months: 'no',
    breastfeeding: 'no',
    obstacle: 'cravings',
    medicalFlag: false
};

assert.equal(parseGermanNumber('82,5'), 82.5, 'German decimal commas are supported');
assert.equal(roundTo(2073, 50), 2050, 'Energy values are rounded to calm 50 kcal steps');
assert.deepEqual(
    distributeProteinAnchors(95),
    { breakfast: 25, lunch: 30, snack: 15, dinner: 25 }
);
for (const target of [50, 75, 95, 115, 140]) {
    const anchors = Object.values(distributeProteinAnchors(target));
    assert.equal(
        anchors.reduce((sum, value) => sum + value, 0),
        target,
        `Protein anchors add up to ${target} g`
    );
}
assert.equal(getStepBand('unknown', 8000), 'from7000to10000', 'Exact steps override the selected band');
assert.deepEqual(
    calculateDailyTrainingRange(70, 0, '', ''),
    { low: 0, high: 0 },
    'No training adds no training energy'
);
assert.deepEqual(
    BASIS_ACTIVITY_RANGES.sedentary.from7000to10000,
    { min: 1.45, max: 1.5 },
    'The sedentary 7,000–10,000 step basis excludes structured training'
);
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
assert.match(result.cta.title, /Abend/);
assert.equal(result.cta.button, 'Meinen persönlichen Start besprechen');

const displayedEnergy =
    (result.protein.target * 4) +
    (result.fat.target * 9) +
    (result.carbs.target * 4);
assert.ok(Math.abs(displayedEnergy - result.targetCalories) <= 35, 'Rounded macros remain close to target calories');

const moderateActivityCase = calculateOrientation({
    ...baseInput,
    age: 33,
    heightCm: 165,
    weightKg: 69.5,
    dailyActivity: 'sedentary',
    stepBand: 'from7000to10000',
    exactSteps: 8000,
    trainingSessions: 3,
    trainingType: 'strength',
    trainingMinutes: 65
});
assert.equal(moderateActivityCase.resting, 1400);
assert.deepEqual(moderateActivityCase.maintenance, { low: 2100, high: 2250 });
assert.equal(moderateActivityCase.targetCalories, 1850);
assert.deepEqual(moderateActivityCase.loss, { low: 1800, high: 1900 });
assert.deepEqual(
    moderateActivityCase.activity.trainingDaily,
    { low: 81, high: 161 },
    'Training uses net MET energy and is distributed across seven days'
);
assert.equal(moderateActivityCase.activity.stepBand, 'from7000to10000');

const householdGymCase = calculateOrientation({
    ...baseInput,
    age: 33,
    heightCm: 165,
    weightKg: 69.5,
    dailyActivity: 'mixed',
    exactSteps: 9000,
    trainingSessions: 3,
    trainingType: 'mixed',
    trainingMinutes: 60
});
assert.deepEqual(householdGymCase.maintenance, { low: 2100, high: 2350 });
assert.equal(householdGymCase.targetCalories, 1900);
assert.deepEqual(
    householdGymCase.loss,
    { low: 1850, high: 1950 },
    'Household movement and 8,000–10,000 steps are not counted like a highly active occupation'
);

const sameCaseWithoutTraining = calculateOrientation({
    ...baseInput,
    age: 33,
    heightCm: 165,
    weightKg: 69.5,
    dailyActivity: 'sedentary',
    exactSteps: 8000,
    trainingSessions: 0
});
assert.deepEqual(
    sameCaseWithoutTraining.maintenance,
    { low: 2050, high: 2100 },
    'Steps affect the shared basis once; structured training is absent'
);

for (const [dailyActivity, stepRanges] of Object.entries(BASIS_ACTIVITY_RANGES)) {
    for (const stepBand of Object.keys(stepRanges)) {
        const matrixCase = calculateOrientation({
            ...baseInput,
            dailyActivity,
            stepBand,
            exactSteps: '',
            trainingSessions: 0
        });
        assert.equal(matrixCase.ok, true, `${dailyActivity}/${stepBand} is calculable`);
        assert.equal(matrixCase.activity.stepBand, stepBand);
    }
}

const incompleteTraining = calculateOrientation({
    ...baseInput,
    trainingSessions: 3,
    trainingType: '',
    trainingMinutes: ''
});
assert.equal(incompleteTraining.ok, false);
assert.ok(incompleteTraining.errors.trainingType);
assert.ok(incompleteTraining.errors.trainingMinutes);

const implausibleSteps = calculateOrientation({
    ...baseInput,
    exactSteps: 60000
});
assert.equal(implausibleSteps.ok, false);
assert.ok(implausibleSteps.errors.exactSteps);

const protectedCases = [
    {
        name: 'pregnancy first trimester',
        input: { ...baseInput, pregnant: 'yes', trimester: 'first', dailyActivity: '', obstacle: '' },
        mode: RESULT_MODES.PREGNANCY,
        guideline: 0
    },
    {
        name: 'pregnancy third trimester',
        input: { ...baseInput, pregnant: 'yes', trimester: 'third', dailyActivity: '', obstacle: '' },
        mode: RESULT_MODES.PREGNANCY,
        guideline: 500
    },
    {
        name: 'two weeks postpartum overrides breastfeeding',
        input: { ...baseInput, birthWithin12Months: 'yes', weeksPostpartum: 2, breastfeeding: 'exclusive', dailyActivity: '', obstacle: '' },
        mode: RESULT_MODES.EARLY_POSTPARTUM
    },
    {
        name: 'medical warning',
        input: { ...baseInput, medicalFlag: true, dailyActivity: '', obstacle: '' },
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
    assert.ok(protectedResult.cta?.title, testCase.name);
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
assert.match(exclusivelyBreastfeeding.cta.button, /Stillfreundliche/);

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
    dailyActivity: '',
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
assert.match(postpartumLoss.cta.title, /nach der Geburt/);

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
        dailyActivity: '',
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
    dailyActivity: '',
    obstacle: ''
});
assert.equal(missingTrimester.ok, false);
assert.ok(missingTrimester.errors.trimester);

assert.match(
    getCtaContent(RESULT_MODES.STANDARD, 'stress').title,
    /Stressessen/
);

const capped = calculateOrientation({ ...baseInput, weightKg: 180 });
const bmiThirtyWeight = 30 * 1.65 * 1.65;
assert.ok(Math.abs(capped.calculationWeight - bmiThirtyWeight) < 0.2);

const invalid = calculateOrientation({ ...baseInput, age: 17, heightCm: 0 });
assert.equal(invalid.ok, false);
assert.ok(invalid.errors.age);
assert.ok(invalid.errors.heightCm);

console.log('NOURA calculator tests passed');
