# dep-contract 0.1.0

`dep-contract` is a zero-runtime-dependency CLI and GitHub Action for reviewing npm lockfile supply-chain changes.

## Highlights

- Create and approve a dependency contract from `package-lock.json` v2/v3.
- Fail CI on unapproved dependency graph changes.
- Flag risky policy violations such as Git dependencies, insecure HTTP package sources, unapproved registry hosts, missing integrity hashes, and newly introduced install scripts.
- Emit reviewer-friendly text, Markdown, JSON, and SARIF.
- Upload SARIF to GitHub code scanning for supply-chain review findings.
- Try clean and risky npm fixtures under `examples/fixtures`.

## Install

```bash
npx dep-contract init
npx dep-contract check
```

## GitHub Action

```yaml
- uses: loriadatj-cyber/dep-contract@v0.1.0
```

## Notes

The first release supports npm `package-lock.json` v2/v3. Planned follow-up work includes pnpm lockfiles, Yarn lockfiles, scoped policy exceptions, and first-class pull request annotations.
