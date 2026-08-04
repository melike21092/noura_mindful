import { CALORIE_CLASSES, getMainRecipes, RECIPES } from './recipe-data.mjs';
import {
    BREAKFAST_PREFERENCES,
    createWeeklyPlan,
    getBudgetSummary,
    getCompatibleMainRecipes,
    loadWeeklyPlan,
    saveWeeklyPlan
} from './weekly-planner.mjs';

const formatNumber = value => new Intl.NumberFormat('de-DE').format(value);
const formatKcal = value => `${formatNumber(value)} kcal`;

export function initWeeklyPlanner({ resultSection, storage = window.localStorage } = {}) {
    const planner = document.getElementById('weekly-planner');
    const launch = document.getElementById('weekly-planner-launch');
    if (!planner || !launch || !resultSection) throw new Error('Weekly planner DOM is incomplete');

    const panels = [...planner.querySelectorAll('[data-planner-step]')];
    const preferenceInputs = [...planner.querySelectorAll('[name="plannerBreakfast"]')];
    const selects = {
        a: document.getElementById('planner-recipe-a'),
        b: document.getElementById('planner-recipe-b'),
        c: document.getElementById('planner-recipe-c'),
        d: document.getElementById('planner-recipe-d')
    };
    const state = {
        dailyTarget: null,
        step: 1,
        breakfastPreference: '',
        recipeIds: []
    };

    function setText(id, value) {
        document.getElementById(id).textContent = value;
    }

    function showStep(step) {
        state.step = step;
        panels.forEach(panel => { panel.hidden = Number(panel.dataset.plannerStep) !== step; });
        const heading = planner.querySelector(`[data-planner-step="${step}"] h2, [data-planner-step="${step}"] h3`);
        heading?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clearPlannerError() {
        setText('weekly-planner-error', '');
    }

    function selectedPreference() {
        return preferenceInputs.find(input => input.checked)?.value ?? '';
    }

    function recipeOption(recipe, suffix = '') {
        const option = document.createElement('option');
        option.value = recipe.id;
        option.textContent = `${recipe.name} · ${formatKcal(recipe.caloriesPerPortion)}${suffix}`;
        return option;
    }

    function setRecipeOptions(select, candidates, selectedId = '') {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Gericht auswählen';
        select.replaceChildren(placeholder, ...candidates.map(candidate => {
            if (candidate.recipe) {
                const warning = ['Wenig Freiraum', 'Über deinem Tagesbudget'].includes(candidate.evaluation.status)
                    ? ` · ${candidate.evaluation.status}`
                    : '';
                return recipeOption(candidate.recipe, warning);
            }
            return recipeOption(candidate);
        }));
        if ([...select.options].some(option => option.value === selectedId)) select.value = selectedId;
    }

    function populateSessionOne() {
        const mains = getMainRecipes().filter(recipe => getCompatibleMainRecipes({
            dailyTarget: state.dailyTarget,
            breakfastPreference: selectedPreference(),
            firstRecipeId: recipe.id
        }).length > 0);
        setRecipeOptions(selects.a, mains, selects.a.value);
        const candidates = getCompatibleMainRecipes({
            dailyTarget: state.dailyTarget,
            breakfastPreference: selectedPreference(),
            firstRecipeId: selects.a.value
        });
        setRecipeOptions(selects.b, candidates, selects.b.value);
    }

    function populateSessionTwo() {
        const excluded = [selects.a.value, selects.b.value].filter(Boolean);
        const mains = getMainRecipes().filter(recipe =>
            !excluded.includes(recipe.id) &&
            getCompatibleMainRecipes({
                dailyTarget: state.dailyTarget,
                breakfastPreference: selectedPreference(),
                firstRecipeId: recipe.id,
                excludedRecipeIds: excluded
            }).length > 0
        );
        setRecipeOptions(selects.c, mains, selects.c.value);
        const candidates = getCompatibleMainRecipes({
            dailyTarget: state.dailyTarget,
            breakfastPreference: selectedPreference(),
            firstRecipeId: selects.c.value,
            excludedRecipeIds: excluded
        });
        setRecipeOptions(selects.d, candidates, selects.d.value);
    }

    function renderBudget() {
        const budget = getBudgetSummary(state.dailyTarget);
        setText('planner-daily-budget', formatKcal(budget.dailyTarget));
        setText('planner-planned-budget', `ca. ${formatKcal(budget.plannedBudget)}`);
        setText('planner-flex-budget', `ca. ${formatKcal(budget.flexBudget)}`);
    }

    function renderWeeklyPlan(plan, loaded = false) {
        const container = document.getElementById('weekly-plan-days');
        container.replaceChildren(...plan.days.map(day => {
            const article = document.createElement('article');
            article.className = 'weekly-plan-day';
            const title = document.createElement('h3');
            title.textContent = day.day;
            const session = document.createElement('span');
            session.className = 'weekly-plan-day__session';
            session.textContent = day.session === 'Reste' ? 'Flexibel / Reste' : `Kochsession ${day.session}`;
            const meals = document.createElement('dl');
            meals.append(
                createMealRow('Frühstück', day.breakfast.name),
                createMealRow('Mittagessen', day.lunch.name),
                createMealRow('Abendessen', day.dinner.name)
            );
            const totals = document.createElement('div');
            totals.className = 'weekly-plan-day__totals';
            const planned = document.createElement('span');
            planned.textContent = `Geplant: ${formatKcal(day.plannedCalories)}`;
            const flex = document.createElement('strong');
            flex.textContent = `Flex: ${formatKcal(day.flexBudget)}`;
            const status = document.createElement('span');
            status.className = `weekly-plan-status weekly-plan-status--${statusSlug(day.status)}`;
            status.textContent = day.status;
            totals.append(planned, flex, status);
            article.append(title, session, meals, totals);
            return article;
        }));
        state.breakfastPreference = plan.breakfastPreference;
        state.recipeIds = [...plan.recipeIds];
        setText('weekly-planner-save-status', loaded ? 'Dein lokal gespeicherter Plan wurde geladen.' : '');
        showStep(4);
    }

    function createMealRow(label, value) {
        const wrapper = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        wrapper.append(term, description);
        return wrapper;
    }

    function statusSlug(status) {
        return {
            'Viel Freiraum': 'wide',
            'Passt gut': 'good',
            'Wenig Freiraum': 'low',
            'Über deinem Tagesbudget': 'over'
        }[status] ?? 'good';
    }

    function resetSelections() {
        state.breakfastPreference = '';
        state.recipeIds = [];
        preferenceInputs.forEach(input => { input.checked = false; });
        Object.values(selects).forEach(select => setRecipeOptions(select, []));
        clearPlannerError();
        setText('weekly-planner-save-status', '');
    }

    function openPlanner() {
        if (!Number.isFinite(state.dailyTarget) || state.dailyTarget <= 0) return;
        resultSection.hidden = true;
        planner.hidden = false;
        renderBudget();
        const stored = loadWeeklyPlan(storage, RECIPES);
        if (stored?.dailyTarget === state.dailyTarget) {
            preferenceInputs.forEach(input => { input.checked = input.value === stored.breakfastPreference; });
            [selects.a.value, selects.b.value, selects.c.value, selects.d.value] = stored.recipeIds;
            renderWeeklyPlan(stored, true);
            return;
        }
        resetSelections();
        showStep(1);
    }

    launch.addEventListener('click', openPlanner);
    launch.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openPlanner();
    });
    document.getElementById('weekly-planner-close').addEventListener('click', () => {
        planner.hidden = true;
        resultSection.hidden = false;
        window.scrollTo({ top: 0, behavior: 'auto' });
        launch.focus({ preventScroll: true });
    });
    document.getElementById('planner-breakfast-next').addEventListener('click', () => {
        const preference = selectedPreference();
        if (!Object.hasOwn(BREAKFAST_PREFERENCES, preference)) {
            setText('weekly-planner-error', 'Bitte wähle einen Frühstücksbaustein.');
            preferenceInputs[0].focus();
            return;
        }
        clearPlannerError();
        state.breakfastPreference = preference;
        populateSessionOne();
        showStep(2);
    });
    document.getElementById('planner-session-one-next').addEventListener('click', () => {
        if (!selects.a.value || !selects.b.value) {
            setText('weekly-planner-error', 'Bitte wähle für Kochsession 1 zwei passende Gerichte.');
            (!selects.a.value ? selects.a : selects.b).focus();
            return;
        }
        clearPlannerError();
        populateSessionTwo();
        showStep(3);
    });
    document.getElementById('planner-create').addEventListener('click', () => {
        if (!selects.c.value || !selects.d.value) {
            setText('weekly-planner-error', 'Bitte wähle für Kochsession 2 zwei passende Gerichte.');
            (!selects.c.value ? selects.c : selects.d).focus();
            return;
        }
        clearPlannerError();
        try {
            const plan = createWeeklyPlan({
                dailyTarget: state.dailyTarget,
                breakfastPreference: selectedPreference(),
                recipeIds: [selects.a.value, selects.b.value, selects.c.value, selects.d.value]
            });
            renderWeeklyPlan(plan);
        } catch {
            setText('weekly-planner-error', 'Diese Kombination ist nicht verfügbar. Bitte prüfe deine Auswahl.');
        }
    });
    document.getElementById('planner-save').addEventListener('click', () => {
        const plan = createWeeklyPlan({
            dailyTarget: state.dailyTarget,
            breakfastPreference: state.breakfastPreference,
            recipeIds: state.recipeIds
        });
        saveWeeklyPlan(storage, plan);
        setText('weekly-planner-save-status', 'Dein Wochenplan ist nur in diesem Browser gespeichert.');
    });
    document.getElementById('planner-new').addEventListener('click', () => {
        resetSelections();
        showStep(1);
    });
    planner.querySelectorAll('[data-planner-back]').forEach(button => {
        button.addEventListener('click', () => {
            clearPlannerError();
            showStep(Number(button.dataset.plannerBack));
        });
    });
    preferenceInputs.forEach(input => input.addEventListener('change', clearPlannerError));
    selects.a.addEventListener('change', () => {
        setRecipeOptions(selects.b, []);
        setRecipeOptions(selects.c, []);
        setRecipeOptions(selects.d, []);
        populateSessionOne();
    });
    selects.b.addEventListener('change', () => {
        setRecipeOptions(selects.c, []);
        setRecipeOptions(selects.d, []);
    });
    selects.c.addEventListener('change', populateSessionTwo);

    launch.hidden = true;

    return {
        setDailyTarget(dailyTarget) {
            state.dailyTarget = Number.isFinite(dailyTarget) && dailyTarget > 0 ? dailyTarget : null;
            launch.hidden = state.dailyTarget === null;
            if (state.dailyTarget === null) {
                planner.hidden = true;
                resetSelections();
            }
        },
        close() {
            planner.hidden = true;
        }
    };
}
