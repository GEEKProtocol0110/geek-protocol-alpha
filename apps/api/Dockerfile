# Build once, run as either the API or the payout worker (see docker-compose).
FROM node:20-alpine AS build
WORKDIR /app

# openssl is required by Prisma's query engine on Alpine.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
 && npm run build --workspace @geek/shared --if-present \
 && npm run build --workspace @geek/api

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api

WORKDIR /app/apps/api

# Run unprivileged.
USER node

EXPOSE 5000
CMD ["npm", "run", "start"]
