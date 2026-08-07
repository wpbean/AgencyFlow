# AgencyFlow

A personal CRM for finding, qualifying, and following up with web development
agencies. Built with Next.js (App Router), Drizzle ORM, and SQLite. This is a
single-user, self-hosted application — see [Application name](#application-name)
for how to rebrand it.

## Stack

- Next.js 16 (App Router, Server Actions, Route Handlers)
- React 19 + TypeScript
- shadcn/ui + Tailwind CSS v4
- SQLite (via `better-sqlite3`) + Drizzle ORM
- Zod validation, React Hook Form
- Recharts (lazy-loaded on the Analytics page only)
- PM2 for process management in production

## Local setup

```bash
npm install
cp .env.example .env.local   # then edit APP_PASSWORD and SESSION_SECRET
npm run db:migrate           # creates ./data/app.db and applies schema
npm run db:seed              # optional: populates sample data for development
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Sign in with the
password you set in `APP_PASSWORD`.

### Environment variables

See `.env.example`. Required:

- `DATABASE_URL` — path to the SQLite file (default `./data/app.db`).
- `APP_PASSWORD` — the password required to sign in. Not stored in the database.
- `SESSION_SECRET` — random 32+ character string used to sign session cookies.
  Generate one with `openssl rand -base64 32`.
- `NEXT_PUBLIC_APP_URL` — the public URL of the deployed app.

Never commit `.env` or `.env.local`.

## Database

The SQLite database lives at `./data/app.db` (or wherever `DATABASE_URL`
points), **outside** `.next` and `node_modules`, so it survives builds,
restarts, and deployments. The `data/` directory is created automatically and
is git-ignored.

### Migrations

Schema lives in `src/db/schema.ts`. After changing it:

```bash
npm run db:generate   # generates a new SQL migration into src/db/migrations
npm run db:migrate     # applies pending migrations to the database
```

Migrations are additive — running `db:migrate` again is always safe and never
drops data.

### Seeding (development only)

```bash
npm run db:seed
```

This **clears and repopulates** all tables with ~10 sample agencies, contacts,
templates, outreach, follow-ups, opportunities, projects, and activity across
several European countries. Do not run this against a production database you
care about.

### Backups

```bash
npm run db:backup
```

Copies the live database into `./backups/app-<timestamp>.db` and prunes
anything beyond the most recent 30 backups. Run it any time — SQLite backups
via file copy are safe as long as no write is happening mid-copy, which is
why the app enables WAL mode (`journal_mode = WAL`).

For a daily backup, add a cron entry on the server (adjust the path):

```
0 3 * * * cd /var/www/agency-flow && /usr/bin/npm run db:backup >> /var/log/agency-flow-backup.log 2>&1
```

## Development commands

```bash
npm run dev          # start the dev server (Turbopack)
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript check
npm run build         # production build
npm run db:studio     # Drizzle Studio (browse the DB visually)
```

## Production deployment (PM2 + Nginx)

1. On the server, clone the repo and install dependencies:

   ```bash
   git clone <your-repo> /var/www/agency-flow
   cd /var/www/agency-flow
   npm ci
   ```

2. Create `.env.local` with production values (`APP_PASSWORD`, `SESSION_SECRET`,
   `NEXT_PUBLIC_APP_URL`, and `DATABASE_URL` if you want the DB somewhere other
   than `./data/app.db`).

3. Run migrations (and seed once, if this is a fresh install and you want
   sample data — otherwise skip):

   ```bash
   npm run db:migrate
   ```

4. Build and start with PM2:

   ```bash
   npm run build
   pm2 start ecosystem.config.js
   pm2 save
   ```

   `ecosystem.config.js` runs `next start` on port 3000, restarts on crash,
   and caps memory at 512MB before restarting.

5. Useful PM2 commands:

   ```bash
   pm2 status                  # check the process is running
   pm2 logs agency-flow        # tail logs
   pm2 restart agency-flow     # restart after a deploy
   pm2 stop agency-flow
   ```

### Updating the app

```bash
cd /var/www/agency-flow
git pull
npm ci
npm run db:migrate      # apply any new migrations — never drops data
npm run build
pm2 restart agency-flow
```

Always run `npm run db:backup` before pulling major changes.

### Nginx reverse proxy

Minimal example — adjust `server_name` and add TLS (e.g. via certbot):

```nginx
server {
    listen 80;
    server_name your-domain.example;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Application name

The display name ("AgencyFlow") is stored in Settings (`/settings`) and
falls back to `APP_NAME` in `src/lib/config.ts`. Changing it in Settings
updates the sidebar and login screen immediately; changing the constant in
`config.ts` changes the default for a fresh database.

## Project structure

```
src/
  app/            Routes (App Router). (app)/ is the authenticated shell.
  actions/        Server Actions — all mutations (create/update/delete).
  db/             Drizzle schema, migrations, seed script, backup script,
                  and query functions (db/queries/*).
  components/     UI, grouped by feature (agencies, contacts, outreach, ...).
  lib/            Auth, validation schemas, lead scoring, email templating,
                  settings accessor, shared utils.
```

## Notes on scope

This is intentionally a single-user app: one shared password, no teams, no
billing. Email is never sent directly by the app — "Send Email" prepares a
draft you copy or open in Gmail, then mark as sent once you've actually sent
it. The database schema was designed so real Gmail API integration could be
added later without structural changes (outreach records already have
`status`, `sentAt`, `templateId`, etc.).
