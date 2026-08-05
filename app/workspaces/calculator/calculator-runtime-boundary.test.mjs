import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const workspaceUrl = new URL('./', import.meta.url);
const entries = await readdir(workspaceUrl, { withFileTypes: true });
const runtimeFiles = entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => !name.endsWith('.test.mjs'))
    .filter(name => /\.(?:mjs|css|html)$/.test(name));

for (const fileName of runtimeFiles) {
    const source = await readFile(new URL(fileName, workspaceUrl), 'utf8');
    assert.doesNotMatch(source, /tools[\\/]kalorienrechner/, `${fileName} enthält eine Legacy-Runtime-Abhängigkeit`);
}

console.log('NOURA calculator runtime boundary tests passed');
