import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relativePath => readFile(new URL(relativePath, import.meta.url), 'utf8');
const [rootDocument, appDocument, serviceWorker, manifest, appBootstrap] = await Promise.all([
    read('../index.html'),
    read('./index.html'),
    read('../sw.js'),
    read('../manifest.json'),
    read('./bootstrap.mjs')
]);

assert.match(rootDocument, /<title>NOURA \| Dein Dashboard<\/title>/, 'Bestehender Root-Dashboard-Einstieg wurde unerwartet ersetzt');
assert.match(rootDocument, /href="manifest\.json"/, 'Bestehende Root-PWA-Verknüpfung fehlt');
assert.match(manifest, /"start_url"\s*:\s*"\."/, 'Bestehender PWA-Startpunkt wurde unerwartet geändert');
assert.doesNotMatch(serviceWorker, /['"]\.\/app\//, 'Root-Service-Worker darf die App-Shell vor dem expliziten Cutover nicht precachen');

assert.match(appDocument, /<div id="app"/);
assert.match(appDocument, /src="\.\/bootstrap\.mjs"/);
assert.match(appBootstrap, /createAppShell/);
assert.match(appBootstrap, /createRouter/);
assert.match(appBootstrap, /mountCalculatorWorkspace/);

console.log('NOURA cutover readiness tests passed');
