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
import { safeErrorHandler } from './middleware/security.middleware';
import { registerAuthenticatedSocketHandlers } from './services/socket-auth.service';
import { expireCheckoutSessions } from './services/checkout.service';
import { seedSystemConfig } from './services/config.service';
import { seedDefaultBranch } from './services/branch.service';
import { healthCheck } from './controllers/health.controller';

validateStartupEnvironment();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev/testing ease
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Middlewares
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow all origins in development to facilitate testing on physical mobile devices and local networks
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} is not allowed.`));
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

    // 3. Seed Default Admin User if no users exist
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      await prisma.user.create({
        data: {
          name: 'Naseeb Baryani Owner',
          phone: '+923000000000',
          passwordHash,
          role: 'ADMIN',
          phoneVerified: true,
        },
      });
      console.log('========================================================');
      console.log('[SEED] Created default admin login credentials:');
      console.log('       Phone: +923000000000');
      console.log('       Password: admin123');
      console.log('========================================================');
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
  await seedDefaultConfig();
  await seedDefaultBranch();
  await seedSystemConfig();
});

