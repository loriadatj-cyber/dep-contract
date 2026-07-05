# Changelog

## 0.1.0 - 2026-07-06

Initial public release.

### Added

- `dep-contract init` to create an auditable dependency contract.
- `dep-contract check` to compare `package-lock.json` against the approved graph.
- `dep-contract approve --reason` to record maintainer approval decisions.
- Policy checks for Git dependencies, HTTP sources, unapproved hosts, missing integrity hashes, and newly introduced install scripts.
- Text, Markdown, JSON, and SARIF output formats.
- Composite GitHub Action with job-summary reporting.
- Example workflows for direct Action usage and SARIF upload to GitHub code scanning.
