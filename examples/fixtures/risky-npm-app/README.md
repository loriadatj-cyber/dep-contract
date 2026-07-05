# Risky npm app fixture

This fixture models a dependency update that should be reviewed before it is
approved.

```bash
node ../../../bin/dep-contract.js check --format markdown
```

Expected findings:

- `native-addon` is a new package and introduces an install script.
- `mirror-pkg` is a new package resolved from an unapproved host.

