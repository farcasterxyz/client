# Farcaster Client Snapshot

A snapshot of the Farcaster client monorepo codebase without the Farcaster Wallet implementation.

This is designed to be a reference for building a social client on top of the Farcaster protocol. Both mobile and web clients run locally, pointing to the current production API by Farcaster.

## Getting Started

In the project root, install dependencies and start watching shared packages:

```
pnpm install && pnpm watch
```

Then in a new terminal, run your preferred client:

### Mobile

```
cd apps/farcaster-mobile
pnpm install
pnpm ios
```

### Web

```
cd apps/farcaster-web
pnpm install
pnpm start
```

## Contributing

This repository is a one-way, automatically generated snapshot of the Farcaster client monorepo. Each update replaces `main` with a single fresh commit, so pull requests and issues opened here can't be merged or tracked, and any change pushed directly is overwritten by the next snapshot.

Fork it and build on it — that's what it's here for.

## License

See [LICENSE](./LICENSE).
