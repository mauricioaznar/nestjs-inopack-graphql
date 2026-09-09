# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

# Stage 2: runtime
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Runtime stage only — deliberately *not* in the builder, where it would change
# how `npm ci` installs. Two protections silently depend on this being set, and
# until now it came only from the server's `--env-file`: the hard boot failure on
# a missing JWT secret (otherwise the API quietly falls back to the development
# secret that is public in this repository) and the `SameSite=none; Secure`
# cookie default (otherwise the browser drops the refresh cookie cross-site and
# nobody stays logged in, with nothing in the logs). A server env file can still
# override this deliberately.
ENV NODE_ENV=production

EXPOSE 3008

CMD ["node", "dist/main.js"]
