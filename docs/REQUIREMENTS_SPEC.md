# Karachi Naseeb Baryani & Pulao — Requirements Specification

This document outlines the detailed system requirements for the Ordering, Payments, Sound Alerts, and Mobile Application systems.

---

# REQ-ORDER-ALERT-001

## Goal
Notify every online admin immediately when a new customer order is placed, and alert them continuously until the order is handled.

## Trigger
- A new order is placed by a customer AND the payment status is successful OR the payment method is Cash on Delivery (COD).

## Preconditions
- The admin is logged in and connected to the Socket.IO server.
- Browser notification permissions are requested (and optional sound setting is enabled).

## Business Rules
- The alert sound (`foodpanda-sound.mp3`) must loop continuously.
- Only one sound instance plays at any given time (no overlapping sound instances if multiple orders arrive).
- The loop must stop ONLY when all pending orders are resolved (marked as ACCEPTED, REJECTED, or CANCELLED).
- When a new order arrives while the loop is already playing, increment the pending counter but do not restart or double the audio playback.

## Validation Rules
- Order must be in PENDING status to start the alert.
- Only users with the `ADMIN` role receive this broadcast.

## Workflow
1. Customer submits a valid checkout form.
2. Backend verifies payment success or COD option.
3. Backend emits `order:new` event via Socket.IO to the `admin` room.
4. Admins receive the socket event.
5. Continuous sound loop starts.
6. Admin clicks "Accept", "Reject", or "Cancel" on the order details card.
7. Backend updates status and emits `order:accepted`, `order:rejected`, or `order:cancelled`.
8. Sound stops on all connected admin devices immediately if the pending queue becomes empty.

## Success
- The sound loops immediately upon order placement and stops immediately when all orders are acknowledged.

## Failure
- If audio loading fails, log the error, display a fallback red Toast notification, flash the orders layout, and do not crash the browser.

## Edge Cases
- **Admin Offline / Reconnection**: When an admin reconnects, the system automatically fetches any unresolved PENDING orders from the database. If any exist, the looping alert starts immediately.
- **Multiple Admins**: Action by any single admin stops the alert on all admin devices in real-time.

## Permissions
- User role must be `ADMIN` to receive the socket broadcast.
- Browser `Notification` API permission is requested to show alerts in the background.

## API Events
- `order:new` (Receive order details)
- `order:accepted` / `order:rejected` / `order:cancelled` (Sync resolution status)

## UI Behavior
- Browser tab title flashes: `(N) New Orders — Naseeb Admin`.
- The Pending Orders card in the dashboard pulses red.
- Toast notifications slide up in the bottom-right corner.
- Sidebar "Orders" link flashes.

## Acceptance Criteria
- Plays sound within 1 second of order creation.
- Syncs state instantly across multiple admin screens without manual page refreshes.

---

# REQ-PAYMENT-ALERT-001

## Goal
Notify admins immediately with a one-shot notification sound when an online payment is successfully completed.

## Trigger
- Payment webhook receives `paymentStatus = SUCCESS` from the gateway.

## Preconditions
- Order is placed.
- Payment method is CARD, JAZZCASH, or EASYPAISA (online payment methods).

## Business Rules
- Play the payment success sound (`Sucess Sound.mp3`) exactly once.
- Do NOT loop the audio.
- Do NOT overlap sounds. If multiple payments arrive, play them sequentially or queue them.
- Never trigger this sound for COD orders.

## Validation Rules
- The webhook payload signature must verify successfully.
- The order must not already have a marked successful payment.

## Workflow
1. Payment Gateway sends a postback payload to `/api/payments/webhook`.
2. Backend verifies signature.
3. Backend marks order as PAID and emits `payment:success` via Socket.IO to the `admin` room.
4. Frontend plays the success audio once.

## Success
- The success tone plays once, and dashboard indicators update immediately.

## Failure
- Webhook signature mismatch: rejects payload with 400.
- Audio play failure: displays green Toast banner and updates figures without playing sound.

## Edge Cases
- **Multiple simultaneous payments**: Success tones are played sequentially with a brief delay instead of overlapping.

