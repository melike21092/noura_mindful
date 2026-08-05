import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readLocal = name => readFile(new URL(`./${name}`, import.meta.url), 'utf8');
const readLegacy = name => readFile(new URL(`../../tools/kalorienrechner/${name}`, import.meta.url), 'utf8');

const normalizeAppPaths = content => content
    .replaceAll('../assets/brand/', 'assets/')
    .replaceAll('../styles/noura-design-system.css', 'noura-design-system.css')
    .replaceAll('../#/calculator', 'index.html');

for (const pageName of ['impressum.html', 'datenschutz.html', 'design-system.html']) {
    const [localPage, legacyPage] = await Promise.all([readLocal(pageName), readLegacy(pageName)]);
    assert.equal(normalizeAppPaths(localPage), legacyPage, `${pageName} darf außer App-relativen Ressourcen- und Rücklinks nicht abweichen`);
}

for (const fileName of ['legal.css', 'design-system-showcase.css', 'NOURA_DESIGN_SYSTEM.md']) {
    const [localFile, legacyFile] = await Promise.all([readLocal(fileName), readLegacy(fileName)]);
    assert.equal(localFile, legacyFile, `${fileName} weicht von der freigegebenen Legacy-Quelle ab`);
}

console.log('NOURA app support contract tests passed');
