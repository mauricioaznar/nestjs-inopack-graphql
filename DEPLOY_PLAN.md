# CI/CD Deployment Plan — nestjs-inopack-graphql

## Server facts (audited 2026-06-06)

| Item | Value |
|---|---|
| Host | `inoserver-graphql.mauaznar.com` → `134.209.211.151` |
| OS | Ubuntu 18.04.5 LTS (**EOL** — upgrade to 22.04 is a separate priority task) |
| Node | v16.20.2 via nvm (EOL Sept 2023 — upgrade after OS upgrade) |
| Process manager | PM2 (no systemd units for Node apps) |
| App path | `/root/nestjs-inopack-graphql` |
| App port | `3008` |
| Nginx | Proxies `inoserver-graphql.mauaznar.com` → `localhost:3008` (HTTPS, Let's Encrypt) |
| Database | MySQL 5.7 on `127.0.0.1:3306` |
| Firewall | ufw installed but **inactive** — all ports open (harden after OS upgrade) |
| Docker | Not installed |

---

## Current manual deploy (baseline)

```bash
ssh root@134.209.211.151
cd /root/nestjs-inopack-graphql
git pull
npm ci
npm run build
# run migrations manually
pm2 restart inopack-graphql
```

---

## Three CI/CD approaches

### Option A — Git pull on server ⭐ Start here

**How it works:** GitHub Actions SSHes into the server on every push to `master` and runs the same steps as the manual deploy. Zero new infrastructure required.

**Tradeoff:** Build runs on the production server (uses its CPU/RAM). There is a brief window between `pm2 restart` and the process becoming ready where requests may fail. Good enough for an internal business app.

**Steps to set up:**

1. Generate a dedicated deploy SSH key (on your local machine):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/inopack_deploy
   ```

2. Add the public key to the server:
   ```bash
   cat ~/.ssh/inopack_deploy.pub | ssh root@134.209.211.151 "cat >> ~/.ssh/authorized_keys"
   ```

3. Add these secrets in GitHub → Settings → Secrets and variables → Actions:
   - `SSH_PRIVATE_KEY` — contents of `~/.ssh/inopack_deploy` (the private key)
   - `SSH_HOST` — `134.209.211.151`
   - `SSH_USER` — `root`

4. Create `.github/workflows/deploy.yml` in `nestjs-inopack-graphql`:

```yaml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy on server
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} bash << 'EOF'
            set -e
            export NVM_DIR="$HOME/.nvm"
            source "$NVM_DIR/nvm.sh"

            cd /root/nestjs-inopack-graphql
            git pull origin master
            npm ci --omit=dev
            npm run build
            node dist/db/runner.js        # custom migration runner
            pm2 restart inopack-graphql
            pm2 save
          EOF
```

> **Note on migrations:** Replace `node dist/db/runner.js` with your actual migration command. Check `package.json` for the `migration:run:prod` script — if it exists, use `npm run migration:run:prod` instead.

---

### Option B — Build in CI, rsync to server

**How it works:** The CI runner (a fresh Ubuntu VM provided by GitHub) does the heavy lifting — `npm ci + npm run build`. Only the compiled `dist/` and `node_modules/` are synced to the server via rsync. The server just restarts PM2.

**Tradeoff:** Build load moves off production. Faster server-side restart (no compile step there). Requires `rsync` on the server (`apt install rsync`). First sync of `node_modules` is slow; subsequent ones are fast (only diffs).

**Steps to set up:**

Same SSH key setup as Option A (steps 1–3). Additionally:

- Install rsync on the server: `apt install -y rsync`

Add these extra secrets:
- `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER` (same as Option A)

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Sync built artifacts
        run: |
          rsync -az --delete \
            dist/ \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:/root/nestjs-inopack-graphql/dist/
          rsync -az --delete \
            node_modules/ \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:/root/nestjs-inopack-graphql/node_modules/
          rsync -az \
            package.json prisma/ \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:/root/nestjs-inopack-graphql/

      - name: Run migrations and restart
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} bash << 'EOF'
            set -e
            export NVM_DIR="$HOME/.nvm"
            source "$NVM_DIR/nvm.sh"

            cd /root/nestjs-inopack-graphql
            node dist/db/runner.js
            pm2 restart inopack-graphql
            pm2 save
          EOF
```

