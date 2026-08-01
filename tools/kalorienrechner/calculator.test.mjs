import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
    BASE_ACTIVITY_FACTORS,
    calculateAdditionalStepCalories,
    calculateDailyTrainingRange,
    calculateOrientation,
    determineResultMode,
    distributeProteinAnchors,
    getStepBand,
    getCtaContent,
    MISSIONS,
    normalizeInput,
    parseGermanNumber,
    RESULT_MODES,
    roundTo
} from './calculator.mjs';

const baseInput = {
    age: 34,
    heightCm: 165,
    weightKg: 82.5,
    sex: 'female',
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
assert.equal(BASE_ACTIVITY_FACTORS.sedentary, 1.35);
assert.equal(BASE_ACTIVITY_FACTORS.mixed, 1.45);
assert.equal(determineResultMode(baseInput), RESULT_MODES.STANDARD);

const result = calculateOrientation(baseInput);
assert.equal(result.ok, true);
assert.equal(result.mode, RESULT_MODES.STANDARD);
assert.ok(result.resting > 1400 && result.resting < 1800);
assert.ok(result.maintenance.low < result.maintenance.high);
assert.ok(result.loss.low < result.loss.high);
const rawResting = (10 * baseInput.weightKg) + (6.25 * baseInput.heightCm) - (5 * baseInput.age) - 161;
const rawEverydayBase = rawResting * BASE_ACTIVITY_FACTORS[baseInput.dailyActivity];
const rawSteps = calculateAdditionalStepCalories(baseInput.weightKg, baseInput.stepBand, baseInput.exactSteps).calories;
const rawMaintenanceMidpoint = rawEverydayBase + rawSteps;
assert.equal(
    result.targetCalories,
    roundTo(rawMaintenanceMidpoint * 0.85, 50),
    'The 15% start value uses the unrounded maintenance midpoint'
);
assert.equal(roundTo(1624.999, 50), 1600, 'Values just below a 50 kcal midpoint round down');
assert.equal(roundTo(1625, 50), 1650, 'Values at a 50 kcal midpoint round up');
assert.ok(result.protein.low < result.protein.target);
assert.ok(result.protein.target < result.protein.high);
assert.ok(result.fat.target >= result.targetCalories * 0.25 / 9 - 5);
assert.ok(result.fat.target <= result.targetCalories * 0.35 / 9 + 5);
assert.ok(result.carbs.target > 0);
assert.equal(result.mission.lever, 'Abendlichen Essdrang verstehen');
assert.match(result.cta.title, /Abend/);
assert.equal(result.cta.button, 'Meinen persönlichen Start besprechen');

for (const obstacle of Object.keys(MISSIONS)) {
    const missionResult = calculateOrientation({ ...baseInput, obstacle });
    assert.equal(missionResult.mission, MISSIONS[obstacle], `${obstacle} maps to its mission`);
    assert.equal(missionResult.mission.actions.length, 3, `${obstacle} has exactly three 7-day actions`);
    assert.ok(!missionResult.mission.actions.some(action => /Abnahmebereich|Kalorienzahl|21 Tage|drei Wochen/i.test(action)), `${obstacle} does not mix calorie validation into the 7-day mission`);
}

const displayedEnergy =
    (result.protein.target * 4) +
    (result.fat.target * 9) +
    (result.carbs.target * 4);
assert.ok(Math.abs(displayedEnergy - result.targetCalories) <= 35, 'Rounded macros remain close to target calories');

const referenceCases = {
    A: calculateOrientation({ ...baseInput, sex: 'female', age: 30, heightCm: 171, weightKg: 80, exactSteps: 6000, trainingSessions: 0 }),
    B: calculateOrientation({ ...baseInput, sex: 'female', age: 34, heightCm: 165, weightKg: 69, exactSteps: 10000, trainingSessions: 3, trainingType: 'strength', trainingMinutes: 60 }),
    C: calculateOrientation({ ...baseInput, sex: 'male', age: 38, heightCm: 188, weightKg: 88, exactSteps: 5500, trainingSessions: 2, trainingType: 'strength', trainingMinutes: 60 })
};

for (const [name, caseResult] of Object.entries(referenceCases)) {
    assert.equal(caseResult.ok, true, `${name} is calculable`);
    assert.ok(caseResult.maintenance.low >= 1500 && caseResult.maintenance.high <= 3000, `${name} has a plausible conservative maintenance range`);
    assert.ok(caseResult.targetCalories >= 1300 && caseResult.targetCalories <= 2500, `${name} has a plausible start value`);
    for (const key of ['restingEnergy', 'baseActivityFactor', 'everydayBase', 'additionalStepCalories', 'averageDailyTrainingCalories', 'maintenance', 'weightLossStart']) {
        assert.notEqual(caseResult.breakdown[key], undefined, `${name} exposes ${key}`);
    }
}

const fewerSteps = calculateOrientation({ ...baseInput, exactSteps: 3000 });
const moreSteps = calculateOrientation({ ...baseInput, exactSteps: 9000 });
assert.ok(moreSteps.breakdown.additionalStepCalories > fewerSteps.breakdown.additionalStepCalories, 'More steps increase energy needs');
assert.equal(fewerSteps.breakdown.additionalStepCalories, 0, 'Included steps create no surcharge');
assert.equal(calculateAdditionalStepCalories(70, 'under4000', 1000).calories, 0, 'Step surcharge is never negative');
assert.equal(
    calculateAdditionalStepCalories(70, 'over10000', 50000).additionalSteps,
    17000,
    'Step surcharge is capped at 17,000 additional steps'
);

const noTraining = calculateOrientation({ ...baseInput, exactSteps: 8000, trainingSessions: 0 });
const withTraining = calculateOrientation({ ...baseInput, exactSteps: 8000, trainingSessions: 3, trainingType: 'strength', trainingMinutes: 60 });
assert.ok(withTraining.breakdown.averageDailyTrainingCalories > 0, 'Training adds daily energy');
assert.ok(withTraining.targetCalories > noTraining.targetCalories, 'Training increases energy needs');
assert.equal(
    withTraining.breakdown.everydayBase,
    noTraining.breakdown.everydayBase,
    'Training does not alter or duplicate the everyday base'
);
assert.equal(
    withTraining.breakdown.additionalStepCalories,
    noTraining.breakdown.additionalStepCalories,
    'Training does not alter or duplicate step energy'
);

const female = calculateOrientation({ ...baseInput, sex: 'female' });
const male = calculateOrientation({ ...baseInput, sex: 'male' });
assert.equal(male.breakdown.restingEnergy - female.breakdown.restingEnergy, 166, 'Mifflin constants differ by 166 kcal');

const sedentary = calculateOrientation({ ...baseInput, dailyActivity: 'sedentary' });
const mixed = calculateOrientation({ ...baseInput, dailyActivity: 'mixed' });
assert.ok(sedentary.breakdown.everydayBase <= mixed.breakdown.everydayBase, 'Sedentary does not exceed mixed');

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
        mode: RESULT_MODES.PREGNANCY
    },
    {
        name: 'pregnancy third trimester',
        input: { ...baseInput, pregnant: 'yes', trimester: 'third', dailyActivity: '', obstacle: '' },
        mode: RESULT_MODES.PREGNANCY
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
}

