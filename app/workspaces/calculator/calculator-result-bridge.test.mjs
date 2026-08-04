import assert from 'node:assert/strict';
import { calculateOrientation, setOrientationPublisher } from './calculator-result-bridge.mjs';

let published;
setOrientationPublisher(orientation => { published = orientation; });

const result = calculateOrientation({
    sex: 'female',
    age: 34,
    heightCm: 165,
    weightKg: 69,
    dailyActivity: 'mixed',
    exactSteps: 10000,
    trainingSessions: 3,
    trainingMinutes: 60,
    trainingType: 'strength',
    goal: 'lose',
    obstacle: 'consistency',
    pregnant: 'no',
    birthWithin12Months: 'no',
    breastfeeding: 'no'
});

assert.equal(published, result);
assert.ok(result.maintenance);
setOrientationPublisher(null);
console.log('NOURA calculator result bridge tests passed');
