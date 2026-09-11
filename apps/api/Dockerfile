FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @gift/api build
# Reinstall only API runtime dependencies from the same reviewed lockfile.
RUN CI=true pnpm --filter @gift/api... install --prod --frozen-lockfile

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Preserve pnpm's relative workspace links without shipping development dependencies.
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /workspace/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /workspace/apps/api/drizzle ./apps/api/drizzle
COPY --from=build --chown=node:node /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /workspace/packages/contracts ./packages/contracts
WORKDIR /app/apps/api
USER node
EXPOSE 3001
CMD ["node", "dist/api.js"]
