import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "index.html"), "utf8");
const showcase = readFileSync(join(here, "design-system.html"), "utf8");
const entrypoint = readFileSync(join(here, "noura-product.css"), "utf8");

assert.match(
  html,
  /<body\s+class="noura-product"/,
  "The product must expose an explicit styling scope."
);
assert.match(
  html,
  /href="noura-product\.css\?v=[^"]+"/,
  "The product must load the single product stylesheet entrypoint."
);
assert.doesNotMatch(
  html,
  /href="(?:calculator|noura-design-system)\.css\?v=/,
  "Feature and system styles must not bypass the product entrypoint."
);
assert.doesNotMatch(
  entrypoint,
  /layer\(/,
  "Existing sources must remain unlayered until their specificity dependencies are migrated."
);

const legacyImport = entrypoint.indexOf('url("calculator.css');
const systemImport = entrypoint.indexOf('url("noura-design-system.css');
assert.ok(legacyImport >= 0 && systemImport > legacyImport, "System styles must follow legacy styles.");
assert.ok(entrypoint.indexOf('Phase 2: atmospheric entry') > systemImport, "Migrated shell components must follow the compatibility sources without adding a request.");
assert.match(
  entrypoint,
  /\.noura-product\s+\.brand::after\s*\{[^}]*display:\s*none;[^}]*content:\s*none;/s,
  "The retired MINDFUL NUTRITION descriptor must not reappear in the product shell."
);

assert.match(showcase, /href="noura-design-system\.css\?v=/);
assert.doesNotMatch(
  showcase,
  /href="(?:calculator|noura-product)\.css\?v=/,
  "The design-system reference must remain independent from product styling."
);

console.log("NOURA style architecture tests passed");