## Permissions
- Accessible publicly (endpoint) but emits alerts to authenticated admins.

## API Events
- `payment:success` (Emit transaction details)

## UI Behavior
- Show a green success Toast notification.
- Update Today's Revenue and Paid Orders counters dynamically.
- Animate revenue increments.

## Acceptance Criteria
- Sound plays within 1 second of webhook verification.
- Updates revenue widgets without page refreshes.

---

# REQ-PAYMENT-ALERT-002

## Goal
Notify admins immediately with a distinct one-shot warning sound when an online payment is failed, declined, or cancelled by the customer.

## Trigger
- Payment webhook receives `paymentStatus = FAILED`, `DECLINED`, or `CANCELLED`.

## Preconditions
- The order was initiated with an online payment method.

## Business Rules
- Play the payment failed sound (`Payment denied .mp3`) exactly once.
- Do NOT loop.
- Show the specific failure reason (e.g. Insufficient Balance, Timeout) on the customer and admin interfaces.
- Allow the customer to retry payment ONLY if the current status is not SUCCESS.

## Validation Rules
- Gateway response must contain valid reference matches.

## Workflow
1. Payment gateway redirects to cancel URL or sends failed webhook status.
2. Backend updates state and broadcasts `payment:failed`.
3. Admin dashboard plays the warning sound once and shows the details.
4. Customer screen updates to show a payment failed notice with a retry button.

## Success
- The warning tone plays once and retry is offered to the customer.

## Failure
- Sound play fails: updates dashboard lists and displays a warning Toast.

## Edge Cases
- **Customer refreshes during failure**: System retains the failed state and continues to offer the retry option.

## Permissions
- Admins see failure logs; customers see failure alerts on their personal devices.

## API Events
- `payment:failed` / `payment:declined` / `payment:cancelled`

## UI Behavior
- Red toast alerts appear on the admin panel.
- Red warning badge appears next to the payment column in the orders table.

## Acceptance Criteria
- Plays warning sound within 1 second of failure.
- Enables the retry button instantly on the client app.

---

# REQ-SOUND-SYSTEM-001

## Goal
Provide a comprehensive centralized sound manager to handle restaurant system alerts by priority level and volume preferences.

## Trigger
- Handled internally by client actions and socket hooks.

## Preconditions
- App settings initialized in `localStorage`.

## Business Rules
- **High Priority**: New Orders (Loops until resolved).
- **Medium Priority**: Payment Success, Payment Failure, Rider Arrived (Plays once).
- **Low Priority**: Reviews, Analytics, New Customers (Silent).
- Admin can configure settings globally or per event.

## Validation Rules
- Time inputs for quiet hours must be formatted in "HH:MM".
- Volume slider values must be bounded between 0.0 and 1.0.

## Workflow
1. Admin opens the settings tab.
2. Admin modifies volume, toggles master mute, or checks sound toggles.
3. Changes are written to `localStorage` immediately.
4. Any audio event refers to the current configuration state before playing.

## Success
- Settings are loaded and applied correctly to all audio playbacks instantly.

## Failure
- If storage access is blocked, default fallback settings are loaded.

## Edge Cases
- **Quiet Hours overnight**: An overnight range (e.g., 23:00 to 07:00) is evaluated correctly to silence sounds.

## Permissions
- User role must be `ADMIN`.

## API Events
- None (Local component state).

## UI Behavior
- Interactive sliders, switches, time fields, and live test buttons.

## Acceptance Criteria
- Restoring settings to default clears customization instantly.

---

# REQ-PAYMENT-001

## Goal
Enforce exact one-to-one mapping between orders and successful payment transactions, preventing duplicate charges.

## Trigger
- Payment initiation or webhook completion.

## Preconditions
- The order must exist and be unpaid.

## Business Rules
- One order = exactly one successful payment.
- Once a payment is SUCCESS, lock the payment record and reject all future payment attempts.
- Use unique constraints on the database transaction level to prevent duplicate transaction entries.
- Use idempotency keys for gateway requests.

## Validation Rules
- Reject if order status is already PAID.
- Reject if another payment request is currently in the PENDING state (within a 1-minute window).

