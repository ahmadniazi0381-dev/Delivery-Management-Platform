# API Reference - Karachi Naseeb Baryani & Pulao UCP

This document contains a description of the REST API endpoints provided by the backend application.

---

## 1. Authentication & Security Endpoints (`/api/auth`)

All authentication routes return JWT tokens. The `Authorization: Bearer <TOKEN>` header is required for protected client routes.

### A. Customer & Admin Registration
- **Route**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "phone": "+923001234567",
    "password": "securepassword123",
    "email": "john@example.com"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "User registered successfully. Verify phone number.",
    "token": "eyJhbGciOi...",
    "user": { "id": "uuid-123", "name": "John Doe", "phone": "+923001234567", "phoneVerified": false }
  }
  ```

### B. Account Login (Phone + Password)
- **Route**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "phone": "+923001234567",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOi...",
    "user": { "id": "uuid-123", "name": "John Doe", "role": "CUSTOMER", "phoneVerified": true }
  }
  ```

### C. Google OAuth Sign-In
- **Route**: `POST /api/auth/google`
- **Request Body**:
  ```json
  {
    "idToken": "google-id-token-received-on-client"
  }
  ```

### D. Generate & Send OTP (2FA)
- **Route**: `POST /api/auth/otp/send`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "phone": "+923001234567",
    "purpose": "PHONE_VERIFICATION"
  }
  ```
- **Response (200 OK)**:
  ```json
  { "status": "success", "message": "OTP sent successfully." }
  ```

### E. Verify OTP
- **Route**: `POST /api/auth/otp/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "otpCode": "123456",
    "purpose": "PHONE_VERIFICATION"
  }
  ```
- **Response (200 OK)**:
  ```json
  { "status": "success", "message": "Phone number verified successfully." }
  ```

---

## 2. Menu Public API (`/api/menu`)

These are public endpoints that do not require auth headers.

### A. List All Categories
- **Route**: `GET /api/menu/categories`
- **Response (200 OK)**:
  ```json
  [
    { "id": "cat-uuid", "name": "Baryani", "description": "Karachi Basmati rice dishes", "imageUrl": "/images/cat1.jpg" }
  ]
  ```

### B. List Menu Items (with Search & Filters)
- **Route**: `GET /api/menu`
- **Query Params**:
  - `category`: Category ID (optional filter)
  - `search`: Name/Description query (optional)
  - `featured`: `true`/`false` (optional)
- **Response (200 OK)**:
  ```json
  [
    { "id": "item-uuid", "name": "Naseeb Special Baryani", "price": 280.00, "isAvailable": true }
  ]
  ```

---

## 3. Cart Management (`/api/cart`)

Protected routes (`Authorization` header required).

### A. Get Active Cart Items
- **Route**: `GET /api/cart`
- **Response (200 OK)**:
  ```json
  {
    "items": [
      { "id": "cart-item-id", "quantity": 2, "menuItem": { "name": "Chicken Baryani", "price": 320.00 } }
    ]
  }
  ```

### B. Add / Update Cart Item
- **Route**: `POST /api/cart`
- **Request Body**:
  ```json
  {
    "menuItemId": "item-uuid",
    "quantity": 1
  }
  ```

---

## 4. Addresses & Delivery Check (`/api/addresses` & `/api/delivery`)

Protected routes.

### A. Check Address Eligibility
- **Route**: `POST /api/delivery/check-eligibility`
- **Request Body**:
  ```json
  {
    "latitude": 31.446123,
    "longitude": 74.268456
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "eligible": true,
    "distanceKm": 0.42,
    "maxDeliveryKm": 2.2,
    "deliveryCharge": 50.00
  }
  ```

### B. Add Saved Address
- **Route**: `POST /api/addresses`
- **Request Body**:
  ```json
  {
    "label": "Work",
    "addressLine": "UCP Road, Block C, Lahore",
    "latitude": 31.447553,
    "longitude": 74.269034
  }
  ```

---

## 5. Orders - Customer Actions (`/api/orders`)

Protected routes.

### A. Place Order
- **Route**: `POST /api/orders`
- **Request Body**:
  ```json
  {
    "addressId": "address-uuid",
    "paymentMethod": "COD",
    "specialInstructions": "Make it extra spicy",
    "couponCode": "WELCOME50"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "orderId": "order-uuid",
    "total": 650.00
  }
  ```

---

## 6. Admin / Owner APIs (`/api/owner`)

Protected routes requiring `ADMIN` role.

### A. Get Order Queue
- **Route**: `GET /api/owner/orders`
- **Response (200 OK)**:
  ```json
  [
    { "id": "order-uuid", "status": "PENDING", "placedAt": "2026-07-10T..." }
  ]
  ```

### B. Update Order Status
- **Route**: `PUT /api/owner/orders/:id/status`
- **Request Body**:
  ```json
  {
    "status": "PREPARING"
  }
  ```
- **Response (200 OK)**: Sends WebSocket push event automatically to customer app/website.
