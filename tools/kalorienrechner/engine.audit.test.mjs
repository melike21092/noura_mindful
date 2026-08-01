import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import {
    BASE_ACTIVITY_FACTORS,
    calculateAdditionalStepCalories,
    calculateOrientation,
    getStepBand,
    MAX_STEP_SURCHARGE_STEPS,
    RESULT_MODES,
    roundTo,
    validateInputs
} from './calculator.mjs';

const standardInput = Object.freeze({
    sex: 'female',
    age: 34,
    heightCm: 165,
    weightKg: 69,
    dailyActivity: 'sedentary',
    stepBand: 'unknown',
    exactSteps: 6000,
    trainingSessions: 0,
    trainingType: '',
    trainingMinutes: '',
    pregnant: 'no',
    birthWithin12Months: 'no',
    breastfeeding: 'no',
    obstacle: 'unsure',
    medicalFlag: false
});

const calculate = overrides => calculateOrientation({ ...standardInput, ...overrides });
const assertCalculated = (result, label) => {
    assert.equal(result.ok, true, `${label}: calculation failed`);
    assert.equal(result.mode, RESULT_MODES.STANDARD, `${label}: unexpected mode`);
    assert.ok(result.breakdown && result.maintenance && result.loss, `${label}: incomplete calculation`);
};

const numericLeaves = (value, path = 'result', leaves = []) => {
    if (typeof value === 'number') leaves.push([path, value]);
    else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) numericLeaves(child, `${path}.${key}`, leaves);
    }
    return leaves;
};

const assertFiniteNonNegativeOutput = (result, label) => {
    for (const [path, value] of numericLeaves(result)) {
        assert.ok(Number.isFinite(value), `${label}: ${path} is not finite (${value})`);
        assert.ok(value >= 0, `${label}: ${path} is negative (${value})`);
    }
};

// Unit and security regression tests.
for (const poison of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    assert.equal(calculate({ dailyActivity: poison }).ok, false, `${poison} bypasses activity validation`);
    assert.equal(calculate({ stepBand: poison, exactSteps: '' }).ok, false, `${poison} bypasses step-band validation`);
    assert.equal(calculate({ trainingSessions: 1, trainingType: poison, trainingMinutes: 60 }).ok, false, `${poison} bypasses training validation`);
    assert.equal(calculate({ obstacle: poison }).ok, false, `${poison} bypasses mission validation`);
}

assert.equal(roundTo(1624.999, 50), 1600);
assert.equal(roundTo(1625, 50), 1650);
assert.equal(calculateAdditionalStepCalories(70, 'unknown', 2999).calories, 0);
assert.equal(calculateAdditionalStepCalories(70, 'unknown', 3000).calories, 0);
assert.ok(calculateAdditionalStepCalories(70, 'unknown', 3001).calories > 0);
assert.equal(calculateAdditionalStepCalories(70, 'unknown', 50000).additionalSteps, MAX_STEP_SURCHARGE_STEPS);

// Boundary and parsing tests.
const boundaryCases = [
    ['age 17', { age: 17 }, false],
    ['age 18', { age: 18 }, true],
    ['age 79', { age: 79 }, true],
    ['age 80', { age: 80 }, true],
    ['age 81', { age: 81 }, false],
    ['decimal age', { age: '34,5' }, false],
    ['height 129', { heightCm: 129 }, false],
    ['height 130', { heightCm: 130, weightKg: 40 }, true],
    ['height 220', { heightCm: 220, weightKg: 100 }, true],
    ['height 221', { heightCm: 221 }, false],
    ['weight 40', { weightKg: 40 }, true],
    ['weight 180', { weightKg: 180 }, true],
    ['zero training', { trainingSessions: 0 }, true],
    ['one training', { trainingSessions: 1, trainingType: 'strength', trainingMinutes: 10 }, true],
    ['seven trainings', { trainingSessions: 7, trainingType: 'cardio', trainingMinutes: 180 }, true],
    ['eight trainings', { trainingSessions: 8, trainingType: 'cardio', trainingMinutes: 60 }, false],
    ['50,000 steps', { exactSteps: 50000 }, true],
    ['50,001 steps', { exactSteps: 50001 }, false],
    ['negative steps', { exactSteps: -1 }, false],
    ['negative training', { trainingSessions: -1 }, false],
    ['German decimal weight', { weightKg: '69,5' }, true],
    ['dot decimal weight', { weightKg: '69.5' }, true],
    ['text age', { age: 'vierunddreißig' }, false],
    ['empty age', { age: '' }, false],
    ['Infinity weight', { weightKg: 'Infinity' }, false]
];

for (const [label, overrides, expectedValid] of boundaryCases) {
    assert.equal(validateInputs({ ...standardInput, ...overrides }).valid, expectedValid, label);
}

