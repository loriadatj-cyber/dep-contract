import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadLockfile } from "../src/lockfile.js";

test("loads package-lock v3 packages deterministically", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "dep-contract-"));
  const filename = path.join(directory, "package-lock.json");
  await writeFile(filename, JSON.stringify({
    name: "fixture",
    lockfileVersion: 3,
    packages: {
      "": { name: "fixture", version: "1.0.0" },
      "node_modules/alpha": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/alpha/-/alpha-2.0.0.tgz",
        integrity: "sha512-example",
        hasInstallScript: true
      }
    }
  }));

  const result = await loadLockfile(filename);
  assert.equal(result.rootName, "fixture");
  assert.deepEqual(result.packages, [{
    path: "node_modules/alpha",
    name: "alpha",
    version: "2.0.0",
    resolved: "https://registry.npmjs.org/alpha/-/alpha-2.0.0.tgz",
    integrity: "sha512-example",
    source: "https",
    hasInstallScript: true,
    dev: false,
    optional: false,
    link: false
  }]);
});

test("rejects unsupported lockfile versions", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "dep-contract-"));
  const filename = path.join(directory, "package-lock.json");
  await writeFile(filename, JSON.stringify({ lockfileVersion: 1, dependencies: {} }));
  await assert.rejects(() => loadLockfile(filename), /only package-lock/);
});
