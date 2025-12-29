FROM node:20-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build the API
WORKDIR /app/apps/api
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

# Ensure uploads directory exists
RUN mkdir -p /app/uploads && chown nestjs:nodejs /app/uploads

USER nestjs

EXPOSE 3002

CMD ["node", "dist/main"]
