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

## License

See [LICENSE](./LICENSE).
