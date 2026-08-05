import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const read = (path, encoding) => readFile(new URL(path, import.meta.url), encoding);
const [entry, shell, appDesignSystem, legacyDesignSystem, legacyProduct, workspaceProduct] = await Promise.all([
    read('./styles/app.css', 'utf8'),
    read('./styles/shell.css', 'utf8'),
    read('./styles/noura-design-system.css'),
    read('../tools/kalorienrechner/noura-design-system.css'),
    read('../tools/kalorienrechner/noura-product.css', 'utf8'),
    read('./workspaces/calculator/calculator-workspace.css', 'utf8')
]);

const imports = [...entry.matchAll(/@import\s+url\("([^"]+)"\)/g)].map(match => match[1]);
assert.deepEqual(imports, [
    './noura-design-system.css?v=20260801-5',
    './shell.css?v=20260803-1'
]);
assert.doesNotMatch(entry, /tools\/kalorienrechner/);
assert.doesNotMatch(shell, /@import/);
assert.match(shell, /\.app-shell/);
assert.match(shell, /\.app-navigation/);

const hash = content => createHash('sha256').update(content).digest('hex');
assert.equal(hash(appDesignSystem), hash(legacyDesignSystem), 'App-Designsystem weicht von der freigegebenen visuellen Quelle ab');
assert.match(legacyProduct, /@import url\("calculator\.css\?v=20260801-25"\);\s*@import url\("noura-design-system\.css\?v=20260801-5"\);/);
assert.match(workspaceProduct, /@import url\("calculator\.css\?v=20260801-25"\);\s*@import url\("\.\.\/\.\.\/styles\/noura-design-system\.css\?v=20260801-5"\);/);

console.log('NOURA app style entry tests passed');