for (const trimester of ['first', 'second', 'third', 'unsure']) {
    const pregnancy = calculateOrientation({
        ...baseInput,
        pregnant: 'yes',
        trimester,
        dailyActivity: '',
        obstacle: ''
    });
    assert.equal(pregnancy.ok, true, `pregnancy/${trimester}`);
    assert.equal(pregnancy.mode, RESULT_MODES.PREGNANCY, `pregnancy/${trimester}`);
    for (const forbidden of ['maintenance', 'loss', 'protein', 'fat', 'carbs', 'targetCalories', 'trimesterGuideline']) {
        assert.equal(pregnancy[forbidden], undefined, `pregnancy/${trimester} has no ${forbidden}`);
    }
}

const normalizedSafetyCases = [
    {
        name: 'medicalStatus overrides a false medicalFlag',
        input: { ...baseInput, medicalStatus: 'yes', medicalFlag: false }
    },
    {
        name: 'medicalFlag works without medicalStatus',
        input: { ...baseInput, medicalFlag: true }
    },
    {
        name: 'eatingDisorder is safety relevant',
        input: { ...baseInput, eatingDisorder: 'yes', medicalFlag: false }
    },
    {
        name: 'combined contradictory safety values remain protected',
        input: { ...baseInput, medicalStatus: 'no', medicalFlag: false, eatingDisorder: true }
    }
];

