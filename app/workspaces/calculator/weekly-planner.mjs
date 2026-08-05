import { getRecipeById, RECIPES } from './recipe-data.mjs';

export const PLANNED_BUDGET_RATIO = 0.80;
export const FLEX_BUDGET_RATIO = 0.20;
export const WEEKLY_PLAN_SCHEMA_VERSION = 1;
export const WEEKLY_PLAN_STORAGE_KEY = 'noura.weeklyPlan.v1';

export const BREAKFAST_PREFERENCES = Object.freeze({
    purple: Object.freeze({ label: 'Purple / leicht', recipeIds: Object.freeze(['metabolism-shake']) }),
    normal: Object.freeze({ label: 'Normales Frühstück', recipeIds: Object.freeze(['mukis-porridge']) }),
    flexible: Object.freeze({
        label: 'Flexibel',
        recipeIds: Object.freeze(['metabolism-shake', 'mukis-porridge', 'protein-pudding-oats'])
    })
});

const ALLOWED_MAIN_PAIRS = Object.freeze({
    purple: new Set(['green|yellow', 'green|orange', 'yellow|yellow', 'orange|yellow', 'orange|orange']),
    normal: new Set(['green|yellow', 'green|orange', 'yellow|yellow', 'orange|yellow', 'green|red'])
});

const DAY_ROTATION = Object.freeze([
    Object.freeze({ day: 'Montag', breakfastIndex: 0, lunchIndex: 0, dinnerIndex: 1, session: 1 }),
    Object.freeze({ day: 'Dienstag', breakfastIndex: 1, lunchIndex: 1, dinnerIndex: 0, session: 1 }),
    Object.freeze({ day: 'Mittwoch', breakfastIndex: 2, lunchIndex: 2, dinnerIndex: 3, session: 2 }),
    Object.freeze({ day: 'Donnerstag', breakfastIndex: 0, lunchIndex: 3, dinnerIndex: 2, session: 2 }),
    Object.freeze({ day: 'Freitag', breakfastIndex: 1, lunchIndex: 2, dinnerIndex: 3, session: 2 }),
    Object.freeze({ day: 'Samstag', breakfastIndex: 2, lunchIndex: 0, dinnerIndex: 2, session: 'Reste' }),
    Object.freeze({ day: 'Sonntag', breakfastIndex: 0, lunchIndex: 0, dinnerIndex: 1, session: 1 })
]);

function requirePositiveDailyTarget(dailyTarget) {
    if (!Number.isFinite(dailyTarget) || dailyTarget <= 0) {
        throw new TypeError('dailyTarget must be a positive finite number');
    }
}

function pairKey(firstClass, secondClass) {
    return [firstClass, secondClass].sort().join('|');
}

export function getBudgetSummary(dailyTarget) {
    requirePositiveDailyTarget(dailyTarget);
    return {
        dailyTarget,
        plannedBudget: Math.round(dailyTarget * PLANNED_BUDGET_RATIO),
        flexBudget: Math.round(dailyTarget * FLEX_BUDGET_RATIO)
    };
}

export function calculateFlexBudget(dailyTarget, plannedCalories) {
    requirePositiveDailyTarget(dailyTarget);
    if (!Number.isFinite(plannedCalories) || plannedCalories < 0) {
        throw new TypeError('plannedCalories must be a non-negative finite number');
    }
    return dailyTarget - plannedCalories;
}

export function getFlexStatus(dailyTarget, flexBudget) {
    requirePositiveDailyTarget(dailyTarget);
    if (!Number.isFinite(flexBudget)) throw new TypeError('flexBudget must be finite');
    const ratio = flexBudget / dailyTarget;
    if (ratio >= 0.20) return 'Viel Freiraum';
    if (ratio >= 0.10) return 'Passt gut';
    if (ratio >= 0) return 'Wenig Freiraum';
    return 'Über deinem Tagesbudget';
}

export function calculateDay(dailyTarget, breakfast, lunch, dinner) {
    for (const [label, recipe] of Object.entries({ breakfast, lunch, dinner })) {
        if (!recipe || !Number.isFinite(recipe.caloriesPerPortion) || recipe.caloriesPerPortion < 0) {
            throw new TypeError(`${label} must be a recipe with non-negative caloriesPerPortion`);
        }
    }
    const plannedCalories = breakfast.caloriesPerPortion + lunch.caloriesPerPortion + dinner.caloriesPerPortion;
    const flexBudget = calculateFlexBudget(dailyTarget, plannedCalories);
    return {
        plannedCalories,
        flexBudget,
        status: getFlexStatus(dailyTarget, flexBudget)
    };
}

export function isRecommendedPair(breakfastPreference, firstRecipe, secondRecipe) {
    if (!Object.hasOwn(BREAKFAST_PREFERENCES, breakfastPreference) || firstRecipe?.mealType !== 'main' || secondRecipe?.mealType !== 'main') {
        return false;
    }
    const key = pairKey(firstRecipe.calorieClass, secondRecipe.calorieClass);
    if (breakfastPreference === 'flexible') {
        return ALLOWED_MAIN_PAIRS.purple.has(key) && ALLOWED_MAIN_PAIRS.normal.has(key);
    }
    return ALLOWED_MAIN_PAIRS[breakfastPreference].has(key);
}

