const TRACKED_FIELDS = [
  "name",
  "version",
  "resolved",
  "integrity",
  "source",
  "hasInstallScript",
  "dev",
  "optional",
  "link"
];

function packageMap(packages) {
  return new Map(packages.map((item) => [item.path, item]));
}

function sourceHost(resolved) {
  if (!resolved?.startsWith("https://") && !resolved?.startsWith("http://")) return null;
  try {
    return new URL(resolved).hostname;
  } catch {
    return null;
  }
}

export function compareContract(contract, currentPackages) {
  const expected = packageMap(contract.packages);
  const current = packageMap(currentPackages);
  const changes = [];
  const violations = [];

  for (const [packagePath, actual] of current) {
    const previous = expected.get(packagePath);
    if (!previous) {
      changes.push({ type: "added", path: packagePath, package: actual });
    } else {
      for (const field of TRACKED_FIELDS) {
        if ((previous[field] ?? null) !== (actual[field] ?? null)) {
          changes.push({
            type: "changed",
            path: packagePath,
            field,
            before: previous[field] ?? null,
            after: actual[field] ?? null,
            package: actual
          });
        }
      }
    }
  }

  for (const [packagePath, previous] of expected) {
    if (!current.has(packagePath)) {
      changes.push({ type: "removed", path: packagePath, package: previous });
    }
  }

  const policy = contract.policy || {};
  for (const item of currentPackages) {
    if (item.source === "git" && policy.allowGit !== true) {
      violations.push({ rule: "allowGit", path: item.path, message: "Git dependency is not allowed" });
    }
    if (item.source === "http" && policy.allowHttp !== true) {
      violations.push({ rule: "allowHttp", path: item.path, message: "Insecure HTTP source is not allowed" });
    }
    if (policy.requireIntegrity !== false && !item.link && !item.integrity) {
      violations.push({ rule: "requireIntegrity", path: item.path, message: "Integrity hash is missing" });
    }
    const host = sourceHost(item.resolved);
    if (host && policy.allowedHosts?.length && !policy.allowedHosts.includes(host)) {
      violations.push({
        rule: "allowedHosts",
        path: item.path,
        message: `Source host ${host} is not allowed`
      });
    }
  }

  if (policy.allowNewInstallScripts !== true) {
    for (const change of changes) {
      const newlyScripted =
        change.type === "added" && change.package.hasInstallScript ||
        change.type === "changed" &&
          change.field === "hasInstallScript" &&
          change.after === true;
      if (newlyScripted) {
        violations.push({
          rule: "allowNewInstallScripts",
          path: change.path,
          message: "New install script requires explicit policy approval"
        });
      }
    }
  }

  return {
    ok: changes.length === 0 && violations.length === 0,
    changes,
    violations,
    summary: {
      packages: currentPackages.length,
      added: changes.filter((item) => item.type === "added").length,
      removed: changes.filter((item) => item.type === "removed").length,
      changed: changes.filter((item) => item.type === "changed").length,
      violations: violations.length
    }
  };
}
