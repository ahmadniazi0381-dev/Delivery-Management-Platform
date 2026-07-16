# PostgreSQL / Supabase Migration & Deployment

This project uses **PostgreSQL (Supabase)** via Prisma. The backend deploys to **Render**; the website stays on **Vercel**.

## 1. Connect Supabase

1. Create a project at [https://supabase.com](https://supabase.com).
2. Open **Project Settings → Database → Connection string**.
3. Copy the **URI** (prefer **Direct** `db.*.supabase.co:5432` or **Session** pooler `:5432`).
4. In `backend/.env` set:

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@...:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@...:5432/postgres?sslmode=require"
```

If `DATABASE_URL` uses the **Transaction** pooler (`:6543`), `DIRECT_URL` **must** be the Direct/Session (`:5432`) URL so `prisma migrate deploy` works.

## 2. Local commands (backend)

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Optional checks:

```bash
npx prisma validate
npx prisma studio
npm run build
npm start
```

## 3. Website (Vercel)

```bash
cd website
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
npm install
npm run build
```

On Vercel → Project → Settings → Environment Variables:

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://naseeb-baryani-api.onrender.com/api` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | your key |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | your OAuth client id |

## 4. Mobile (Expo)

```bash
cd mobile-app
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
npx expo start
```

## 5. Deploy backend on Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** (or Web Service) pointing at the repo.
3. Use `backend/render.yaml`, or manually set:
   - **Root Directory:** `backend`
   - **Build:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start:** `npm start`
   - **Health check:** `/healthz`
4. Set environment variables (see `backend/.env.example`):

| Key | Notes |
|---|---|
| `DATABASE_URL` | Supabase PG URL |
| `DIRECT_URL` | Same as above, or Direct URL if using Tx pooler |
| `JWT_SECRET` | Strong secret |
| `CORS_ORIGINS` | `https://YOUR_APP.vercel.app,http://localhost:3000` |
| `PUBLIC_API_URL` | `https://YOUR_RENDER_SERVICE.onrender.com` |
| `FRONTEND_URL` | `https://YOUR_APP.vercel.app` |
| `JAZZCASH_WEBHOOK_SECRET` | required |
| `EASYPAISA_WEBHOOK_SECRET` | required |
| `SAFEPAY_WEBHOOK_SECRET` | required |

Socket.IO, JWT auth, routes, and payment webhooks are unchanged — only env/config for deployment.

## 6. Data migration from MySQL (if you have existing data)

Prisma migrations create an **empty** PostgreSQL schema. To move MySQL data:

1. Export MySQL data (mysqldump / TablePlus / etc.).
2. Transform types if needed (enums → PG enums, JSON, decimals).
3. Import into Supabase (or use a one-off ETL script).
4. Or re-seed via the backend’s first-run seed (admin user, delivery settings, etc.).

There is **no** MySQL dependency left in application code.
