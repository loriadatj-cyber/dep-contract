import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadLockfile } from "./lockfile.js";

export const DEFAULT_CONTRACT_FILE = ".dep-contract.json";

export async function buildContract({
  lockfile = "package-lock.json",
  reason = "Initial dependency contract",
  actor = process.env.GITHUB_ACTOR || process.env.USERNAME || process.env.USER || "unknown"
} = {}) {
  const snapshot = await loadLockfile(lockfile);
  return {
    schemaVersion: 1,
    lockfile: path.relative(process.cwd(), snapshot.path).replaceAll("\\", "/"),
    policy: {
      allowedHosts: ["registry.npmjs.org"],
      allowGit: false,
      allowHttp: false,
      requireIntegrity: true,
      allowNewInstallScripts: false
    },
    packages: snapshot.packages,
    approvals: [
      {
        at: new Date().toISOString(),
        actor,
        reason,
        packageCount: snapshot.packages.length
      }
    ]
  };
}

export async function loadContract(filename = DEFAULT_CONTRACT_FILE) {
  try {
    const contract = JSON.parse(await readFile(path.resolve(filename), "utf8"));
    if (contract.schemaVersion !== 1 || !Array.isArray(contract.packages)) {
      throw new Error("unsupported contract schema");
    }
    return contract;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`contract not found: ${filename}; run "dep-contract init" first`);
    }
    throw new Error(`cannot read ${filename}: ${error.message}`);
  }
}

export async function writeContract(contract, filename = DEFAULT_CONTRACT_FILE) {
  await writeFile(path.resolve(filename), `${JSON.stringify(contract, null, 2)}\n`, "utf8");
}
