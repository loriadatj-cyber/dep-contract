# dep-contract

`dep-contract` turns npm dependency graph changes into an explicit,
reviewable contract.

Most dependency scanners answer, "Is this package known to be vulnerable?"
`dep-contract` answers a different question:

> Did the resolved dependency graph change, where will the new code come
> from, and did a maintainer explicitly approve it?

It is a zero-runtime-dependency CLI and GitHub Action for
`package-lock.json` v2 and v3.

## Why

A small manifest edit can introduce dozens of transitive packages. A lockfile
can also change package sources, integrity hashes, or install-script behavior
without making those risks obvious during review.

`dep-contract` records the approved graph and fails CI when it observes:

- Added or removed transitive dependencies
- Version, source URL, or integrity hash changes
- Git and insecure HTTP dependencies
- Packages fetched from unapproved registry hosts
- Missing integrity hashes
- Newly introduced install scripts

It complements vulnerability and license scanners; it does not replace them.

## Quick start

Requirements: Node.js 20 or newer and a package-lock v2/v3 project.

```bash
npx dep-contract init
git add .dep-contract.json

npx dep-contract check
```

After intentionally changing dependencies:

```bash
npx dep-contract check
npx dep-contract approve --reason "Upgrade parser to fix GHSA-xxxx"
git add package-lock.json .dep-contract.json
```

The approval reason and actor are retained in the contract for future review.

## GitHub Actions

Add the following workflow step after checkout:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npm ci
- uses: loriadatj-cyber/dep-contract@v0.1.0
```

The action fails on unapproved changes and writes a readable report to the
GitHub job summary.

### Upload SARIF to code scanning

You can also upload policy violations to GitHub code scanning:

```yaml
permissions:
  contents: read
  security-events: write

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 20
  - run: npm ci
  - run: npx dep-contract check --format sarif > dep-contract.sarif
    continue-on-error: true
  - uses: github/codeql-action/upload-sarif@v3
    with:
      sarif_file: dep-contract.sarif
```

## Policy

The generated `.dep-contract.json` contains a policy:

```json
{
  "policy": {
    "allowedHosts": ["registry.npmjs.org"],
    "allowGit": false,
    "allowHttp": false,
    "requireIntegrity": true,
    "allowNewInstallScripts": false
  }
}
```

Policy changes should receive the same scrutiny as dependency approvals.

## Commands

```text
dep-contract init [--lockfile path] [--contract path]
dep-contract check [--contract path] [--format text|json|markdown|sarif]
dep-contract approve --reason "review note" [--contract path]
```

Exit codes:

- `0`: contract is valid
- `1`: graph changes or policy violations were found
- `2`: configuration, input, or usage error

## Current scope

The first release intentionally supports npm package-lock v2/v3 only. Planned
work includes pnpm and Yarn lockfiles, richer package provenance, policy
exceptions with expiry dates, and first-class PR review comments.

See [ROADMAP.md](ROADMAP.md) for milestones.

## Examples

See [examples](examples) for clean and risky npm fixtures, reviewer output, and
SARIF upload examples.

## Security model

`dep-contract` is an offline review gate. It never downloads or executes
dependencies. It trusts the committed lockfile as its input and makes changes
to that input visible and policy-checkable.

Read [SECURITY.md](SECURITY.md) before reporting a vulnerability.

## Contributing

Bug reports, lockfile fixtures, policy ideas, and package-manager expertise are
welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
