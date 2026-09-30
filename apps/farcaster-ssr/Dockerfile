FROM node:22.14.0-alpine3.20 AS base

WORKDIR /usr/src/app

###############################################################################

# When updating image version, make sure to update below layer as well
FROM base AS build

# Dependencies for building/compiling any packages on install
RUN <<EOF
  apk update --no-cache
  apk add --no-cache make g++ python3 py3-pip                 # For building native extensions
  corepack enable && corepack prepare pnpm@10.8.1 --activate  # Installs pnpm
EOF

# Don't install Husky pre-commit hooks since we don't need them in the container
ENV HUSKY=0

# Inefficient, but there's no elegant way to copy all `package.json` files in all subdirectories
COPY . .
RUN pnpm dlx node-gyp@12.2.0 install
RUN pnpm install --frozen-lockfile
RUN pnpm --filter farcaster-ssr... build

FROM base AS prod

COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build /usr/src/app/packages /usr/src/app/packages
COPY --from=build /usr/src/app/apps/farcaster-ssr /usr/src/app/apps/farcaster-ssr

WORKDIR /usr/src/app/apps/farcaster-ssr

EXPOSE 4000

CMD ["npx", "next", "start", "-p", "4000"]
