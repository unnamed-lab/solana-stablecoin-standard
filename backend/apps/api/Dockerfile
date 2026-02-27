# apps/api/Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# 1. Build SDK
COPY sdk/package.json sdk/yarn.lock ./sdk/
RUN cd sdk && yarn install --frozen-lockfile
COPY sdk ./sdk
RUN cd sdk && npx tsc

# 2. Build Backend
COPY backend/package.json backend/yarn.lock ./backend/
WORKDIR /app/backend
RUN yarn install --frozen-lockfile

# Copy the rest of backend
COPY backend .
RUN npx prisma generate
RUN yarn build:api

FROM node:20-slim AS runner
WORKDIR /app/backend
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/generated ./generated
COPY --from=builder /app/sdk /app/sdk

EXPOSE 3000
CMD ["node", "dist/apps/api/main.js"]
