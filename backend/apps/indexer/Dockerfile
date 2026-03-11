FROM node:20-slim AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY sdk/package.json ./sdk/
COPY backend/package.json ./backend/
RUN yarn install --frozen-lockfile

COPY sdk ./sdk
COPY backend ./backend

RUN cd sdk && npx tsc

WORKDIR /app/backend
RUN npx prisma generate
# Call nest directly to bypass yarn prebuild hook
RUN npx nest build indexer

FROM node:20-slim AS runner
WORKDIR /app/backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/generated ./generated
COPY --from=builder /app/sdk /app/sdk
CMD ["node", "dist/apps/indexer/main.js"]