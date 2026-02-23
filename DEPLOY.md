# Deploying the Lands Dedicated Server

This document walks through getting your own hosted server running so players can
connect from anywhere — not just your LAN.

---

## Recommended hosting: Render (free tier)

Render's free tier gives you a persistent Node.js service at no cost.
The only downside of the free plan is **spin-down after 15 minutes of inactivity**
(first reconnect may take ~30 s).  Upgrade to the **Starter plan (~$7/mo)** for an
always-on server once you have regular players.

### Steps

1. **Create a Render account** at https://render.com — sign up with GitHub for
   the smoothest experience.

2. **Push this repository to GitHub** (or fork/import it).

3. In the Render dashboard click **New → Web Service**, then **Connect a repository**
   and select your repo.

4. Fill in the service settings:
   | Field            | Value                         |
   |------------------|-------------------------------|
   | Name             | `lands-server` (or anything)  |
   | Root Directory   | `server`                      |
   | Environment      | `Node`                        |
   | Build Command    | `npm install && npm run build`|
   | Start Command    | `npm start`                   |
   | Instance Type    | **Free** (or Starter)         |

5. Click **Create Web Service**.  Render will build and deploy automatically.

6. Once deployed, copy the URL it gives you (e.g. `https://lands-server.onrender.com`).

---

## Alternative: Railway (free tier)

Railway's free tier includes 500 compute-hours per month (enough for ~3 h/day of
continuous uptime).

1. Sign up at https://railway.app (GitHub login recommended).
2. Click **New Project → Deploy from GitHub repo** and select this repo.
3. Set the **Root Directory** to `server` in the service settings.
4. Railway auto-detects `npm run build && npm start` via the `railway.toml` included
   in `server/railway.toml`.
5. Under **Variables** add `PORT=3000` if Railway doesn't inject it automatically
   (it usually does via `$PORT`).
6. Copy the generated public URL.

---

## Connecting the clients

After you have a server URL, you need to bake it into the Electron client at build time.

1. In `client/` copy `.env.example` to `.env.local`:
   ```
   cd client
   copy .env.example .env.local
   ```

2. Edit `.env.local` and set your URL:
   ```
   VITE_DEDICATED_SERVER_URL=https://lands-server.onrender.com
   ```

3. Rebuild and repackage:
   ```
   package.bat
   ```
   The new `.env.local` value is baked in — any player who installs this build will
   automatically connect to your server.

> **Development / LAN testing**: If `VITE_DEDICATED_SERVER_URL` is *not* set, the
> client falls back to `http://localhost:3001`.  You can still run `npm run dev` in
> both `server/` and `client/` for local testing without a deployed server.

---

## Environment variables (server)

| Variable | Default  | Description                            |
|----------|----------|----------------------------------------|
| `PORT`   | `3001`   | TCP port the HTTP/Socket.io server binds to. Hosting platforms set this automatically. |

No other environment variables are required.

---

## Keeping the free Render server awake (optional)

On the free plan, Render spins the service down after 15 min of no HTTP traffic.
You can prevent this by sending a cheap ping on a schedule — many free cron services
work.  For example, use **cron-job.org**:

1. Create a free account at https://cron-job.org
2. Add a new job with URL `https://your-server.onrender.com/ping` (or any path)
   and interval **every 10 minutes**.
3. Add a health-check route to the server if you want a proper 200 response
   (the server currently returns 404 for unknown routes, which is still enough to
   keep the process alive).

Or simply upgrade to the Starter plan.

---

## Scaling up

If your game grows and the free tier isn't enough:

| Need                        | Suggestion                              |
|-----------------------------|-----------------------------------------|
| Always-on, no spin-down     | Render Starter ($7/mo) or Railway Hobby ($5/mo) |
| More RAM / CPU              | Render Standard ($25/mo)                |
| Multiple server regions     | Fly.io (deploy to edge PoPs globally)   |
| Thousands of concurrent games | Redis adapter for Socket.io + multiple instances behind a load balancer |

The game server is **stateless per-process** today (rooms live in memory), which
means a single dyno / instance is the correct starting point.  Horizontal scaling
would require migrating `RoomManager` to a shared Redis store.
