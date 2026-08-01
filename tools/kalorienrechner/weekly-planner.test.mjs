import assert from 'node:assert/strict';
import { getCalorieClass, getRecipeById, RECIPES } from './recipe-data.mjs';
import {
    calculateDay,
    calculateFlexBudget,
    createWeeklyPlan,
    evaluateRecipePair,
    getBudgetSummary,
    getCompatibleMainRecipes,
    getFlexStatus,
    loadWeeklyPlan,
    saveWeeklyPlan,
    WEEKLY_PLAN_STORAGE_KEY
} from './weekly-planner.mjs';

const config = Object.freeze({
    dailyTarget: 1600,
    breakfastPreference: 'purple',
    recipeIds: Object.freeze(['lentil-soup', 'peanut-udon', 'salmon-spinach-pasta', 'lasagna-stew'])
});

const recipe = id => {
    const found = getRecipeById(id);
    assert.ok(found, `Missing test recipe ${id}`);
    return found;
};

// Recipe schema and numerical classification.
const requiredFields = [
    'id', 'name', 'source', 'sourceType', 'pageOrLink', 'caloriesPerPortion',
    'proteinPerPortion', 'mealType', 'calorieClass', 'mealPrep', 'childFriendly', 'preparationType'
];
assert.ok(RECIPES.length >= 8 && RECIPES.length <= 12, 'Prototype contains 8–12 recipes');
for (const item of RECIPES) {
    for (const field of requiredFields) assert.ok(Object.hasOwn(item, field), `${item.id} misses ${field}`);
    assert.equal(item.calorieClass, getCalorieClass(item.caloriesPerPortion, item.mealType), `${item.id} is not numerically classified`);
}
assert.equal(recipe('pastitsio').calorieClass, 'orange', '620 kcal is orange regardless of the historic Excel marker');
assert.equal(getCalorieClass(260, 'breakfast'), 'purple');
assert.equal(getCalorieClass(339, 'breakfast'), 'breakfast');
assert.equal(getCalorieClass(360, 'main'), 'green');
assert.equal(getCalorieClass(500, 'main'), 'yellow');
assert.equal(getCalorieClass(620, 'main'), 'orange');
assert.equal(getCalorieClass(680, 'main'), 'red');

// Unit tests for the 80/20 product rule, actual calories and statuses.
assert.deepEqual(getBudgetSummary(1600), { dailyTarget: 1600, plannedBudget: 1280, flexBudget: 320 });
assert.equal(calculateFlexBudget(1600, 1280), 320);
assert.equal(calculateFlexBudget(1600, 1650), -50);
assert.equal(getFlexStatus(1600, 320), 'Viel Freiraum');
assert.equal(getFlexStatus(1600, 319), 'Passt gut');
assert.equal(getFlexStatus(1600, 160), 'Passt gut');
assert.equal(getFlexStatus(1600, 159), 'Wenig Freiraum');
assert.equal(getFlexStatus(1600, 0), 'Wenig Freiraum');
assert.equal(getFlexStatus(1600, -1), 'Über deinem Tagesbudget');

const realCalorieDay = calculateDay(1600, recipe('metabolism-shake'), recipe('lentil-soup'), recipe('peanut-udon'));
assert.equal(realCalorieDay.plannedCalories, 1106);
assert.equal(realCalorieDay.flexBudget, 494);
assert.equal(realCalorieDay.status, 'Viel Freiraum');

const negativeDay = calculateDay(1600, recipe('mukis-porridge'), recipe('pastitsio'), recipe('maultaschen-pan'));
assert.equal(negativeDay.plannedCalories, 1639);
assert.equal(negativeDay.flexBudget, -39);
assert.equal(negativeDay.status, 'Über deinem Tagesbudget');

const sameColorLower = { caloriesPerPortion: 450 };
const sameColorHigher = { caloriesPerPortion: 549 };
const neutralBreakfast = { caloriesPerPortion: 300 };
const neutralMeal = { caloriesPerPortion: 400 };
assert.equal(calculateDay(1600, neutralBreakfast, sameColorHigher, neutralMeal).flexBudget, 351);
assert.equal(calculateDay(1600, neutralBreakfast, sameColorLower, neutralMeal).flexBudget, 450);

