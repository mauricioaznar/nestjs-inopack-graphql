# CI/CD Deployment Plan — nestjs-inopack-graphql

## Environments

| Environment | URL | Server | Branch | Status |
|---|---|---|---|---|
| Staging | `https://staging-inopack.mauaznar.com` | `162.243.171.217` | `stage` | ✅ Live |
| Production (new) | `https://inopack-api.mauaznar.com` | `159.223.100.185` | `master` | ✅ Live — awaiting DNS cutover |
| Production (old) | `https://inoserver-graphql.mauaznar.com` | `134.209.211.151` | — | 🔶 Still serving — destroy after cutover |

---

## How it works

Every push to `stage` triggers the GitHub Actions workflow:

1. **Build** — Docker builds a two-stage image (Node 20 Alpine, Prisma generated)
2. **Push** — Image pushed to GHCR as `ghcr.io/mauricioaznar/nestjs-inopack-graphql:<sha>`
3. **Reset DB** — Staging DB is dropped and recreated from `/root/inopack/inopack.sql`
4. **Migrate** — Throwaway container runs `node dist/db/runner.js` against the fresh DB
   - If migrations fail → deploy aborts, old container keeps serving
5. **Swap** — Old container stopped, new container started with `--restart unless-stopped`
6. **Prune** — Old images cleaned up

**Rollback:** `docker run -d <previous-sha-image>` — old images stay in GHCR.

---

## Beginner's guide — what we built and why

This section explains every concept from scratch. If you are new to DevOps, read this before touching anything.

---

### What problem are we solving?

Before this setup, deploying a new version of the API meant SSHing into the server, running `git pull`, building manually, and hoping nothing broke. If something went wrong, the app was down while you scrambled to fix it.

We wanted: **push code → it automatically deploys → if anything fails, the old version keeps running**.

---

### Concept 1 — Docker

**What it is:** Docker packages your app and everything it needs (Node, libraries, config) into a single portable file called an **image**. You can run that image on any machine and it behaves identically — no "works on my machine" problems.

