import { appendFile } from "node:fs/promises";
import {
  buildContract,
  DEFAULT_CONTRACT_FILE,
  loadContract,
  writeContract
} from "./contract.js";
import { compareContract } from "./compare.js";
import { formatMarkdown, formatSarif, formatText } from "./format.js";
import { loadLockfile } from "./lockfile.js";

const HELP = `dep-contract - auditable npm dependency approvals

Usage:
  dep-contract init [--lockfile path] [--contract path]
  dep-contract check [--contract path] [--format text|json|markdown|sarif]
  dep-contract approve --reason "review note" [--contract path]

Commands:
  init      Create the first dependency contract
  check     Compare package-lock.json with the approved contract
  approve   Approve the current graph and record a review reason
`;

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw new Error(`unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return { command, options };
}

async function init(options) {
  const contractFile = options.contract || DEFAULT_CONTRACT_FILE;
  const contract = await buildContract({
    lockfile: options.lockfile || "package-lock.json",
    reason: options.reason || "Initial dependency contract"
  });
  await writeContract(contract, contractFile);
  console.log(`Created ${contractFile} with ${contract.packages.length} approved packages.`);
}

async function evaluate(options) {
  const contract = await loadContract(options.contract || DEFAULT_CONTRACT_FILE);
  const lockfile = await loadLockfile(options.lockfile || contract.lockfile);
  return { contract, lockfile, result: compareContract(contract, lockfile.packages) };
}

async function check(options) {
  const { result } = await evaluate(options);
  const format = options.format || "text";
  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else if (format === "markdown") {
    console.log(formatMarkdown(result));
  } else if (format === "sarif") {
    console.log(formatSarif(result));
  } else if (format === "text") {
    console.log(formatText(result));
  } else {
    throw new Error(`unsupported format: ${format}`);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${formatMarkdown(result)}\n`, "utf8");
  }
  if (!result.ok) process.exitCode = 1;
}

async function approve(options) {
  if (typeof options.reason !== "string" || options.reason.trim().length < 8) {
    throw new Error("--reason is required and must be at least 8 characters");
  }

  const contractFile = options.contract || DEFAULT_CONTRACT_FILE;
  const previous = await loadContract(contractFile);
  const next = await buildContract({
    lockfile: options.lockfile || previous.lockfile,
    reason: options.reason.trim()
  });
  next.policy = previous.policy;
  next.approvals = [...(previous.approvals || []), next.approvals[0]];
  await writeContract(next, contractFile);
  console.log(`Approved ${next.packages.length} packages: ${options.reason.trim()}`);
}

export async function run(argv) {
  const { command, options } = parseArgs(argv);
  if (command === "help" || options.help) {
    console.log(HELP);
    return;
  }
  if (command === "init") return init(options);
  if (command === "check") return check(options);
  if (command === "approve") return approve(options);
  throw new Error(`unknown command: ${command}\n\n${HELP}`);
}
