# gmg-resumes-worker

Cloudflare Worker that stores/serves candidate resume files in the `gmg-resumes`
R2 bucket (under `Resume/<applicationId>`), so the CRM's Applications tab can
upload and preview files instead of keeping them in the browser's IndexedDB.

## Deploy — dashboard only (no CLI)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Compute (Workers & Pages)** → **Create** → **Workers** → **Create Worker**. Name it e.g. `gmg-resumes-worker` and click **Deploy** to create it (it'll start as a "Hello World" worker).
2. Click **Edit code**. Delete everything in the editor and paste in the full contents of `worker.js` from this folder. Click **Deploy** (top right).
3. Go to the worker's **Settings → Bindings → Add binding → R2 Bucket**. Set:
   - Variable name: `RESUMES` (must match exactly — it's what `worker.js` reads via `env.RESUMES`)
   - R2 bucket: `gmg-resumes`
   Save (this redeploys automatically).
4. Still in **Settings → Variables and Secrets → Add → Secret**. Set:
   - Variable name: `RESUME_ACCESS_TOKEN` (must match exactly)
   - Value: any long random string, e.g. generate one with `node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"` or just mash the keyboard for 40+ characters
   Save and deploy.
5. The worker's URL is shown at the top of its **Overview** tab, e.g. `https://gmg-resumes-worker.<your-subdomain>.workers.dev`.

## Deploy — via Wrangler CLI (alternative)

```bash
cd worker
npx wrangler login
npx wrangler secret put RESUME_ACCESS_TOKEN
# paste a long random value when prompted, e.g. output of:
#   node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
npx wrangler deploy
```

Wrangler reads the R2 binding from `wrangler.toml` automatically and prints the
Worker's URL on deploy, e.g. `https://gmg-resumes-worker.<your-subdomain>.workers.dev`.

## Wire it into the app

In the app's `.env` (see `.env.example` at the repo root), set:

```
VITE_RESUME_WORKER_URL=https://gmg-resumes-worker.<your-subdomain>.workers.dev
VITE_RESUME_ACCESS_TOKEN=<the same value you passed to `wrangler secret put`>
```

Rebuild/redeploy the frontend after changing `.env`.

## Security note

The access token is checked by the Worker on every request, but it also ships
inside the admin site's JS bundle (there's no server-side session to keep it
truly private in a static frontend). This keeps resumes out of search engines
and casual link-guessing, but is not equivalent to real authentication —
don't rely on it for anything more sensitive than resumes. If you outgrow
this, put a real auth layer (e.g. Cloudflare Access) in front of the Worker.
