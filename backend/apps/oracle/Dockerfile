FROM node:20-slim AS builder
WORKDIR /app

# Copy root workspace manifest + the ONE lock file
COPY package.json yarn.lock ./

# Copy each workspace's package.json so Yarn can resolve the graph
COPY sdk/package.json ./sdk/
COPY backend/package.json ./backend/

# Install everything from root (hoisted, uses root yarn.lock)
RUN yarn install --frozen-lockfile

# Copy source
COPY sdk ./sdk
COPY backend ./backend

# Build SDK first
RUN cd sdk && npx tsc

# Generate Prisma client (skip migrate during build — no DB at build time)
WORKDIR /app/backend
RUN npx prisma generate
# Call nest directly to bypass yarn prebuild hook
RUN npx nest build oracle

FROM node:20-slim AS runner
WORKDIR /app/backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/generated ./generated
COPY --from=builder /app/sdk /app/sdk
EXPOSE 4001
CMD ["node", "dist/apps/oracle/main.js"]