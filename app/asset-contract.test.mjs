import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const pairs = [
    ['../tools/kalorienrechner/assets/noura-wordmark.svg', './assets/brand/noura-wordmark.svg'],
    ['../tools/kalorienrechner/assets/noura-mark.svg', './assets/brand/noura-mark.svg'],
    ['../tools/kalorienrechner/assets/n-logo.svg', './assets/brand/n-logo.svg'],
    ['../tools/kalorienrechner/assets/apple-touch-icon.png', './assets/brand/apple-touch-icon.png'],
    ['../tools/kalorienrechner/assets/fonts/Inter-Variable.ttf', './assets/fonts/Inter-Variable.ttf'],
    ['../tools/kalorienrechner/assets/fonts/PlayfairDisplay-Variable.ttf', './assets/fonts/PlayfairDisplay-Variable.ttf'],
    ['../tools/kalorienrechner/assets/fonts/OFL-Inter.txt', './assets/fonts/OFL-Inter.txt'],
    ['../tools/kalorienrechner/assets/fonts/OFL-PlayfairDisplay.txt', './assets/fonts/OFL-PlayfairDisplay.txt']
];

const hash = content => createHash('sha256').update(content).digest('hex');

for (const [legacyPath, appPath] of pairs) {
    const [legacy, app] = await Promise.all([
        readFile(new URL(legacyPath, import.meta.url)),
        readFile(new URL(appPath, import.meta.url))
    ]);
    assert.equal(hash(app), hash(legacy), `${appPath} weicht vom freigegebenen Quellasset ab`);
}

const [html, shell] = await Promise.all([
    readFile(new URL('./index.html', import.meta.url), 'utf8'),
    readFile(new URL('./shell/app-shell.mjs', import.meta.url), 'utf8')
]);
assert.match(html, /\.\/assets\/brand\/noura-mark\.svg/);
assert.match(html, /\.\/assets\/brand\/apple-touch-icon\.png/);
assert.match(shell, /\.\/assets\/brand\/noura-wordmark\.svg/);
assert.doesNotMatch(`${html}\n${shell}`, /tools\/kalorienrechner\/assets/);

console.log('NOURA app asset contract tests passed');
