# Review output example

This example demonstrates the reviewer-facing output for a risky lockfile
change.

```diff
+ native-addon@2.0.0 (node_modules/native-addon)
! node_modules/native-addon: New install script requires explicit policy approval
! node_modules/mirror-pkg: Source host mirror.invalid is not allowed
```

Maintainers can use the report to ask focused questions before approving:

- Why does the new dependency need an install script?
- Is the package source expected to come from this host?
- Was the upstream release reviewed?
- Is the integrity hash present and stable?

Approval should include the review reason:

```bash
npx dep-contract approve --reason "Reviewed native-addon 2.0.0 release and build script"
```