assert.equal(calculateDay(1700, neutralBreakfast, sameColorHigher, neutralMeal).flexBudget, 451);
assert.equal(calculateDay(1600, neutralBreakfast, sameColorHigher, neutralMeal).flexBudget, 351);

// Combination filtering uses class rules, while warnings use actual calories.
const compatible = getCompatibleMainRecipes({
    dailyTarget: 1600,
    breakfastPreference: 'normal',
    firstRecipeId: 'lentil-soup'
});
assert.ok(compatible.some(candidate => candidate.recipe.id === 'peanut-udon'));
assert.ok(compatible.some(candidate => candidate.recipe.id === 'maultaschen-pan'));
assert.ok(!compatible.some(candidate => candidate.recipe.id === 'lentil-soup'));
const evaluated = evaluateRecipePair({
    dailyTarget: 1200,
    breakfastPreference: 'normal',
    firstRecipe: recipe('lentil-soup'),
    secondRecipe: recipe('maultaschen-pan')
});
assert.equal(evaluated.recommended, true);
assert.equal(evaluated.plannedCalories, 1379);
assert.equal(evaluated.status, 'Über deinem Tagesbudget');

// Deterministic weekly integration and exact rotation.
const firstPlan = createWeeklyPlan(config);
const secondPlan = createWeeklyPlan(config);
assert.deepEqual(firstPlan, secondPlan, 'Equal inputs produce equal plans');
assert.equal(firstPlan.days.length, 7);
assert.deepEqual(firstPlan.days.map(day => day.day), [
    'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'
]);
for (const day of firstPlan.days.filter(day => ['Montag', 'Dienstag', 'Sonntag'].includes(day.day))) {
    assert.equal(day.session, 1);
    assert.ok(['lentil-soup', 'peanut-udon'].includes(day.lunch.id));
    assert.ok(['lentil-soup', 'peanut-udon'].includes(day.dinner.id));
}
for (const day of firstPlan.days.filter(day => ['Mittwoch', 'Donnerstag', 'Freitag'].includes(day.day))) {
    assert.equal(day.session, 2);
    assert.ok(['salmon-spinach-pasta', 'lasagna-stew'].includes(day.lunch.id));
    assert.ok(['salmon-spinach-pasta', 'lasagna-stew'].includes(day.dinner.id));
}
const saturday = firstPlan.days.find(day => day.day === 'Samstag');
assert.equal(saturday.session, 'Reste');
assert.equal(saturday.lunch.id, 'lentil-soup');
assert.equal(saturday.dinner.id, 'salmon-spinach-pasta');

// Property tests.
for (let calories = 0; calories < 2000; calories += 1) {
    const current = calculateFlexBudget(2000, calories);
    const higherRecipeBudget = calculateFlexBudget(2000, calories + 1);
    assert.ok(higherRecipeBudget <= current, `Higher planned calories increase flex at ${calories}`);
}
for (let dailyTarget = 1000; dailyTarget < 3000; dailyTarget += 1) {
    const current = calculateFlexBudget(dailyTarget, 900);
    const higherTarget = calculateFlexBudget(dailyTarget + 1, 900);
    assert.ok(higherTarget >= current, `Higher target lowers flex at ${dailyTarget}`);
}

// Persistence integration with an in-memory localStorage-compatible adapter.
const memory = new Map();
const storage = {
    getItem: key => memory.has(key) ? memory.get(key) : null,
    setItem: (key, value) => memory.set(key, String(value))
};
const persisted = saveWeeklyPlan(storage, firstPlan);
assert.deepEqual(Object.keys(persisted).sort(), ['breakfastPreference', 'dailyTarget', 'recipeIds', 'schemaVersion']);
assert.equal(memory.size, 1);
assert.ok(memory.has(WEEKLY_PLAN_STORAGE_KEY));
assert.deepEqual(loadWeeklyPlan(storage), firstPlan);
memory.set(WEEKLY_PLAN_STORAGE_KEY, '{invalid json');
assert.equal(loadWeeklyPlan(storage), null);

for (const invalid of [null, -1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => getBudgetSummary(invalid));
}
assert.throws(() => createWeeklyPlan({ ...config, breakfastPreference: '__proto__' }));
assert.throws(() => createWeeklyPlan({ ...config, recipeIds: ['lentil-soup'] }));

console.log('NOURA weekly planner tests passed');