for (const testCase of normalizedSafetyCases) {
    const safety = calculateOrientation(testCase.input);
    assert.equal(safety.ok, true, testCase.name);
    assert.equal(safety.mode, RESULT_MODES.SAFETY, testCase.name);
    for (const forbidden of ['maintenance', 'loss', 'protein', 'fat', 'carbs', 'targetCalories']) {
        assert.equal(safety[forbidden], undefined, `${testCase.name} has no ${forbidden}`);
    }
}

assert.equal(
    normalizeInput({ medicalStatus: 'yes', medicalFlag: false }).medicalFlag,
    true,
    'a positive safety value cannot be negated by a contradictory false value'
);
assert.equal(
    determineResultMode({ ...baseInput, lifeStage: 'pregnant', pregnant: 'no' }),
    RESULT_MODES.PREGNANCY,
    'normalized lifeStage protects direct function calls'
);
assert.equal(
    determineResultMode({ ...baseInput, lifeStage: 'postpartum', weeksPostpartum: '5,5' }),
    RESULT_MODES.EARLY_POSTPARTUM,
    'lifeStage and German postpartum weeks are normalized before mode selection'
);

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

const fiveWeeksPostpartum = calculateOrientation({
    ...baseInput,
    birthWithin12Months: 'yes',
    weeksPostpartum: 5,
    breastfeeding: 'no',
    dailyActivity: '',
    obstacle: ''
});
assert.equal(fiveWeeksPostpartum.mode, RESULT_MODES.EARLY_POSTPARTUM);
assert.equal(fiveWeeksPostpartum.loss, undefined);

for (const weeksPostpartum of [6, 7, 20]) {
    const postpartumLoss = calculateOrientation({
        ...baseInput,
        birthWithin12Months: 'yes',
        weeksPostpartum,
        breastfeeding: 'no',
        recovered: 'yes',
        complications: 'no',
        advisedAgainstLoss: 'no'
    });
    assert.equal(postpartumLoss.mode, RESULT_MODES.POSTPARTUM_LOSS, `${weeksPostpartum} weeks postpartum`);
    assert.ok(postpartumLoss.loss, `${weeksPostpartum} weeks postpartum can continue after confirmation`);
    assert.match(postpartumLoss.cta.title, /nach der Geburt/);
}

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

const uiSource = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const calculationSource = await readFile(new URL('./calculator.mjs', import.meta.url), 'utf8');
for (const forbidden of [
    /Cortisol/i,
    /Hormonreparatur/i,
    /Stoffwechselsch(?:aden|ädigung)/i,
    /Reverse[- ]Diet/i,
    /Wochenkalorienbudget/i
]) {
    assert(!forbidden.test(uiSource) && !forbidden.test(calculationSource), `Unzulässige Produktbotschaft gefunden: ${forbidden}`);
}
assert(!/targetCalories\s*=\s*Math\.max/i.test(calculationSource), 'Eine BMR-Hard-Cap ist im Berechnungskern vorhanden');

console.log('NOURA calculator tests passed');
