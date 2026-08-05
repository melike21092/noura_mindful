import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const read = relativePath => readFile(new URL(relativePath, import.meta.url), 'utf8');
const hash = content => createHash('sha256').update(content).digest('hex');

const [localCalculator, legacyCalculator, localWorkspace, legacyProduct, workspaceModule] = await Promise.all([
    read('./calculator.css'),
    read('../../../tools/kalorienrechner/calculator.css'),
    read('./calculator-workspace.css'),
    read('../../../tools/kalorienrechner/noura-product.css'),
    read('./calculator-workspace.mjs')
]);

assert.equal(
    localCalculator.replaceAll('../../assets/fonts/', 'assets/fonts/'),
    legacyCalculator,
    'Calculator-CSS darf außer den App-relativen Fontpfaden nicht von der freigegebenen Legacy-Quelle abweichen'
);
assert.equal(
    localWorkspace.replace('../../styles/noura-design-system.css', 'noura-design-system.css'),
    legacyProduct,
    'Workspace-Stylesheet darf außer dem App-relativen Designsystem-Pfad nicht abweichen'
);
assert.match(workspaceModule, /new URL\('\.\/calculator-workspace\.css\?v=20260801-1'/);
assert.doesNotMatch(workspaceModule, /tools\/kalorienrechner\/noura-product\.css/);

console.log('NOURA calculator style contract tests passed');
