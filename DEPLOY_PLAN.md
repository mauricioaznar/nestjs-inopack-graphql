# CI/CD Deployment Plan — nestjs-inopack-graphql

## Context
- NestJS + Prisma + GraphQL
- GitHub repo: `mauricioaznar/nestjs-inopack-graphql`
- No existing CI config or Dockerfile yet
- Migrations run via custom `ts-node` runner (`src/db/runner.ts`) in addition to Prisma

---

## Step 1 — Decide deployment target
Pick one before writing any pipeline:
- **VPS (e.g. DigitalOcean, Hetzner)** — SSH deploy, PM2 or systemd process manager
- **Railway / Render / Fly.io** — push-to-deploy PaaS, minimal ops
- **Docker + any host** — most portable, more setup

---

## Step 2 — Add a Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/migration ./src/migration
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

---

## Step 3 — Create `.github/workflows/deploy.yml`
Trigger: push to `master`

```yaml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build
      - run: npm run lint

      # Run migrations against prod DB before swapping
      # - run: npm run migration:run:prod
      #   env:
      #     DATABASE_URL: ${{ secrets.DATABASE_URL }}

      # Deploy step depends on target (SSH / Docker push / Railway CLI)
```

---

## Step 4 — Environment secrets in GitHub
Add these in **Settings → Secrets and variables → Actions**:
- `DATABASE_URL`
- `JWT_SECRET` (or whatever your `.env` needs)
- SSH key or registry token depending on deploy target

---

## Step 5 — Migration strategy decision
Two options — pick one:
- **Run migrations in CI before deploy** (safer, rollback if migration fails)
- **Run migrations on server startup** (`prisma migrate deploy` in the Docker `CMD`)

The current `migration:run:prod` script suggests option 1 is already the pattern.

---

## Open questions to answer before starting
1. Where is the app currently hosted / where do you want to host it?
2. Is there a running MySQL instance already, or does that need to be provisioned?
3. Should the pipeline run tests (`test:coverage`) before deploying, or skip for speed?
4. Is `src/db/runner.ts` (the custom runner) the migration step, or should it be `prisma migrate deploy`?
