import {
    calculateOrientation as calculateCoreOrientation,
    distributeProteinAnchors,
    RESULT_MODES,
    roundTo
} from './calculator.mjs';

let publishOrientation = () => {};

export { distributeProteinAnchors, RESULT_MODES, roundTo };

export function setOrientationPublisher(publisher) {
    publishOrientation = typeof publisher === 'function' ? publisher : () => {};
}

export function calculateOrientation(input) {
    const result = calculateCoreOrientation(input);
    publishOrientation(result);
    return result;
}
