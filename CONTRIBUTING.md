# Contributing to redux-auto-slice

Thanks for your interest in contributing.

## Development setup

```bash
git clone git@github.com:Alfayad-s/redux-auto-slice.git
cd redux-auto-slice
npm install
```

## Scripts

- **`npm run build`** — Compile TypeScript to `dist/`
- **`npm test`** — Run Jest (src and tests folders)
- **`npm run lint`** — Run ESLint on `src/**/*.ts`
- **`npm run lint:fix`** — Lint with auto-fix

## Code style

- TypeScript strict mode.
- Follow existing patterns in `src/index.ts`.
- New features should include tests in `src/` or `tests/`.

## Tests

- Add or extend tests under `src/` or `tests/` as appropriate.
- Use `configureStore` from `@reduxjs/toolkit` for integration-style tests.
- For async behavior, use RTK matchers (`isFulfilled`, `isRejected`) where relevant.

## Pull requests

1. Fork the repo and create a branch.
2. Make your changes; keep commits focused.
3. Ensure `npm run build`, `npm test`, and `npm run lint` pass.
4. Open a PR with a clear description of the change.

## Reporting issues

Use the [GitHub issue tracker](https://github.com/Alfayad-s/redux-auto-slice/issues). Include:

- redux-auto-slice and @reduxjs/toolkit versions
- Code or config that reproduces the issue
- Expected vs actual behavior
