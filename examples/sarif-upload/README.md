# SARIF upload example

`dep-contract check --format sarif` emits SARIF 2.1.0 for policy violations.
This lets repositories surface supply-chain review findings in GitHub code
scanning.

```yaml
name: Dependency contract SARIF

on:
  pull_request:

permissions:
  contents: read
  security-events: write

jobs:
  dep-contract-sarif:
    runs-on: ubuntu-latest
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