**Key terms:**
- **Image** — the packaged app (like a zip file of your entire runtime environment)
- **Container** — a running instance of an image (like an open zip file that's actually executing)
- **Dockerfile** — a recipe that describes how to build the image

**Our Dockerfile** uses a two-stage build:
- Stage 1 (builder): installs all dependencies, compiles TypeScript → JavaScript
- Stage 2 (runtime): copies only the compiled output + production dependencies into a slim image

Why two stages? The final image doesn't need TypeScript, test tools, or source files. Keeping it small means faster deploys and a smaller attack surface.

---

### Concept 2 — Container Registry (GHCR)

**What it is:** A storage service for Docker images, like GitHub but for images instead of code. We use **GHCR** (GitHub Container Registry) because it's free and already integrated with our GitHub repos.

**Flow:**
1. Your machine (or GitHub Actions) builds the image
2. Pushes it to `ghcr.io/mauricioaznar/nestjs-inopack-graphql:<commit-sha>`
3. The server pulls that exact image by its SHA — so you always know exactly what version is running

The SHA tag (a unique hash like `2bd13758...`) means every deploy is traceable to a specific commit. Rolling back = just running the previous SHA's image.

---

### Concept 3 — GitHub Actions (CI/CD)

**What it is:** GitHub Actions is an automation system built into GitHub. You write a YAML file that says "when X happens, run these steps". This is called a **workflow**.

**CI/CD stands for:**
- **Continuous Integration** — automatically build and test on every push
- **Continuous Deployment** — automatically deploy when tests pass

**Our workflow** (`.github/workflows/deploy-staging.yml`) triggers on every push to the `stage` branch and runs two jobs:

```
Job 1: build-and-push
  → Check out the code
  → Log in to GHCR
  → Build the Docker image
  → Push it to GHCR with two tags: :latest and :<commit-sha>

Job 2: deploy (runs after Job 1 succeeds)
  → SSH into the staging server
  → Pull the new image
  → Reset the DB from the production dump
  → Run migrations in a throwaway container
  → If migrations pass: swap the running container
  → Prune old images
```

**Why two jobs?** If the build fails, the deploy never runs. You never deploy broken code.

---

### Concept 4 — SSH and GitHub Secrets

**What is SSH?** A secure way to connect to a remote server and run commands on it. Instead of a password, it uses a pair of cryptographic keys: a private key (stays on your machine) and a public key (lives on the server). GitHub Actions uses your private key to log into the server automatically.

**What are GitHub Secrets?** Sensitive values (passwords, keys, tokens) stored encrypted in GitHub. The workflow references them as `${{ secrets.MY_SECRET }}` — they are never visible in logs or code.

**Secrets we added:**

| Secret | What it is |
|---|---|
| `STAGING_SSH_HOST` | IP address of the staging server |
| `STAGING_SSH_USER` | `root` (the Linux user to log in as) |
| `STAGING_SSH_PRIVATE_KEY` | Your SSH private key (`~/.ssh/id_ed25519`) |
| `GHCR_TOKEN` | GitHub Personal Access Token with `write:packages` scope |

---

### Concept 5 — Migrations

**What they are:** SQL scripts that modify the database schema in a controlled, versioned way. Each migration file is numbered (by timestamp) and runs exactly once — the runner records which ones have already run in a `migrations` table.

**Our runner** (`src/db/runner.js`) scans `dist/db/migrations/`, compares against the `migrations` table, and runs any pending files in order.

**Why run migrations before swapping the container?**

```
Old container running → pull new image → run migrations in throwaway container
                                              ↓ fails? → abort, old container untouched
                                              ↓ passes? → stop old, start new container
```

If the migration fails (bad SQL, wrong data), the old app never stops. There is no downtime.

**On staging specifically**, the DB is reset from a production dump on every deploy. This means:
- You never accumulate migration drift on staging
- Every deploy starts from a clean, known state (production data + your new migrations)
- You can freely add and remove migrations during development without worrying about cleanup

---

### Concept 6 — Nginx as a reverse proxy

**What it is:** Nginx is a web server that sits in front of your app. When a browser requests `https://staging-inopack.mauaznar.com`, Nginx receives it and forwards it to your app running on `localhost:3008`. This is called **reverse proxying**.

**Why not expose port 3008 directly?**
- Nginx handles SSL (HTTPS certificates)
- Nginx can route multiple domains/apps on the same server
- Nginx handles WebSocket upgrades properly

**Critical WebSocket setting:**
```nginx
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;
```
Without these, Nginx closes WebSocket connections after 60 seconds of inactivity. This caused the "Reconectando" reconnection loop — the client's live subscription kept getting dropped and retrying every minute.

---

### Concept 7 — Let's Encrypt (HTTPS)

**What it is:** A free certificate authority. `certbot` is a tool that requests a certificate from Let's Encrypt, installs it in Nginx, and sets up automatic renewal every 90 days.

**What we ran:**
```bash
certbot --nginx -d staging-inopack.mauaznar.com
```
That one command: requested the certificate, configured Nginx for HTTPS, and scheduled renewal. No manual steps needed going forward.

---

### Concept 8 — Branch strategy

| Branch | Purpose |
|---|---|
| `dev` | Active development — where new features are built |
| `stage` | Staging deploys — pushing here triggers the staging workflow |
| `master` | Production — pushing here will eventually trigger the production workflow |

**Flow for a new feature:**
1. Work on `dev`
2. Merge `dev` → `stage`, push → staging deploys automatically
3. Test on `https://staging-inopack.mauaznar.com`
4. When happy → merge `stage` → `master`, push → production deploys

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
| DB dump | `/root/inopack/inopack.sql` |

---

## GitHub secrets (staging)

| Secret | Value |
|---|---|
| `STAGING_SSH_HOST` | `162.243.171.217` |
| `STAGING_SSH_USER` | `root` |
| `STAGING_SSH_PRIVATE_KEY` | SSH private key |
| `GHCR_TOKEN` | GitHub PAT with `write:packages` |

---

## Refreshing the staging DB dump

When you want staging to reflect newer production data:

```powershell
# Copy a fresh dump to the staging server
scp E:\projects\inopack\inopack.sql root@162.243.171.217:/root/inopack/inopack.sql
```

The next push to `stage` will use it automatically.

---

## TODO

### Production deployment workflow (`deploy-production.yml`)

Trigger: push to `master`.

**Planned deploy sequence:**

```
1. SSH into production server
2. CREATE a timestamped DB backup  ← safety net before anything changes
   mysqldump -u root -p inopack > /root/backups/inopack_$(date +%Y%m%d_%H%M%S).sql
   If this fails → abort entire deploy (do not proceed)
3. Build Docker image and push to GHCR  ← only after backup confirmed
4. Pull new image on production server
5. Run migrations in throwaway container
   If migrations fail → abort, old container still running, backup available to restore
6. Swap container
7. Prune old images
```

**Why backup first?** If a migration runs bad SQL and corrupts data, you have a clean snapshot taken seconds before the deploy started. Restore with:
```bash
mysql -u root -p inopack < /root/backups/inopack_<timestamp>.sql
```

**Server strategy:**

We will create a **brand new DigitalOcean droplet** for production. The old server (`134.209.211.151`) will not be touched or reconfigured — it stays running as-is until the new production droplet is fully working (Docker, workflow, migrations, HTTPS all verified). Only then will the old droplet be destroyed and the DNS updated.

A new subdomain will be assigned to the new droplet (e.g. `api.mauaznar.com` or similar — to be decided). The old `inoserver-graphql.mauaznar.com` DNS record stays pointing at the old server until cutover.

**Progress: 9/11 complete (82%)**

- [x] Create new production droplet (2 GB RAM / 1 vCPU, Ubuntu 22.04) — `159.223.100.185`
- [x] Install Docker, Nginx, MySQL on new droplet
- [x] Assign new subdomain DNS A record — `inopack-api.mauaznar.com` → `159.223.100.185`
- [x] Import production DB dump to new droplet
- [x] Configure HTTPS via Certbot on new subdomain
- [x] Add GitHub secrets: `PROD_SSH_HOST`, `PROD_SSH_USER`, `PROD_SSH_PRIVATE_KEY`, `PROD_DB_PASSWORD`
- [x] Create `/root/backups/` directory on new production droplet
- [x] Write and test `deploy-production.yml`
- [x] Verify full deploy end to end — workflow green, app responding at `https://inopack-api.mauaznar.com`
- [ ] Cut over DNS (`inoserver-graphql.mauaznar.com`) to new droplet IP (`159.223.100.185`)
- [ ] Destroy old droplet (`134.209.211.151`) immediately after cutover is confirmed stable

---

### Daily automated DB dumps (TODO)

Goal: every day, automatically dump the production DB and send the file to two places:
1. **Staging server** (`/root/inopack/inopack.sql`) — so staging always has recent data
2. **Google Drive** — long-term offsite backup

**Decided approach:**
- Cron job lives on the production server (`crontab -e`)
- Runs `mysqldump` nightly → saves to `/root/backups/`
- Sends to staging via `scp` (requires production server's SSH key to be authorized on staging)
- Uploads to Google Drive via `rclone` (CLI tool with Google Drive support)
- Prune local backups older than 7 days to avoid filling the disk

**Still needed before implementing:**
- [ ] Decide how many days of local backups to keep
- [ ] Set up `rclone` with Google Drive OAuth on the production server
- [ ] Add production server's public key to staging's `~/.ssh/authorized_keys` (so scp works server-to-server)
- [ ] Decide if a staging dump refresh should also trigger a new staging deploy automatically

---

### Other

- [ ] **Disable old systemd node service on production server** — on reboot the old node process may restart and steal port 3008 before Docker binds it. Find and disable the service: `systemctl list-units | grep node`.

---

## Dockerfile notes

- Two-stage build: builder (full deps + TypeScript compile) → runtime (prod deps only)
- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` in `schema.prisma` — generates correct Prisma binary for Alpine
- `apk add openssl` in runtime stage — required by Prisma query engine
- Migration runner filters `.js` only — same binary runs locally (`npm run migration:run`) and in Docker
- `package-lock.json` is committed — required for `npm ci` in CI
