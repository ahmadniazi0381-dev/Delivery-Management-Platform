import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load Environment Variables
dotenv.config();

import { validateStartupEnvironment } from './config/startup.validation';
import prisma from './config/db';
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import cartRoutes from './routes/cart.routes';
import addressRoutes from './routes/address.routes';
import orderRoutes from './routes/order.routes';
import ownerRoutes from './routes/owner.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import reviewRoutes from './routes/review.routes';
import staffRoutes from './routes/staff.routes';
import managementRoutes from './routes/management.routes';
import salaryRoutes from './routes/salary.routes';
import { safeErrorHandler } from './middleware/security.middleware';
import { registerAuthenticatedSocketHandlers } from './services/socket-auth.service';
import { expireCheckoutSessions } from './services/checkout.service';
import { seedSystemConfig } from './services/config.service';
import { seedDefaultBranch } from './services/branch.service';
import { healthCheck } from './controllers/health.controller';

validateStartupEnvironment();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000'];

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Mobile apps, curl, Postman, server-to-server
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.onrender.com')
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(null, true); // Fallback allow in case of dynamic origin headers
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  allowEIO3: true, // Backwards compatibility for Socket.IO v3/v4 clients
});

app.set('io', io);

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', ownerRoutes);
app.use('/api', paymentRoutes);
app.use('/api', staffRoutes);
app.use('/api', managementRoutes);
app.use('/api', salaryRoutes);

app.get('/api/health', healthCheck);
app.get('/healthz', healthCheck);

// Safe error handler middleware
app.use(safeErrorHandler);

// Health Check (legacy)
app.get('/health', (req, res) => {
  res.redirect(307, '/api/health');
});

// Real-time connections listener
registerAuthenticatedSocketHandlers(io);

// Expire stale checkout sessions periodically
const expirationIntervalMs = parseInt(process.env.CHECKOUT_EXPIRATION_INTERVAL_MS || '60000', 10);
setInterval(() => {
  expireCheckoutSessions().catch((error) => {
    console.error('[CHECKOUT EXPIRATION] Failed:', error);
  });
}, expirationIntervalMs);

// Database seeding helper
async function seedDefaultConfig() {
  try {
    // 1. Seed Delivery Settings
    const deliverySettingCount = await prisma.deliverySetting.count();
    if (deliverySettingCount === 0) {
      await prisma.deliverySetting.create({
        data: {
          shopLatitude: 31.4475531,
          shopLongitude: 74.2690347,
          maxDeliveryKm: 2.2,
          baseDeliveryCharge: 50.0,
          perKmCharge: 20.0,
          minOrderAmount: 200.0,
        },
      });
      console.log('Seeded default shop delivery settings (Karachi Naseeb Baryani UCP coordinates).');
    }

    // 2. Seed Shop Settings
    const shopSettingCount = await prisma.shopSetting.count();
    if (shopSettingCount === 0) {
      await prisma.shopSetting.create({
        data: {
          shopName: 'Karachi Naseeb Baryani & Pulao - UCP Branch',
          contactNumber: '+923001234567',
          openingTime: '11:00',
          closingTime: '23:00',
          isAcceptingOrders: true,
          address: 'UCP Road, Block C, Johar Town, Lahore',
          taxRate: 0.00,
          estimatedDeliveryMinutes: 30,
        },
      });
      console.log('Seeded default shop opening hours & details.');
    }

    // 3. Seed Default Admin User if no admin exists
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin123@';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      const createdAdmin = await prisma.user.create({
        data: {
          name: 'Naseeb Baryani Owner',
          phone: '+923000000000',
          email: 'admin@naseeb.local',
          passwordHash,
          role: 'ADMIN',
          phoneVerified: true,
          mustChangePassword: true,
        },
      });
      console.log('========================================================');
      console.log('[SEED] Created default admin login credentials:');
      console.log('       Phone: +923000000000 / Email: admin@naseeb.local');
      console.log('       Password:', defaultPassword);
      console.log('       Flag: mustChangePassword = true');
      console.log('========================================================');


      // Automatically create an Owner StaffProfile for the seeded admin
      await prisma.staffProfile.create({
        data: {
          userId: createdAdmin.id,
          staffRole: 'OWNER',
          permissions: [
            'DASHBOARD_VIEW', 'ORDERS_VIEW', 'ORDERS_MANAGE',
            'MENU_VIEW', 'MENU_MANAGE', 'CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE',
            'RIDERS_VIEW', 'RIDERS_MANAGE', 'REPORTS_VIEW', 'PAYMENTS_VIEW',
            'PAYMENTS_MANAGE', 'SETTINGS_VIEW', 'SETTINGS_MANAGE', 'STAFF_MANAGE',
            'KDS_VIEW', 'KDS_MANAGE',
          ],
          isActive: true,
        },
      });
      console.log('[SEED] Created Owner StaffProfile for default admin.');
    }

    // Seed Owner StaffProfile for any existing ADMIN users that don't have one
    const adminsWithoutProfile = await prisma.user.findMany({
      where: { role: 'ADMIN', staffProfile: null },
    });
    for (const admin of adminsWithoutProfile) {
      await prisma.staffProfile.create({
        data: {
          userId: admin.id,
          staffRole: 'OWNER',
          permissions: [
            'DASHBOARD_VIEW', 'ORDERS_VIEW', 'ORDERS_MANAGE',
            'MENU_VIEW', 'MENU_MANAGE', 'CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE',
            'RIDERS_VIEW', 'RIDERS_MANAGE', 'REPORTS_VIEW', 'PAYMENTS_VIEW',
            'PAYMENTS_MANAGE', 'SETTINGS_VIEW', 'SETTINGS_MANAGE', 'STAFF_MANAGE',
            'KDS_VIEW', 'KDS_MANAGE',
          ],
          isActive: true,
        },
      });
      console.log(`[SEED] Assigned Owner StaffProfile to existing admin: ${admin.email || admin.phone}`);
    }

    // 4. Seed Default Banner if none exist
    const bannerCount = await prisma.banner.count();
    if (bannerCount === 0) {
      await prisma.banner.create({
        data: {
          title: 'Welcome to Naseeb Baryani!',
          subtitle: 'Authentic Karachi Biryani & Pulao',
          imageUrl: '/images/banner-hero.jpg',
          isActive: true,
          sortOrder: 1,
        },
      });
      console.log('Seeded default homepage promo banner.');
    }
  } catch (error) {
    console.error('Error seeding settings:', error);
  }
}

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  try {
    await seedDefaultConfig();
    await seedDefaultBranch();
    await seedSystemConfig();
  } catch (err: any) {
    console.warn('[STARTUP SEED] Database unavailable or seeding failed — starting in degraded mode.');
    console.warn('[STARTUP SEED] Error:', err?.message || err);
  }
});

