import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const cli = path.resolve("bin/dep-contract.js");

async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), "dep-contract-cli-"));
  await writeFile(path.join(directory, "package-lock.json"), JSON.stringify({
    name: "fixture",
    lockfileVersion: 3,
    packages: {
      "": { name: "fixture", version: "1.0.0" },
      "node_modules/alpha": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/alpha/-/alpha-1.0.0.tgz",
        integrity: "sha512-good"
      }
    }
  }, null, 2));
  return directory;
}

test("init and check complete successfully", async () => {
  const cwd = await fixture();
  await exec(process.execPath, [cli, "init"], { cwd });
  const { stdout } = await exec(process.execPath, [cli, "check"], { cwd });
  assert.match(stdout, /contract is valid/);
});

test("approve requires a meaningful reason and records it", async () => {
  const cwd = await fixture();
  await exec(process.execPath, [cli, "init"], { cwd });
  await exec(process.execPath, [cli, "approve", "--reason", "Reviewed upstream release"], { cwd });
  const contract = JSON.parse(await readFile(path.join(cwd, ".dep-contract.json")));
  assert.equal(contract.approvals.length, 2);
  assert.equal(contract.approvals[1].reason, "Reviewed upstream release");
});
