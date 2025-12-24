FROM node:18-alpine AS base

# This Dockerfile is optimized for a Turborepo monorepo setup

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
# Install turbo globaly
RUN npm install -g turbo
COPY . .
# Prune the workspace for the api app
RUN turbo prune --scope=api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY --from=builder /app/out/package-lock.json ./package-lock.json
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_FACTOR=2
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=10000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=60000
RUN npm config set registry https://registry.npmjs.org/
RUN --mount=type=cache,target=/root/.npm npm ci

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/turbo.json ./turbo.json

# Generate Prisma Client
RUN npx turbo run db:generate

# Build api
RUN npx turbo run build --filter=api...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Ensure uploads directory exists and is writable
RUN mkdir -p /app/uploads && chown nestjs:nodejs /app/uploads

USER nestjs

COPY --from=installer --chown=nestjs:nodejs /app .

CMD ["node", "apps/api/dist/main"]
