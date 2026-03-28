# Deploy InventoryIQ on Render

Use **two Web Services** (backend + frontend) and **one PostgreSQL** instance. Do not put database variables on the frontend service.

## 1. Create PostgreSQL

1. In Render: **New → PostgreSQL**.
2. Note **Internal Database URL** (same region as your services) or the fields: host, port, database, user, password.

## 2. Deploy the backend (Laravel) first

1. **New → Web Service** → connect your Git repo.
2. **Root directory:** `server`
3. **Environment:** Docker (uses [`server/Dockerfile`](server/Dockerfile)).
4. **Start command:** leave empty (container entrypoint runs migrations + `php artisan serve` on `$PORT`).

### Backend environment variables

| Key | Example / notes |
|-----|------------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `base64:...` (generate locally: `php artisan key:generate --show`) |
| `APP_URL` | `https://YOUR-BACKEND-SERVICE.onrender.com` |
| `LOG_CHANNEL` | `stderr` (recommended for logs) |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | From Render Postgres (internal hostname) |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | From Render |
| `DB_USERNAME` | From Render |
| `DB_PASSWORD` | From Render |
| `DB_SSLMODE` | `require` (often needed for managed Postgres) |

Optional: paste **Internal Database URL** as `DATABASE_URL` if you prefer a single string (Laravel reads it when set).

5. Deploy and wait until the service is **Live**. Copy the public URL, e.g. `https://inventoryiq-api.onrender.com`.

6. Smoke test: open `https://YOUR-BACKEND.onrender.com/api/checkAuth` — you should get **401** JSON, not an HTML error page.

## 3. Deploy the frontend (React + Nginx)

1. **New → Web Service** → same repo.
2. **Root directory:** `client`
3. **Environment:** Docker (uses [`client/Dockerfile`](client/Dockerfile)).

### Frontend Docker **build** arguments (required)

In Render: **Settings → Build → Docker Build Args** (or equivalent):

| Build argument | Value |
|----------------|--------|
| `REACT_APP_API_BASE_URL` | `https://YOUR-BACKEND.onrender.com/api` |
| `REACT_APP_API_BASE_IMG_URL` | `https://YOUR-BACKEND.onrender.com` |

Replace with your real backend URL (no trailing slash on the image base; `/api` is required for the API base).

### Frontend runtime environment

| Key | Value |
|-----|--------|
| `PORT` | Usually set automatically by Render; if not, Render still injects `PORT` — the image uses it for Nginx `listen`. |

**Do not** set `DB_*` on the frontend service.

4. Deploy the frontend. Open your frontend URL and log in.

## 4. Common issues

- **Nginx “host not found in upstream inventoryiq-backend”** — fixed in repo: the client image no longer proxies to Docker Compose hostnames; the browser talks to the backend URL from the build args above.
- **Database connection errors** — ensure `pdo_pgsql` (included in [`server/Dockerfile`](server/Dockerfile)), `DB_CONNECTION=pgsql`, and try `DB_SSLMODE=require`.
- **Wrong port on Render** — backend entrypoint uses `$PORT`; frontend Nginx uses `$PORT` (default `3000` locally).

## 5. Local Docker (unchanged workflow)

`docker compose` builds the client with `REACT_APP_API_BASE_URL=http://localhost:8000/api` so your browser can reach Laravel on the host. Backend uses MySQL from compose and `PORT=8000`.
