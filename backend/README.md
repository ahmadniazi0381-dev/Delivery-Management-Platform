# Backend API — Delivery Platform

Node.js + Express.js REST API with Socket.IO real-time events, Prisma ORM, and PostgreSQL.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥18 |
| Framework | Express.js 4 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Local or Supabase / Neon) |
| Auth | JWT (jsonwebtoken) |
| Real-time | Socket.IO 4 |
| Validation | Zod |
| Security | helmet, express-rate-limit, bcrypt |
| File storage | Supabase Storage |
| SMS | Twilio |
| Push | Firebase FCM |
| Deployment | Render / VPS |

## Project Structure

```
backend/
├── src/
│   ├── config/          # DB client, startup validation
│   ├── controllers/     # HTTP handlers (thin — delegate to services)
│   ├── middleware/      # auth, security, validation schemas
│   ├── routes/          # Express router definitions
│   ├── services/        # Business logic, DB access
│   └── index.ts         # Express app entry, Socket.IO setup
├── prisma/
│   └── schema.prisma    # Database schema (25+ models)
├── .env.example         # Environment variable reference
├── render.yaml          # Render deployment config
└── package.json
```

## Environment Setup

```bash
# Copy and fill in env vars
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply migrations (requires DATABASE_URL)
npx prisma migrate dev

# Seed system config (optional)
npx prisma studio
```

## Running Locally

```bash
# Development (auto-reload)
npm run dev

# Production build
npm run build
npm start
```

## API Routes

| Prefix | Description |
|---|---|
| `POST /api/auth/*` | Register, login, Google OAuth, OTP, password reset |
| `GET /api/menu` | Menu items and categories (public) |
| `GET/POST /api/cart` | Cart management (authenticated) |
| `GET/POST /api/addresses` | Address CRUD (customer) |
| `POST /api/checkout` | Create checkout session or COD order |
| `GET/POST /api/orders` | Order retrieval and placement |
| `GET/POST /api/payments/*` | Payment initiation, callback, webhook, status |
| `POST /api/reviews` | Post-order reviews |
| `GET /api/notifications` | Customer notifications |
| `GET /api/owner/*` | Admin: analytics, orders, riders, staff, menu management |
| `GET /api/management/*` | Admin: analytics, audit trails, login history |
| `GET /api/staff/*` | Staff management |
| `GET /api/salary/*` | Staff salary management |
| `GET /healthz` | Health check |

## Authorization

```
Role       Access
─────────  ─────────────────────────────────────────────────────
CUSTOMER   Menu, Cart, Addresses, Checkout, Orders (own), Reviews
ADMIN      All + Order management, Rider/Staff management, Analytics
RIDER      Assigned orders, Delivery status updates
```

Fine-grained permissions are controlled by `StaffProfile.permissions[]` for ADMIN users.

## Key Services

| Service | Responsibility |
|---|---|
| `checkout.service.ts` | Price validation, inventory reservation, session lifecycle |
| `order-state-machine.ts` | Validated order status transitions |
| `payment.service.ts` | Webhook verification per gateway |
| `gateway.service.ts` | Gateway-specific redirect/callback parsing |
| `socket-auth.service.ts` | Socket.IO authenticated room management |
| `audit.service.ts` | Immutable audit log writes |
| `distance.service.ts` | Haversine delivery radius check |

## Prisma Commands

```bash
npx prisma generate    # regenerate client after schema changes
npx prisma validate    # validate schema syntax
npx prisma migrate dev # create and apply new migration (dev)
npx prisma migrate deploy # apply pending migrations (production)
npx prisma studio      # visual DB browser
```

## Production Deployment

Deployed on Render using `render.yaml`.

Required secrets set in Render dashboard:
- `DATABASE_URL`, `DIRECT_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `JAZZCASH_WEBHOOK_SECRET`, `EASYPAISA_WEBHOOK_SECRET`, `SAFEPAY_WEBHOOK_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
