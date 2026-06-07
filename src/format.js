function value(value) {
  if (value === null || value === undefined || value === "") return "(none)";
  return String(value);
}

function changeLine(change) {
  if (change.type === "added") {
    return `+ ${change.package.name}@${value(change.package.version)} (${change.path})`;
  }
  if (change.type === "removed") {
    return `- ${change.package.name}@${value(change.package.version)} (${change.path})`;
  }
  return `~ ${change.path}: ${change.field} ${value(change.before)} -> ${value(change.after)}`;
}

export function formatText(result) {
  if (result.ok) {
    return `Dependency contract is valid (${result.summary.packages} packages).`;
  }

  const lines = [
    "Dependency contract check failed.",
    "",
    `Changes: ${result.summary.added} added, ${result.summary.removed} removed, ${result.summary.changed} changed`,
    `Policy violations: ${result.summary.violations}`
  ];

  if (result.changes.length) {
    lines.push("", "Dependency changes:", ...result.changes.map(changeLine));
  }
  if (result.violations.length) {
    lines.push(
      "",
      "Policy violations:",
      ...result.violations.map((item) => `! ${item.path}: ${item.message}`)
    );
  }
  lines.push("", 'Review the lockfile, then run: dep-contract approve --reason "why this change is safe"');
  return lines.join("\n");
}

export function formatMarkdown(result) {
  const icon = result.ok ? "PASS" : "FAIL";
  const lines = [
    `## dep-contract: ${icon}`,
    "",
    `Packages: **${result.summary.packages}** | Added: **${result.summary.added}** | Removed: **${result.summary.removed}** | Changed: **${result.summary.changed}** | Violations: **${result.summary.violations}**`
  ];

  if (result.changes.length) {
    lines.push("", "### Dependency changes", "", "```diff", ...result.changes.map(changeLine), "```");
  }
  if (result.violations.length) {
    lines.push("", "### Policy violations", "");
    lines.push(...result.violations.map((item) => `- \`${item.path}\`: ${item.message}`));
  }
  return lines.join("\n");
}
