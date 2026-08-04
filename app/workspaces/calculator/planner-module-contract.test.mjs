import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const hash = content => createHash('sha256').update(content).digest('hex');
const modules = ['weekly-planner-ui.mjs', 'weekly-planner.mjs', 'recipe-data.mjs'];

for (const moduleName of modules) {
    const [localModule, legacyModule] = await Promise.all([
        readFile(new URL(`./${moduleName}`, import.meta.url)),
        readFile(new URL(`../../../tools/kalorienrechner/${moduleName}`, import.meta.url))
    ]);
    assert.equal(hash(localModule), hash(legacyModule), `${moduleName} weicht von der freigegebenen Legacy-Quelle ab`);
}

const bridge = await readFile(new URL('./planner-orientation-bridge.mjs', import.meta.url), 'utf8');
assert.match(bridge, /from '\.\/weekly-planner-ui\.mjs'/);
assert.doesNotMatch(bridge, /tools\/kalorienrechner/);

console.log('NOURA planner module contract tests passed');
