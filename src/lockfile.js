import { readFile } from "node:fs/promises";
import path from "node:path";

function packageNameFromPath(packagePath) {
  const marker = "node_modules/";
  const index = packagePath.lastIndexOf(marker);
  if (index === -1) return packagePath || ".";
  return packagePath.slice(index + marker.length);
}

function classifySource(resolved = "") {
  if (!resolved) return "unknown";
  if (resolved.startsWith("git+") || resolved.startsWith("git://")) return "git";
  if (resolved.startsWith("file:") || resolved.startsWith("link:")) return "local";
  if (resolved.startsWith("http://")) return "http";
  if (resolved.startsWith("https://")) return "https";
  return "other";
}

export async function loadLockfile(filename = "package-lock.json") {
  const absolutePath = path.resolve(filename);
  let document;

  try {
    document = JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`lockfile not found: ${filename}`);
    }
    throw new Error(`cannot parse ${filename}: ${error.message}`);
  }

  if (![2, 3].includes(document.lockfileVersion) || !document.packages) {
    throw new Error("only package-lock.json lockfileVersion 2 and 3 are supported");
  }

  const packages = Object.entries(document.packages)
    .filter(([packagePath]) => packagePath !== "")
    .map(([packagePath, value]) => ({
      path: packagePath.replaceAll("\\", "/"),
      name: value.name || packageNameFromPath(packagePath),
      version: value.version || null,
      resolved: value.resolved || null,
      integrity: value.integrity || null,
      source: classifySource(value.resolved),
      hasInstallScript: value.hasInstallScript === true,
      dev: value.dev === true,
      optional: value.optional === true,
      link: value.link === true
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    path: absolutePath,
    lockfileVersion: document.lockfileVersion,
    rootName: document.name || document.packages[""]?.name || null,
    packages
  };
}
