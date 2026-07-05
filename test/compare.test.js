import assert from "node:assert/strict";
import test from "node:test";
import { compareContract } from "../src/compare.js";
import { formatSarif } from "../src/format.js";

const cleanPackage = {
  path: "node_modules/alpha",
  name: "alpha",
  version: "1.0.0",
  resolved: "https://registry.npmjs.org/alpha/-/alpha-1.0.0.tgz",
  integrity: "sha512-good",
  source: "https",
  hasInstallScript: false,
  dev: false,
  optional: false,
  link: false
};

const contract = {
  policy: {
    allowedHosts: ["registry.npmjs.org"],
    allowGit: false,
    allowHttp: false,
    requireIntegrity: true,
    allowNewInstallScripts: false
  },
  packages: [cleanPackage]
};

test("passes an unchanged graph", () => {
  const result = compareContract(contract, [cleanPackage]);
  assert.equal(result.ok, true);
  assert.equal(result.changes.length, 0);
});

test("reports dependency and integrity changes", () => {
  const changed = { ...cleanPackage, version: "1.1.0", integrity: "sha512-new" };
  const result = compareContract(contract, [changed]);
  assert.equal(result.ok, false);
  assert.equal(result.summary.changed, 2);
  assert.deepEqual(result.changes.map((item) => item.field), ["version", "integrity"]);
});

test("blocks new install scripts", () => {
  const scripted = {
    ...cleanPackage,
    path: "node_modules/native-addon",
    name: "native-addon",
    hasInstallScript: true
  };
  const result = compareContract(contract, [cleanPackage, scripted]);
  assert.equal(result.summary.added, 1);
  assert.ok(result.violations.some((item) => item.rule === "allowNewInstallScripts"));
});

test("blocks unapproved hosts and insecure sources", () => {
  const packageFromMirror = {
    ...cleanPackage,
    resolved: "http://mirror.invalid/alpha.tgz",
    source: "http"
  };
  const result = compareContract(contract, [packageFromMirror]);
  assert.ok(result.violations.some((item) => item.rule === "allowHttp"));
  assert.ok(result.violations.some((item) => item.rule === "allowedHosts"));
});

test("formats policy violations as SARIF", () => {
  const packageFromMirror = {
    ...cleanPackage,
    resolved: "http://mirror.invalid/alpha.tgz",
    source: "http"
  };
  const result = compareContract(contract, [packageFromMirror]);
  const sarif = JSON.parse(formatSarif(result));
  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].tool.driver.name, "dep-contract");
  assert.ok(sarif.runs[0].results.some((item) => item.ruleId === "allowHttp"));
  assert.ok(sarif.runs[0].results.every((item) => item.locations[0].physicalLocation.artifactLocation.uri === "package-lock.json"));
});
