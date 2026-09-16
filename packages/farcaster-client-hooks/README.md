# Farcaster Client Hooks

Data-related hooks and providers used by React-based Farcaster apps.

## :package: Installing Dependencies

See [README](../../README.md) at workspace root.

## :rocket: Making Changes to the Package

If you are building against the mobile app, be sure to run `pnpm watch` from the
monorepo root. This will watch relevant packages for changes and rebuild when
necessary.

## :nail_care: Linting, Formatting, Typechecking

- `pnpm lint` uses [ESLint](https://eslint.org/) to find and try to correct common problems in the project's code.
- `pnpm format` uses [Prettier](https://prettier.io/) to standardize formatting of all code in the project.
- `pnpm typecheck` uses [`tsc`](https://www.typescriptlang.org/docs/handbook/compiler-options.html) to typecheck the codebase.

## :necktie: Styleguide

- Each folder in the `hooks/data/queries` directory should implement hooks associated with a single query key builder, and each file should export a single function and be named after the function it exports. Grouping hooks associated with the same query key simplifies decisions about how to organize code and make it easier to understand which hooks are associated with a given data store. Having each file named after the function it exports makes it very efficient to find function definitions using the fuzzy file search. Lastly, by exporting a single file, we give consumers of the package an option to only import exactly the functions they are interested in.
- Each folder in the `hooks/data/queries` directory should export a query key builder (e.g. `buildFeedItemsKey`) and a query function builder (e.g. `buildFeedItemsFetcher`), in addition to any hooks (e.g. `useFeedItems`).
- Fetchers should return the full API response body. For example, `const response = await apiClient.getFeed({ fid }); return response.data`.
- Fetchers built for paginated API endpoints (i.e. fetchers that may be passed as an argument React Query's `useInfiniteQuery` family of hooks) should be wrapped with the `wrapPaginatedFetcher` helper. This enforces strict typing of the `pageParam` argument for the given function, while returning a "wrapped" function with typing that will satisfy React Query's `useInfiniteQuery` family of hooks.
- When using React Query's `useInfiniteQuery` hook to fetch from a paginated API endpoint, use the `getNextPageCursor` utility function from `farcaster-client-data` as the value for `getNextPageParam`. This eliminates some boilerplate code and encourage us to standardize our handling of paginated responses.
- Functions should expect to receive a single object as an argument (e.g. no primitives as arguments). This allows us to standardize function signatures and reduces likelihood of oversights like passing arguments in the wrong order. For example, `useMyResource({ hash, fid })` is less error-prone than `useMyResource(hash, fid)`.
- Any parameter that is necessary in some circumstances (e.g. a `cursor` necessary for fetching any page after the first, a `hash` parameter for a query key builder that is typically required but `undefined` may be suitable when we want to invalidate all entries of a given type) should be explicitly required as an argument. For example, prefer `hash: string | undefined` over `hash?: string`. This reduces likelihood of us accidentally omitting a meaningful parameter.
- Hooks that return functions to be called imperatively should expect arguments when invoking the callback, not when invoking the hook. For example, prefer `const useFetchMyResource = () => ({ fid }: { fid: string }) => fetchMyResource({ fid });` over `const useFetchMyResource = ({ fid }: { fid: string }) => () => fetchMyResource({ fid });`. In many cases, not all of the necessary data will be available until the imperative function is invoked. Requiring all of the data at last possible minute simplifies decisions about how to design the API and anticipate its behavior.
- Mutations hooks should live in `hooks/data/mutations`, and the name of the file should be that of the single exported hook.
- All exported types (e.g. `HomeFeedCache`) should live in `types.ts` (i.e. not locally within any hooks file) and not depend on the `ReturnType` of any runtime code. This makes it easier to standardize on naming conventions and mitigate issues with circular dependencies.
- All other types should be defined inline, rather than referencing a named type. For example, prefer `useMyResource({ fid: string })`) over `useMyResource({ fid }: UseMyResourceParams)`. This simplifies decisions about how to organize/name types. It also mitigates issues with circular dependencies.