for (const [steps, expectedBand] of [
    [2999, 'under4000'], [3000, 'under4000'], [3999, 'under4000'],
    [4000, 'from4000to7000'], [6999, 'from4000to7000'],
    [7000, 'from7000to10000'], [9999, 'from7000to10000'],
    [10000, 'from7000to10000'], [10001, 'over10000']
]) {
    assert.equal(getStepBand('unknown', steps), expectedBand, `${steps} step boundary`);
}

// Property tests: monotonic inputs and bounded rounding transitions.
let previous = calculate({ exactSteps: 0 });
for (let steps = 1; steps <= 50000; steps += 1) {
    const current = calculate({ exactSteps: steps });
    assertCalculated(current, `${steps} steps`);
    assert.ok(current.targetCalories >= previous.targetCalories, `target decreases at ${steps} steps`);
    assert.ok(current.targetCalories - previous.targetCalories <= 50, `rounding jump exceeds 50 kcal at ${steps} steps`);
    assert.ok(current.breakdown.additionalStepCalories >= 0, `negative step surcharge at ${steps}`);
    previous = current;
}

previous = calculate({ trainingSessions: 0 });
for (let sessions = 1; sessions <= 7; sessions += 1) {
    const current = calculate({ trainingSessions: sessions, trainingType: 'strength', trainingMinutes: 60 });
    assert.ok(current.targetCalories >= previous.targetCalories, `target decreases at ${sessions} sessions`);
    previous = current;
}

previous = calculate({ trainingSessions: 1, trainingType: 'strength', trainingMinutes: 10 });
for (let minutes = 11; minutes <= 180; minutes += 1) {
    const current = calculate({ trainingSessions: 1, trainingType: 'strength', trainingMinutes: minutes });
    assert.ok(current.targetCalories >= previous.targetCalories, `target decreases at ${minutes} training minutes`);
    previous = current;
}

let previousResting = -Infinity;
for (let weightKg = 40; weightKg <= 180; weightKg += 1) {
    const result = calculate({ heightCm: 130, weightKg });
    assertCalculated(result, `${weightKg} kg`);
    assert.ok(result.breakdown.restingEnergy >= previousResting, `resting energy decreases at ${weightKg} kg`);
    previousResting = result.breakdown.restingEnergy;
}

previousResting = -Infinity;
for (let heightCm = 130; heightCm <= 220; heightCm += 1) {
    const result = calculate({ heightCm, weightKg: 180 });
    assertCalculated(result, `${heightCm} cm`);
    assert.ok(result.breakdown.restingEnergy >= previousResting, `resting energy decreases at ${heightCm} cm`);
    previousResting = result.breakdown.restingEnergy;
}

const female = calculate({ sex: 'female' });
const male = calculate({ sex: 'male' });
assert.equal(male.breakdown.restingEnergy - female.breakdown.restingEnergy, 166, 'Mifflin sex constants are not distinct');

for (const activity of Object.keys(BASE_ACTIVITY_FACTORS)) {
    const result = calculate({ dailyActivity: activity, exactSteps: 10000, trainingSessions: 3, trainingType: 'mixed', trainingMinutes: 60 });
    assertCalculated(result, activity);
    assertFiniteNonNegativeOutput(result, activity);
    const macroEnergy = result.protein.target * 4 + result.fat.target * 9 + result.carbs.target * 4;
    assert.ok(Math.abs(macroEnergy - result.targetCalories) <= 35, `${activity}: macros differ from displayed target by ${macroEnergy - result.targetCalories} kcal`);
}

const extremeTraining = calculate({ weightKg: 300, heightCm: 130, trainingSessions: 7, trainingType: 'cardio', trainingMinutes: 180 });
assertCalculated(extremeTraining, 'extreme training');
assert.equal(extremeTraining.breakdown.assumptions.trainingWasCapped, true);
assert.ok(extremeTraining.breakdown.averageDailyTrainingCalories <= extremeTraining.breakdown.assumptions.trainingCalorieCap);

const underweight = calculate({ sex: 'female', age: 25, heightCm: 170, weightKg: 50 });
assert.equal(underweight.ok, true);
assert.equal(underweight.mode, RESULT_MODES.SAFETY);
assert.equal(underweight.targetCalories, undefined, 'underweight case receives an automatic deficit');

// Deterministic fuzz test: 1,000 complete, valid adult profiles.
const FUZZ_SEED = 0x4e4f5552;
let randomState = FUZZ_SEED >>> 0;
const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000;
};
const integer = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const activities = Object.keys(BASE_ACTIVITY_FACTORS);
const trainingTypes = ['strength', 'cardio', 'mixed'];