## Workflow
1. Customer requests payment.
2. System checks for COMPLETED payment record → redirects if found.
3. System checks for a PENDING payment record created in the last 60 seconds → rejects duplicate clicks.
4. System inserts a PENDING payment, locking the order state.
5. Gateway returns success → DB transaction updates order to COMPLETED, locking it permanently.

## Success
- Only one successful transaction is stored, and the payment button is disabled.

## Failure
- Returns 409 Conflict with "This order has already been paid" if a retry is attempted.

## Edge Cases
- **Multiple open tabs**: Simultaneous clicks in different tabs are caught by the database unique constraints and transaction isolation.

## Permissions
- Customers can write payments for their own orders; admins can query statuses.

## API Events
- `payment:updated` (Sent to customer user room)

## UI Behavior
- Disables pay buttons and shows loading indicators.

## Acceptance Criteria
- Prevents duplicate payments across tabs, refreshes, and double-clicks.

---

# REQ-PAYMENT-002

## Goal
Lock the payment controls immediately upon click to prevent double submission during gateway processing.

## Trigger
- Customer clicks the "Pay" button.

## Preconditions
- Checkout form is complete and valid.

## Business Rules
- Disable the Pay button immediately.
- Display "Processing Payment..." with a spinner.
- Keep the button disabled until a final response (SUCCESS, FAILED, or CANCELLED) is received.

## Validation Rules
- Double submissions must be blocked on the UI layer.

## Workflow
1. User clicks Pay.
2. UI disables button and displays a spinner.
3. If SUCCESS: permanently hide the button.
4. If FAILED: enable the retry button.

## Success
- Only one initiation request is sent, and the UI remains locked during the wait.

## UI Behavior
- The button text changes to "Processing Payment..." with an active spinner.

## Acceptance Criteria
- Buttons are disabled within milliseconds of clicking.

---

# REQ-MOBILE-001

## Goal
Support both Android and iOS platforms with a single codebase and complete feature parity.

## Trigger
- Application launch or build command.

## Preconditions
- React Native / Flutter workspace configuration.

## Business Rules
- One shared codebase (no duplicate Android and iOS directories for business logic).
- Achieve identical feature sets across customer, admin, and rider modules.
- Cache menu items, cart data, and addresses to support offline browsing.
- Use secure local storage for tokens.

## Validation Rules
- Native build parameters must target SDK levels for Play Store and App Store.

## Workflow
1. Developer compiles build targeting Android or iOS.
2. Shared codebase routes pages depending on user authentication.
3. Real-time updates occur via Socket.IO connection.

## Success
- Compile successfully on both platforms with identical runtime logic.

## Edge Cases
- **Offline mode**: Loads local cached data when connectivity drops, and auto-syncs when online.

## Permissions
- Request location (tracking) and notifications (push) only when needed.

## API Events
- All REST and Socket.IO events match the web version.

## UI Behavior
- Smooth scrolling (60 FPS targets), cold start under 3 seconds.

## Acceptance Criteria
- Unified code deployment works perfectly on both platforms.

---

# REQ-MOBILE-ROLE-001

## Goal
Support guest, customer, admin, and rider roles inside a single mobile application bundle by routing users based on their account role returned from login.

## Trigger
- Successful authentication.

## Preconditions
- User has registered credentials.

## Business Rules
- A single application binary handles all roles.
- Do not build separate apps for riders or admins.
- The backend login payload returns user role (`CUSTOMER`, `ADMIN`, `RIDER`).
- The app mounts the correct layout stack dynamically.

## Validation Rules
- Reject if role is unauthorized.

## Workflow
1. User enters phone and password.
2. Backend validates credentials and returns JWT token + role.
3. Mobile app stores token securely.
4. Dynamic router checks the role:
   - If `CUSTOMER`: load shopping stack.
   - If `ADMIN`: load operational dashboard.
   - If `RIDER`: load delivery map list.

## Success
- Correct interface mounts automatically based on account role.

## Acceptance Criteria
- Logging in as Admin loads the control center; logging in as Rider loads assignments.
