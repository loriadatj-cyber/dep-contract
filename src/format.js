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

function levelForViolation(rule) {
  if (["allowGit", "allowHttp", "allowNewInstallScripts"].includes(rule)) return "error";
  if (["allowedHosts", "requireIntegrity"].includes(rule)) return "warning";
  return "note";
}

function resultForViolation(violation) {
  return {
    ruleId: violation.rule,
    level: levelForViolation(violation.rule),
    message: {
      text: violation.message
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: "package-lock.json"
          },
          region: {
            startLine: 1
          }
        },
        logicalLocations: [
          {
            name: violation.path,
            kind: "package"
          }
        ]
      }
    ],
    properties: {
      packagePath: violation.path
    }
  };
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

export function formatSarif(result) {
  const rules = [
    {
      id: "allowGit",
      shortDescription: { text: "Git dependency is not allowed" },
      help: { text: "Git dependencies bypass the configured registry provenance policy." }
    },
    {
      id: "allowHttp",
      shortDescription: { text: "Insecure HTTP source is not allowed" },
      help: { text: "HTTP package sources can be modified in transit." }
    },
    {
      id: "requireIntegrity",
      shortDescription: { text: "Integrity hash is missing" },
      help: { text: "Missing integrity hashes make lockfile review less verifiable." }
    },
    {
      id: "allowedHosts",
      shortDescription: { text: "Package source host is not allowed" },
      help: { text: "Package tarballs should resolve from approved registry hosts." }
    },
    {
      id: "allowNewInstallScripts",
      shortDescription: { text: "New install script requires approval" },
      help: { text: "Install scripts execute code during dependency installation and should be reviewed." }
    }
  ];

  return JSON.stringify({
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "dep-contract",
            informationUri: "https://github.com/loriadatj-cyber/dep-contract",
            rules
          }
        },
        results: result.violations.map(resultForViolation),
        properties: {
          summary: result.summary,
          dependencyChanges: result.changes
        }
      }
    ]
  }, null, 2);
}
