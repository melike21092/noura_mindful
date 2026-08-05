import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const hash = content => createHash('sha256').update(content).digest('hex');
const media = [
    '321946_medium.mp4',
    'noura-coach.webp',
    'hero-section.png',
    'noura-dawn-desktop.png',
    'noura-dawn-desktop.webp',
    'noura-dawn-mobile.png',
    'noura-dawn-mobile.webp',
    'noura-depth-background.jpg'
];

for (const assetName of media) {
    const [localAsset, legacyAsset] = await Promise.all([
        readFile(new URL(`./assets/${assetName}`, import.meta.url)),
        readFile(new URL(`../../../tools/kalorienrechner/assets/${assetName}`, import.meta.url))
    ]);
    assert.equal(hash(localAsset), hash(legacyAsset), `${assetName} weicht von der freigegebenen Legacy-Quelle ab`);
}

const [workspaceModule, calculatorStyles] = await Promise.all([
    readFile(new URL('./calculator-workspace.mjs', import.meta.url), 'utf8'),
    readFile(new URL('./calculator.css', import.meta.url), 'utf8')
]);
assert.match(workspaceModule, /APP_BRAND_ASSET_URL/);
assert.match(workspaceModule, /CALCULATOR_ASSET_URL/);
assert.match(calculatorStyles, /url\("\.\.\/\.\.\/assets\/fonts\/PlayfairDisplay-Variable\.ttf"\)/);
assert.match(calculatorStyles, /url\("\.\.\/\.\.\/assets\/fonts\/Inter-Variable\.ttf"\)/);

console.log('NOURA calculator asset contract tests passed');
