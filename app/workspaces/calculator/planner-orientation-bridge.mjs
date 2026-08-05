import { initWeeklyPlanner as initCoreWeeklyPlanner } from './weekly-planner-ui.mjs';
import { RESULT_MODES } from './calculator.mjs';

const PLANNER_MODES = new Set([RESULT_MODES.STANDARD, RESULT_MODES.POSTPARTUM_LOSS]);
let orientationSource = null;

export function getPlannerDailyTarget(orientation) {
    if (!orientation || !PLANNER_MODES.has(orientation.mode)) return null;
    return Number.isFinite(orientation.targetCalories) && orientation.targetCalories > 0
        ? orientation.targetCalories
        : null;
}

export function setPlannerOrientationSource(source) {
    orientationSource = source &&
        typeof source.subscribe === 'function' &&
        typeof source.getOrientation === 'function' &&
        typeof source.clearOrientation === 'function'
        ? source
        : null;
}

export function initWeeklyPlanner(options) {
    const planner = initCoreWeeklyPlanner(options);
    if (!orientationSource) return planner;

    let currentTarget;
    const applyOrientation = orientation => {
        const target = getPlannerDailyTarget(orientation);
        if (Object.is(target, currentTarget)) return;
        currentTarget = target;
        planner.setDailyTarget(target);
    };

    orientationSource.subscribe(applyOrientation);
    applyOrientation(orientationSource.getOrientation());

    return Object.freeze({
        ...planner,
        setDailyTarget(dailyTarget) {
            if (dailyTarget === null) orientationSource.clearOrientation();
        }
    });
}
