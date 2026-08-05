import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const read = relativePath => readFile(new URL(relativePath, import.meta.url));
const hash = content => createHash('sha256').update(content).digest('hex');

const [localTemplate, legacyDocument, workspaceModule] = await Promise.all([
    read('./calculator-template.html'),
    read('../../../tools/kalorienrechner/index.html'),
    read('./calculator-workspace.mjs')
]);

assert.equal(hash(localTemplate), hash(legacyDocument), 'Calculator-Vorlage weicht vom freigegebenen Legacy-Dokument ab');

const source = workspaceModule.toString('utf8');
assert.match(source, /fetch\(CALCULATOR_DOCUMENT_URL\)/);
assert.match(source, /new URL\('\.\/calculator-template\.html'/);
assert.doesNotMatch(source, /tools\/kalorienrechner|LEGACY_DOCUMENT_URL/);
assert.match(source, /new URL\(value, CALCULATOR_DOCUMENT_URL\)/);

console.log('NOURA calculator template contract tests passed');
