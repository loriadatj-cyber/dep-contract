# GitHub Action example

This example shows the smallest workflow for enforcing a dependency contract.

```yaml
name: Dependency contract

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  dep-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - uses: loriadatj-cyber/dep-contract@v1
```

When a lockfile changes intentionally, review the dependency diff and approve
the new graph:

```bash
npx dep-contract approve --reason "Upgrade parser after reviewing release notes"
```
