# Farcaster Cryptography

A Farcaster Cryptography library, providing support for common-use cryptographic primitives.

## :package: Installing Dependencies

See [README](../../README.md) at workspace root.

## :rocket: Making Changes to the Package

If you are building against the mobile app, be sure to run `pnpm watch` from the monorepo root. This will watch relevant packages for changes, then use [Yalc](https://github.com/wclr/yalc) to rebuild the package and publish the new code to the mobile repo. Otherwise, changes should be picked up naturally by the web app.

## :nail_care: Linting, Formatting, Typechecking

- `pnpm lint` uses [ESLint](https://eslint.org/) to find and try to correct common problems in the project's code.
- `pnpm format` uses [Prettier](https://prettier.io/) to standardize formatting of all code in the project.
- `pnpm typecheck` uses [`tsc`](https://www.typescriptlang.org/docs/handbook/compiler-options.html) to typecheck the codebase.

## :necktie: Styleguide

- When relevant to the security of an implementation these guidelines may be ignored, however only if it is explicitly necessary, and sufficient commentary accompanies to explain _why_.
- Cryptographic methods should expect to receive a single object as an argument (e.g. no primitives as arguments). This allows us to standardize function signatures and reduces likelihood of easy oversights like passing arguments in the wrong order. For example, `getMyResource({ address, viewerAddress })` is less error-prone than `getMyResource(address viewerAddress)`.
- Any parameter that is necessary in some circumstances (e.g. a `cursor` necessary for fetching any page after the first) should be explicitly required as an argument. For example, prefer `cursor: string | undefined` over `cursor?: string`. This reduces likelihood of us accidentally omitting a meaningful parameter.
- All exported types (e.g. `RatchetCiphertext`) should live in `types.ts` (i.e. not within `FarcasterCryptography`) and not depend on the `ReturnType` of any runtime code. This makes it easier to standardize on naming conventions and mitigate issues with circular dependencies.
- All other types should be defined inline, rather than referencing a named type. For example, prefer `myUtil({ publicKey }: { publicKey: string })`) over `myUtil({ publicKey }: MyUtilParams)`. This simplifies decisions about how to organize/name types. It also mitigates issues with circular dependencies.
- Public API methods should be documented with [TSDoc](https://tsdoc.org/) comments.

## :closed_lock_with_key: Security

Supply-chain attacks are abundant and thus library usage should be minimized to strictly necessary components, preferably zero. The usage of this library will have important disclosures on how to securely leverage it in the doc comments. While an algorithm may be implemented 100% correctly and mitigates all known attacks, at the end of the day it can still be broken in use simply by providing bad parameters. To the best of the library's ability parameters are validated (e.g. curve mismatch in ECDH, initialization vectors are random in AES, party identifiers modulo field size are not zero in polynomial splitting), however there's still ways to get things wrong. When in doubt, read the TSDoc comments.
