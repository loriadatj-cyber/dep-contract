# Contributing

Thank you for helping make dependency review more understandable.

## Development

Requirements: Node.js 20 or newer.

```bash
npm install
npm test
npm run lint
```

The project intentionally has no runtime dependencies. New runtime packages
need a clear security and maintenance justification.

## Pull requests

1. Open an issue for substantial behavior or policy changes.
2. Add focused tests, including a minimal lockfile fixture when relevant.
3. Keep output stable or document the compatibility impact.
4. Run the full test and lint suite.
5. Explain dependency changes and approve them with `dep-contract approve`.

Be respectful and assume good intent. Harassment, discrimination, and personal
attacks are not accepted in project spaces.