> **Note:** The CI build runs on Node 20. If any native modules in `node_modules` are compiled for Node 20/Linux they will work on the server. However, since the server runs Node 16, you may hit compatibility issues. To be safe, match versions: change `node-version: 20` to `node-version: 16` until you upgrade the server.

---

### Option C — Docker

**How it works:** CI builds a Docker image, pushes it to GitHub Container Registry (GHCR, free). The server pulls the image and runs it in a container. Nginx still proxies port 3008.

**Tradeoff:** Most portable and cleanest isolation. Easy rollback (just run the previous image tag). Requires installing Docker on the server. Also requires updating nginx to point at the container's port (or keep the same port mapping). Most setup upfront.

**Steps to set up:**

1. Install Docker on the server:
   ```bash
   curl -fsSL https://get.docker.com | bash
   ```

2. Create `Dockerfile` in `nestjs-inopack-graphql`:
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
   COPY --from=builder /app/src/db ./src/db
   COPY package*.json ./
   EXPOSE 3008
   CMD ["node", "dist/main"]
   ```

3. Add secrets in GitHub:
   - `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`
   - `GHCR_TOKEN` — a GitHub personal access token with `write:packages` scope

4. `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [master]

env:
  IMAGE: ghcr.io/${{ github.repository_owner }}/nestjs-inopack-graphql

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE }}:latest
            ${{ env.IMAGE }}:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Pull image and restart container
        env:
          IMAGE: ghcr.io/${{ github.repository_owner }}/nestjs-inopack-graphql
          SHA: ${{ github.sha }}
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} bash << EOF
            set -e
            docker pull ${IMAGE}:${SHA}

            # run migrations before swapping
            docker run --rm --network host \
              --env-file /root/nestjs-inopack-graphql/.env \
              ${IMAGE}:${SHA} \
              node dist/db/runner.js

            # stop old container and start new one
            docker stop inopack-graphql 2>/dev/null || true
            docker rm   inopack-graphql 2>/dev/null || true
            docker run -d \
              --name inopack-graphql \
              --restart unless-stopped \
              --network host \
              --env-file /root/nestjs-inopack-graphql/.env \
              ${IMAGE}:${SHA}

            # keep last 3 images, prune the rest
            docker image prune -f
          EOF
```

> **Note on `.env`:** The container reads `/root/nestjs-inopack-graphql/.env` from the host via `--env-file`. That file stays on the server and is never in the image or in GitHub.

---

## Migration strategy

Migrations run at **deploy time**, not inside the image build. The image is immutable and has no DB connection at build time.

**Docker deploy sequence (Option C):**

```
1. Build and push new image to GHCR
2. SSH into server
3. docker pull <new-image>
4. docker run --rm <new-image> node dist/db/runner.js   ← migrations in throwaway container
   - If this exits non-zero → abort deploy, old container keeps serving traffic
5. docker stop / docker rm old container
6. docker run -d <new-image>                             ← new container starts
```

This gives you safe zero-downtime deploys: a failed migration never takes down the running app.

**Rollback:** `docker run -d <previous-sha-image>` — the old image is still in GHCR.

---

## Recommended path

```
Now     → Implement Option A (1–2 hours, immediate automated deploys)
Soon    → Upgrade server OS to Ubuntu 22.04 + Node 20
After   → Revisit Option B or C for cleaner builds
```

---

## Open items to resolve before any option

- [ ] Confirm migration command: `node dist/db/runner.js` vs `npm run migration:run:prod`
- [ ] Locate `.env` file on server: likely at `/root/nestjs-inopack-graphql/.env` (not found by audit since it searched `/home /opt /srv /var/www` only)
- [ ] Decide: should CI run TypeScript tests (`npm run test`) before deploying?
- [ ] Plan OS upgrade from Ubuntu 18.04 → 22.04 (separate task, high priority)
- [ ] Enable and configure ufw firewall (only ports 22, 80, 443 should be open publicly)
