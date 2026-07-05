# Examples

These fixtures show how `dep-contract` behaves in small npm projects.

## Clean npm app

```bash
cd examples/fixtures/clean-npm-app
node ../../../bin/dep-contract.js check
```

Expected result: the approved contract matches the lockfile.

## Risky npm app

```bash
cd examples/fixtures/risky-npm-app
node ../../../bin/dep-contract.js check --format markdown
node ../../../bin/dep-contract.js check --format sarif
```

Expected result: the report highlights new packages, a new install script, and
an unapproved package source host.