export function evaluateRecipePair({ dailyTarget, breakfastPreference, firstRecipe, secondRecipe, recipes = RECIPES }) {
    if (!Object.hasOwn(BREAKFAST_PREFERENCES, breakfastPreference)) throw new TypeError('Unknown breakfast preference');
    const preference = BREAKFAST_PREFERENCES[breakfastPreference];
    const breakfastCalories = Math.max(...preference.recipeIds.map(id => {
        const recipe = getRecipeById(id, recipes);
        if (!recipe) throw new TypeError(`Missing breakfast recipe: ${id}`);
        return recipe.caloriesPerPortion;
    }));
    const plannedCalories = breakfastCalories + firstRecipe.caloriesPerPortion + secondRecipe.caloriesPerPortion;
    const flexBudget = calculateFlexBudget(dailyTarget, plannedCalories);
    return {
        recommended: isRecommendedPair(breakfastPreference, firstRecipe, secondRecipe),
        plannedCalories,
        flexBudget,
        status: getFlexStatus(dailyTarget, flexBudget)
    };
}

export function getCompatibleMainRecipes({
    dailyTarget,
    breakfastPreference,
    firstRecipeId,
    excludedRecipeIds = [],
    recipes = RECIPES
}) {
    const firstRecipe = getRecipeById(firstRecipeId, recipes);
    if (!firstRecipe || firstRecipe.mealType !== 'main') return [];
    const excluded = new Set([firstRecipeId, ...excludedRecipeIds]);
    return recipes
        .filter(recipe => recipe.mealType === 'main' && !excluded.has(recipe.id))
        .map(recipe => ({
            recipe,
            evaluation: evaluateRecipePair({ dailyTarget, breakfastPreference, firstRecipe, secondRecipe: recipe, recipes })
        }))
        .filter(candidate => candidate.evaluation.recommended);
}

function resolvePlanConfig(config, recipes) {
    const { dailyTarget, breakfastPreference, recipeIds } = config ?? {};
    requirePositiveDailyTarget(dailyTarget);
    if (!Object.hasOwn(BREAKFAST_PREFERENCES, breakfastPreference)) throw new TypeError('Unknown breakfast preference');
    if (!Array.isArray(recipeIds) || recipeIds.length !== 4 || new Set(recipeIds).size !== 4) {
        throw new TypeError('Exactly four unique recipe IDs are required');
    }
    const mains = recipeIds.map(id => getRecipeById(id, recipes));
    if (mains.some(recipe => !recipe || recipe.mealType !== 'main')) {
        throw new TypeError('Every selected recipe must be a known main meal');
    }
    if (!isRecommendedPair(breakfastPreference, mains[0], mains[1]) ||
        !isRecommendedPair(breakfastPreference, mains[2], mains[3])) {
        throw new TypeError('Selected recipes do not form recommended session pairs');
    }
    const breakfastRecipes = BREAKFAST_PREFERENCES[breakfastPreference].recipeIds.map(id => {
        const recipe = getRecipeById(id, recipes);
        if (!recipe) throw new TypeError(`Missing breakfast recipe: ${id}`);
        return recipe;
    });
    return { dailyTarget, breakfastPreference, recipeIds: [...recipeIds], mains, breakfastRecipes };
}

export function createWeeklyPlan(config, recipes = RECIPES) {
    const resolved = resolvePlanConfig(config, recipes);
    const days = DAY_ROTATION.map(rotation => {
        const breakfast = resolved.breakfastRecipes[rotation.breakfastIndex % resolved.breakfastRecipes.length];
        const lunch = resolved.mains[rotation.lunchIndex];
        const dinner = resolved.mains[rotation.dinnerIndex];
        return {
            day: rotation.day,
            session: rotation.session,
            breakfast,
            lunch,
            dinner,
            ...calculateDay(resolved.dailyTarget, breakfast, lunch, dinner)
        };
    });
    return {
        schemaVersion: WEEKLY_PLAN_SCHEMA_VERSION,
        dailyTarget: resolved.dailyTarget,
        breakfastPreference: resolved.breakfastPreference,
        recipeIds: resolved.recipeIds,
        budget: getBudgetSummary(resolved.dailyTarget),
        days
    };
}

export function saveWeeklyPlan(storage, plan) {
    if (!storage || typeof storage.setItem !== 'function') throw new TypeError('A storage adapter is required');
    const persisted = {
        schemaVersion: WEEKLY_PLAN_SCHEMA_VERSION,
        dailyTarget: plan.dailyTarget,
        breakfastPreference: plan.breakfastPreference,
        recipeIds: [...plan.recipeIds]
    };
    storage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(persisted));
    return persisted;
}

export function loadWeeklyPlan(storage, recipes = RECIPES) {
    if (!storage || typeof storage.getItem !== 'function') return null;
    const raw = storage.getItem(WEEKLY_PLAN_STORAGE_KEY);
    if (!raw) return null;
    try {
        const persisted = JSON.parse(raw);
        if (persisted.schemaVersion !== WEEKLY_PLAN_SCHEMA_VERSION) return null;
        return createWeeklyPlan(persisted, recipes);
    } catch {
        return null;
    }
}
