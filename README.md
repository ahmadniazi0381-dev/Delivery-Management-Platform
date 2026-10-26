# Delivery-Management-Platform

## 1. Project Overview
This repository contains a full-stack monorepo for Delivery-Management-Platform. It supports operations for customers (ordering), administrators (management), and riders (delivery fulfillment). The system handles menus, cart management, address validation, checkout flow, real-time order tracking, role-based access control, and a multi-step order state machine.

## 2. Live Demo
- **Frontend (Customer/Admin):** [https://delivery-frontend-placeholder.vercel.app](https://delivery-frontend-placeholder.vercel.app) (Vercel)
- **Backend API:** [https://delivery-backend-placeholder.onrender.com](https://delivery-backend-placeholder.onrender.com) (Render)
- **Mobile App:** Expo project available in the repository.

## 3. Features
- **Customer:** Menu browsing, cart management, multiple delivery addresses, order placement (COD/Online), order history, and real-time order tracking.
- **Admin:** Dashboard, menu management, order processing, staff RBAC management, settings configuration.
- **Rider:** Real-time order assignment, status updates (pickup to delivery), earnings tracking.
- **Payment:** Support for Cash on Delivery (COD), JazzCash, Easypaisa, and Card payments via a gateway abstraction service.

## 4. Technology Stack
| Component | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16, React 19 | TypeScript, Tailwind CSS v4, PWA (serwist), Socket.IO client |
| **Backend** | Node.js, Express.js | TypeScript, REST API, Socket.IO v4, Zod, helmet, express-rate-limit, bcrypt, JWT |
| **Database** | PostgreSQL | Hosted via Supabase |
| **ORM** | Prisma 5 | Strongly typed queries, migrations |
| **Mobile** | React Native | Built with Expo |
| **Deployment** | Vercel, Render | Frontend on Vercel, Backend on Render (`render.yaml`) |

## 5. Architecture
```text
  [Next.js Frontend]      [React Native App]
         |                         |
         | (REST + Socket.IO)      | (REST + Socket.IO)
         v                         v
+-------------------------------------------------+
|               Node.js + Express                 |
|  [Auth] [Rate Limiting] [Controllers/Services]  |
|                 [Socket.IO v4]                  |
+-------------------------------------------------+
                         |
                         | (Prisma ORM)
                         v
                +------------------+
                | PostgreSQL DB    |
                | (via Supabase)   |
                +------------------+
```

## 6. Repository Structure
```text
/
├── website/                # Next.js web application
├── backend/                # Node.js/Express API server
├── mobile-app/             # React Native / Expo app
├── .github/workflows/      # CI/CD definitions
└── README.md               # Engineering documentation
```

## 7. Frontend Architecture
The frontend is built using Next.js 16 with the App Router and React 19.
- **Styling:** Tailwind CSS v4.
- **Real-time:** `socket.io-client` handles live updates.
- **PWA:** `serwist` is integrated for Progressive Web App capabilities.
- **State/Data:** Standard React hooks and server/client component boundaries.

## 8. Backend Architecture
The backend follows a standard N-tier architecture:
- **Routes:** Define HTTP endpoints and attach middleware.
- **Middleware:** Authentication, RBAC, input validation (Zod), rate limiting.
- **Controllers:** Handle HTTP request/response mapping.
- **Services:** Contain core business logic (checkout, payment, order state).
- **Socket.IO:** Real-time event broadcasting and room management.

## 9. Database Design
The schema uses PostgreSQL via Prisma (`provider = "postgresql"`).
- **Core Models:** `User`, `Address`, `CartItem`, `Category`, `MenuItem`, `Discount`.
- **Order Models:** `Order`, `OrderItem`, `OrderAuditTrail`, `OrderSequence`.
- **Payment & Checkout:** `Payment`, `PaymentSetting`, `CheckoutSession`, `InventoryReservation`.
- **Staff & Riders:** `StaffProfile` (RBAC), `RiderProfile` (CNIC, biometrics).
- **System:** `OtpVerification`, `AuditLog`, `ActivityLog`, `LoginHistory`, `SystemLog`, `Branch`, `ShopSetting`, `DeliverySetting`, `SystemConfig`.
- **User Engagement:** `Review`, `LoyaltyPoint`, `Referral`, `Notification`, `Banner`.

## 10. Authentication & Authorization
- **JWT:** Bearer token utilized for stateless authentication.
- **Role Enforcement:** `requireRole('CUSTOMER'|'ADMIN'|'RIDER')` restricts endpoint access.
- **Granular RBAC:** `requirePermission(permission)` checks `StaffProfile.permissions`. Staff roles include `OWNER`, `MANAGER`, `CASHIER`, `KDS`, `RIDER_MANAGER`, `BRANCH_MANAGER`.
- **Security:** Forced password change flows are supported via the `mustChangePassword` flag.

## 11. Order State Machine
```text
PENDING
  ├──> ACCEPTED
  │      ├──> PREPARING
  │      │      ├──> READY
  │      │      │      ├──> OUT_FOR_DELIVERY
  │      │      │      │      └──> DELIVERED (terminal)
  │      │      │      └──> CANCELLED (terminal)
  │      │      └──> CANCELLED (terminal)
  │      └──> CANCELLED (terminal)
  ├──> REJECTED (terminal)
  └──> CANCELLED (terminal)
```
- Customer cancellation is blocked once `OUT_FOR_DELIVERY`.
- State transitions are executed inside TOCTOU-safe database transactions.
- Every state transition is recorded in `OrderAuditTrail`.

## 12. Checkout Workflow
```text
[Client] Submits checkout request
   |
   v
[Server] Validate restaurant is open, customer is verified, address is owned
   |
   v
[Server] Load prices from DB (never trusted from client)
   |
   v
[Server] Validate delivery radius, min order, promo code constraints
   |
   v
[Server] Create CheckoutSession (locks price, sets expiry) & Reserve inventory
   |
   +---> If COD:
   |       └──> Create order immediately within same DB transaction
   |
   +---> If Online Payment:
           ├──> Redirect to payment gateway
           └──> Gateway callback -> Verify signature/HMAC -> Complete session -> Create order
```

## 13. Payment Workflow
Payment States: `PENDING → COMPLETED | FAILED | EXPIRED | REFUNDED`
- `CheckoutSession` implements a price lock and attempt counting.
- Prevents payment blocking after max attempts.
- Duplicate payments/orders are prevented using status checks within DB transactions.

## 14. Real-Time Notifications
Socket.IO is used with authenticated rooms.
- **Authentication:** All rooms require an authentication event with a valid JWT before joining.
- **Rooms:**
  - `admin:join { token }` -> joins `admin` room (server-verified ADMIN role).
  - `user:join { token, userId }` -> joins `user:${id}` room (userId must match token).
  - `rider:join { token, riderId }` -> joins `rider:${id}` room.
- **Events:** `order:new` emitted to `admin`; `order:status` emitted globally and to `user:${customerId}`.

## 15. Rider Management
- `RiderProfile` tracks CNIC, vehicle details, and biometric links.
- Dedicated endpoints (`/api/riders`) and Socket.IO rooms for real-time delivery assignment and status tracking.

## 16. Address Management
- Addresses are securely linked to Users.
- Validated during checkout to ensure the address belongs to the user and is within the delivery radius.

## 17. Error Handling & Security
- `safeErrorHandler`: The final Express middleware catches and formats all unhandled errors.
- **Prisma Mapping:** `P2002` (Unique constraint) maps to HTTP 409; `P2025` (Not found) maps to HTTP 404.
- **JWT Errors:** Map to HTTP 401.
- **Production Safety:** Stack traces are explicitly stripped from client responses in production.

## 18. Rate Limiting
Configurable via environment variables to protect key endpoints:
- **Auth:** 10 req / 15 min
- **OTP:** 5 req / 10 min
- **Checkout:** 10 req / min
- **Payment:** 20 req / min
- **Webhooks:** 100 req / min

## 19. Local Development
1. **Database:**
   Use any local PostgreSQL installation (e.g. PostgreSQL for Windows on port 5432) or a free cloud PostgreSQL database (Supabase, Neon). Configure `DATABASE_URL` in `backend/.env`. No Docker or virtualization required.

2. **Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Frontend (Website):**
   ```bash
   cd website
   npm install
   npm run dev
   ```

4. **Mobile:**
   ```bash
   cd mobile-app
   npm install
   npx expo start
   ```

## 20. CI/CD
GitHub Actions (`.github/workflows/ci.yml`) is configured for continuous integration.
- **Jobs:**
  - Backend: `prisma generate`, `prisma validate`, and `tsc`.
  - Frontend: `next build`.
  - Mobile: type check via `tsc --noEmit`.
- **Note:** Deployments are manual for safety; there is no automatic deployment trigger.

## 22. Environment Variables
*Reference list (values omitted for security):*
- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV`
- `RATE_LIMIT_AUTH`
- `RATE_LIMIT_CHECKOUT`
- `PAYMENT_GATEWAY_SECRET`

## 23. API Overview
- `/api/auth`: Login, registration, password management, OTP.
- `/api/menu`: Categories and menu items (read-only for customers).
- `/api/cart`: Cart synchronization.
- `/api/addresses`: User address CRUD.
- `/api/checkout`: Session creation, validation.
- `/api/orders`: Order placement (COD), history, state transitions.
- `/api/payments`: Gateway callbacks and status checking.
- `/api/reviews`: User feedback.
- `/api/riders`: Rider profile, assignment, delivery statuses.
- **Owner/Management Routes:** Granular RBAC-protected administrative endpoints.

## 24. Mobile App
- Built with React Native and Expo.
- Handles Customer ordering and Rider delivery tracking.
- Features include authentication (tokens stored in `AsyncStorage`), cart management, and Socket.IO integration for live updates.

## 25. Engineering Decisions
- **Monorepo:** Centralized repository for full-stack visibility and shared tooling.
- **Prisma & PostgreSQL:** Strong typing and relational integrity ensure accurate order and financial states.
- **TOCTOU Prevention:** Using DB transactions in checkout prevents race conditions (e.g., ordering an out-of-stock item, or canceling an out-for-delivery order).
- **Socket.IO Room Authentication:** Pushing token validation to room join events prevents unauthorized listening.
- **Price Loading:** Prices are always fetched server-side from the database during checkout; client-provided prices are never trusted.

## 26. Known Limitations
- Payment gateways require actual merchant credentials for complete end-to-end testing.
- The backend relies on a single Node.js instance (vertical scaling); horizontal scaling is not yet implemented (requires Redis adapter for Socket.IO).
- The mobile application currently utilizes `AsyncStorage` for token storage, which is not fully encrypted compared to SecureStore.

## 27. Future Improvements
- Implement Redis for Socket.IO to support horizontal scaling of the backend.
- Migrate Mobile app token storage from `AsyncStorage` to `expo-secure-store`.
- Integrate automated E2E tests for the critical checkout flow.
- Add geographic routing for riders.

## 28. License
Copyright. All Rights Reserved.
