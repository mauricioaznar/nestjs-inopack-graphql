# CI/CD Deployment Plan — nestjs-inopack-graphql

## Environments

| Environment | URL | Server | Branch | Status |
|---|---|---|---|---|
| Staging | `https://staging-inopack.mauaznar.com` | `162.243.171.217` | `stage` | ✅ Live |
| Production | `https://inoserver-graphql.mauaznar.com` | `134.209.211.151` | `master` | ⏳ Pending |

---

## How it works

Every push to `stage` triggers the GitHub Actions workflow:

1. **Build** — Docker builds a two-stage image (Node 20 Alpine, Prisma generated)
2. **Push** — Image pushed to GHCR as `ghcr.io/mauricioaznar/nestjs-inopack-graphql:<sha>`
3. **Migrate** — Throwaway container runs `node dist/db/runner.js` against the server DB
   - If migrations fail → deploy aborts, old container keeps serving
4. **Swap** — Old container stopped, new container started with `--restart unless-stopped`
5. **Prune** — Old images cleaned up

**Rollback:** `docker run -d <previous-sha-image>` — old images stay in GHCR.

---

## Server setup (staging — completed 2026-06-07)

| Item | Value |
|---|---|
| Droplet | Basic, 2 GB RAM / 1 vCPU, Ubuntu 22.04 |
| Docker | 29.5.3 |
| MySQL | 8.0 |
| Nginx | Proxies `staging-inopack.mauaznar.com` → `localhost:3008` |
| HTTPS | Let's Encrypt via Certbot (auto-renews) |
| `.env` | `/root/inopack/.env` |

---

## GitHub secrets (staging)

| Secret | Value |
|---|---|
| `STAGING_SSH_HOST` | `162.243.171.217` |
| `STAGING_SSH_USER` | `root` |
| `STAGING_SSH_PRIVATE_KEY` | SSH private key |
| `GHCR_TOKEN` | GitHub PAT with `write:packages` |

---

## Database — staging

Staging DB is a copy of production, imported manually:

```bash
# On local machine — dump production DB and copy to staging server
scp inopack.sql root@162.243.171.217:/root/inopack.sql

# On staging server
mysql -u root -proot inopack < /root/inopack.sql
```

Refresh whenever you need staging to reflect current production data.

---

## TODO

- [ ] **Production workflow** — create `deploy-production.yml` targeting `134.209.211.151`, triggered on push to `master`. Add `PROD_SSH_HOST`, `PROD_SSH_USER`, `PROD_SSH_PRIVATE_KEY` secrets. Install Docker on production server first.
- [ ] **Production DB import** — document the mysqldump command from the production server for periodic snapshots.
- [ ] **Upgrade production server** — Ubuntu 18.04 → 22.04, Node 16 → 20 (separate task).

---

## Dockerfile notes

- Two-stage build: builder (full deps + TypeScript compile) → runtime (prod deps only)
- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` in `schema.prisma` — generates correct Prisma binary for Alpine
- `apk add openssl` in runtime stage — required by Prisma query engine
- Migration runner filters `.js` only — same binary runs locally (`npm run migration:run`) and in Docker
- `package-lock.json` is committed — required for `npm ci` in CI