for (let index = 0; index < 1000; index += 1) {
    const heightCm = integer(130, 220);
    const minimumHealthyWeight = Math.max(35, Math.ceil(18.5 * ((heightCm / 100) ** 2) * 10) / 10);
    const trainingSessions = integer(0, 7);
    const person = {
        sex: random() < 0.5 ? 'female' : 'male',
        age: integer(18, 80),
        heightCm,
        weightKg: Math.min(300, minimumHealthyWeight + random() * (300 - minimumHealthyWeight)),
        dailyActivity: activities[integer(0, activities.length - 1)],
        exactSteps: integer(0, 50000),
        trainingSessions,
        trainingType: trainingSessions ? trainingTypes[integer(0, trainingTypes.length - 1)] : '',
        trainingMinutes: trainingSessions ? integer(10, 180) : ''
    };
    let result;
    try {
        result = calculate(person);
    } catch (error) {
        throw new Error(`Fuzz seed ${FUZZ_SEED}, case ${index}, person ${JSON.stringify(person)} threw: ${error.stack}`);
    }
    assertCalculated(result, `fuzz seed ${FUZZ_SEED}, case ${index}, person ${JSON.stringify(person)}`);
    assertFiniteNonNegativeOutput(result, `fuzz seed ${FUZZ_SEED}, case ${index}`);
    assert.ok(result.breakdown.restingEnergy >= 500 && result.breakdown.restingEnergy <= 5000, `fuzz case ${index}: implausible resting energy`);
    assert.ok(result.maintenance.low >= 500 && result.maintenance.high <= 12000, `fuzz case ${index}: implausible maintenance`);
    assert.ok(result.targetCalories >= 500 && result.targetCalories <= 10000, `fuzz case ${index}: implausible target`);
}

// Physiological reality checks. These are broad guardrails, not validation data.
const realityProfiles = [
    ['sitting office woman', { sex: 'female', age: 35, heightCm: 168, weightKg: 68, dailyActivity: 'sedentary', exactSteps: 6000 }, 1700, 2400],
    ['mother', { sex: 'female', age: 38, heightCm: 165, weightKg: 75, dailyActivity: 'sedentary', exactSteps: 7500 }, 1800, 2500],
    ['saleswoman', { sex: 'female', age: 42, heightCm: 170, weightKg: 72, dailyActivity: 'standing', exactSteps: 10000 }, 2100, 2900],
    ['nurse', { sex: 'female', age: 35, heightCm: 168, weightKg: 70, dailyActivity: 'standing', exactSteps: 9000 }, 2100, 2900],
    ['student', { sex: 'female', age: 23, heightCm: 170, weightKg: 60, dailyActivity: 'mixed', exactSteps: 8000 }, 1800, 2600],
    ['craftsman', { sex: 'male', age: 40, heightCm: 180, weightKg: 90, dailyActivity: 'strenuous', exactSteps: 12000 }, 2900, 4200],
    ['office man', { sex: 'male', age: 45, heightCm: 180, weightKg: 85, dailyActivity: 'sedentary', exactSteps: 5500 }, 2100, 2900],
    ['strength athlete', { sex: 'male', age: 30, heightCm: 185, weightKg: 95, dailyActivity: 'mixed', exactSteps: 9000, trainingSessions: 4, trainingType: 'strength', trainingMinutes: 75 }, 2700, 3900],
    ['obese person', { sex: 'female', age: 45, heightCm: 165, weightKg: 150, dailyActivity: 'sedentary', exactSteps: 4000 }, 2500, 3600]
];

for (const [label, profile, minimum, maximum] of realityProfiles) {
    const result = calculate(profile);
    assertCalculated(result, label);
    assert.ok(result.maintenance.low >= minimum, `${label}: maintenance low ${result.maintenance.low} below ${minimum}`);
    assert.ok(result.maintenance.high <= maximum, `${label}: maintenance high ${result.maintenance.high} above ${maximum}`);
}

// Static performance budgets protect the dependency-free first load from silent bloat.
for (const [relativePath, maximumBytes] of [
    ['./index.html', 120_000],
    ['./calculator.css', 120_000],
    ['./calculator.mjs', 50_000],
    ['./assets/noura-dawn-mobile.webp', 100_000],
    ['./assets/noura-dawn-desktop.webp', 100_000],
    ['./assets/321946_medium.mp4', 5_000_000]
]) {
    const file = await stat(new URL(relativePath, import.meta.url));
    assert.ok(file.size <= maximumBytes, `${relativePath} exceeds performance budget: ${file.size} > ${maximumBytes} bytes`);
}

console.log(`NOURA engine audit tests passed (1,000 fuzz cases, seed ${FUZZ_SEED})`);
