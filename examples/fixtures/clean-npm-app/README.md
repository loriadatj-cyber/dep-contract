# Clean npm app fixture

This fixture models a tiny npm project whose lockfile matches the approved
dependency contract.

```bash
node ../../../bin/dep-contract.js check
```

Expected output:

```text
Dependency contract is valid (1 packages).
```
