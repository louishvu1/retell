# Next Task

**Start here at the beginning of every new session.**

---

## Current Milestone: 2 — Deploy to Railway

**Goal:** Production server live on Railway with a public HTTPS URL, persistent SQLite, and Square OAuth reconnected.

---

## Context

All code is written and tested locally. The Square sandbox has a known limitation with bookable staff profiles (see CURRENT_STATUS.md), but the code is correct. Deploying to Railway gives us a permanent URL and lets us test with a properly configured Square account.

The ngrok tunnel (`https://facing-skyward-greedily.ngrok-free.dev`) only works when Louis's laptop is running. Railway replaces this with a permanent production URL.

---

## Prerequisites

- [ ] GitHub account (create one at github.com if needed)
- [ ] Railway account (create one at railway.app — free tier works)
- [ ] Git installed locally (`git --version` to check)

---

## Step-by-Step: Deploy to Railway

### Step 1 — Push code to GitHub

```bash
cd C:\Users\louis\Claude\Projects\Retell
git init
git add .
git commit -m "Initial commit — Nott AI v0.1"
```

Create a new repo at github.com (name it `nott-ai` or similar), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/nott-ai.git
git push -u origin main
```

### Step 2 — Create Railway project

1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select your `nott-ai` repo
3. Railway will detect Node.js automatically

### Step 3 — Add environment variables in Railway

In Railway dashboard → your project → Variables, add all of these:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `RETELL_API_KEY` | `REDACTED` |
| `SQUARE_APPLICATION_ID` | `REDACTED` |
| `SQUARE_APPLICATION_SECRET` | `REDACTED` |
| `SQUARE_ENVIRONMENT` | `sandbox` |
| `DATABASE_PATH` | `/data/nott-ai.db` |
| `APP_BASE_URL` | (Railway URL — set after deployment, see Step 5) |

**Do NOT add `SQUARE_PERSONAL_ACCESS_TOKEN` — that's only for local setup scripts.**

### Step 4 — Add a persistent volume for SQLite

In Railway dashboard → your project → Add a Volume:
- Mount path: `/data`
- This makes the SQLite database survive redeploys

### Step 5 — Get the Railway URL and set APP_BASE_URL

After Railway deploys, it gives you a URL like `https://nott-ai-production.up.railway.app`.

Go back to Railway Variables and set:
```
APP_BASE_URL=https://your-railway-url.up.railway.app
```

Also update Square Developer dashboard → your app → OAuth → Redirect URL to:
```
https://your-railway-url.up.railway.app/oauth/square/callback
```

### Step 6 — Run database migration on Railway

Railway runs `npm start` by default. Add a start script to `package.json` if needed:
```json
"start": "node -r ts-node/register src/server.ts"
```

Or better — add a build step. Claude will handle this in the session.

### Step 7 — Verify deployment

Visit: `https://your-railway-url.up.railway.app/health`

Should return: `{ "status": "ok" }`

### Step 8 — Re-run Square OAuth against Railway

Visit:
```
https://your-railway-url.up.railway.app/oauth/square/start?agent_id=agent_04cb403d93c1d6fc57ba9a18a0
```

Complete OAuth. Tokens will be stored in the Railway SQLite DB.

### Step 9 — Update Retell webhook URL

In Retell dashboard → your agent → Webhook Settings:
```
https://your-railway-url.up.railway.app/webhook/retell
```

### Step 10 — Run a real test call

Use Retell's test call feature. Watch Railway logs (available in the Railway dashboard).

---

## Success Criteria

`GET /health` returns 200 from the Railway URL and a real test call triggers booking function logs in Railway.

---

## If Something Goes Wrong

| Symptom | Likely cause |
|---|---|
| Build fails on Railway | Missing `start` script or TypeScript compilation issue |
| SQLite file lost on redeploy | Volume not mounted at `/data` |
| OAuth callback fails | `APP_BASE_URL` not updated or Square redirect URL not updated |
| 401 on webhook | Wrong `RETELL_API_KEY` in Railway env vars |
