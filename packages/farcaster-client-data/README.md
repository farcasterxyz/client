# Farcaster Client Data

A Farcaster API client, related utility functions, and types for API endpoints.

## :package: Installing Dependencies

See [README](../../README.md) at workspace root.

## :rocket: Making Changes to the Package

If you are building against the mobile app, be sure to run `pnpm watch` from the
monorepo root. This will watch relevant packages for changes and rebuild them.

## :nail_care: Linting, Formatting, Typechecking

- `pnpm lint` uses [ESLint](https://eslint.org/) to find and try to correct common problems in the project's code.
- `pnpm format` uses [Prettier](https://prettier.io/) to standardize formatting of all code in the project.
- `pnpm typecheck` uses [`tsc`](https://www.typescriptlang.org/docs/handbook/compiler-options.html) to typecheck the codebase.

## :necktie: Styleguide

- Each data-fetching functions should be added as a method to `FarcasterApiClient` and use the private `get`, `getAuthed`, `post`, `put`, and `delete` methods for executing API calls. This ensures that we are consistent with adding metadata as headers, creating authentication tokens, managing timeouts, returning payloads wrapped as a `FetchResponse`, etc.
- API client methods should expect to receive a single object as an argument (e.g. no primitives as arguments). This allows us to standardize function signatures and reduces likelihood of easy oversights like passing arguments in the wrong order. For example, `getMyResource({ hash, fid })` is less error-prone than `getMyResource(hash, fid)`.
- Any parameter that is necessary in some circumstances (e.g. a `cursor` necessary for fetching any page after the first) should be explicitly required as an argument. For example, prefer `cursor: string | undefined` over `cursor?: string`. This reduces likelihood of us accidentally omitting a meaningful parameter.
- All exported types (e.g. `GetFeedResponse`) should live in `types.ts` (i.e. not within `FarcasterApiClient`) and not depend on the `ReturnType` of any runtime code. This makes it easier to standardize on naming conventions and mitigate issues with circular dependencies.
- All other types should be defined inline, rather than referencing a named type. For example, prefer `myUtil({ publicKey }: { publicKey: string })`) over `myUtil({ publicKey }: MyUtilParams)`. This simplifies decisions about how to organize/name types. It also mitigates issues with circular dependencies.
- Public API methods should be documented with [TSDoc](https://tsdoc.org/) comments.
