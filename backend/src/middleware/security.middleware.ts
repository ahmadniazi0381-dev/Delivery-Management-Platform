/**
 * security.middleware.ts
 * ──────────────────────
 * ponytail: one file for all rate limiting — stdlib (express-rate-limit) over custom.
 * All thresholds read from env so ops can tune without a deploy.
 */
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ── Helpers ────────────────────────────────────────────────────────────────

function envInt(key: string, fallback: number): number {
  const v = parseInt(process.env[key] || '', 10);
  return isNaN(v) ? fallback : v;
}

function envMs(key: string, fallbackMinutes: number): number {
  return envInt(key, fallbackMinutes * 60 * 1000);
}

// ── 1. AUTH ROUTES  (login / register / google / password-reset) ───────────
// Strict: 10 attempts per 15 min per IP. Exponential back-off header returned.
// ponytail: per-account limit not added here — bcrypt timing already constant-time;
//           add per-account Redis counter if brute-force on account IDs becomes a concern.
export const authLimiter = rateLimit({
  windowMs: envMs('RATE_AUTH_WINDOW_MS', 15),           // default 15 min
  max:      envInt('RATE_AUTH_MAX', 10),                  // default 10 req / window
  standardHeaders: true,                                  // Retry-After + RateLimit-* headers
  legacyHeaders:   false,
  skipSuccessfulRequests: false,                          // count even 200s
  handler(req: Request, res: Response) {
    const retryAfter = Math.ceil(
      ((req as any).rateLimit?.resetTime?.getTime?.() - Date.now()) / 1000
    ) || 900;
    res.status(429).json({
      error: 'Too many requests. Please wait before trying again.',
      retryAfterSeconds: retryAfter,
    });
  },
});

// ── 2. OTP routes (send / verify) ──────────────────────────────────────────
// Even stricter: prevents SMS bombing. 5 sends per 10 min per IP.
export const otpLimiter = rateLimit({
  windowMs: envMs('RATE_OTP_WINDOW_MS', 10),
  max:      envInt('RATE_OTP_MAX', 5),
  standardHeaders: true,
  legacyHeaders:   false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many OTP requests. Please wait 10 minutes.' });
  },
});

// ── 3. PUBLIC READ endpoints (menu, categories, banners) ───────────────────
// Moderate: 120 req / min — allows normal browsing, blocks scrapers.
export const publicLimiter = rateLimit({
  windowMs: envMs('RATE_PUBLIC_WINDOW_MS', 1),
  max:      envInt('RATE_PUBLIC_MAX', 120),
  standardHeaders: true,
  legacyHeaders:   false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many requests. Slow down.' });
  },
});

// ── 4. AUTHENTICATED USER actions (cart, orders, addresses, payments) ──────
// Loose: 200 req / min. Blocks bots, not real users.
export const userLimiter = rateLimit({
  windowMs: envMs('RATE_USER_WINDOW_MS', 1),
  max:      envInt('RATE_USER_MAX', 200),
  standardHeaders: true,
  legacyHeaders:   false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many requests.' });
  },
});

// ── 5. OWNER ADMIN actions (write endpoints) ───────────────────────────────
// Admin-only: 300 req / min — bulk operations are common on a dashboard.
export const ownerLimiter = rateLimit({
  windowMs: envMs('RATE_OWNER_WINDOW_MS', 1),
  max:      envInt('RATE_OWNER_MAX', 300),
  standardHeaders: true,
  legacyHeaders:   false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many admin requests.' });
  },
});

// ── 6. Checkout endpoint ─────────────────────────────────────────────────────
export const checkoutLimiter = rateLimit({
  windowMs: envMs('RATE_CHECKOUT_WINDOW_MS', 1),
  max: envInt('RATE_CHECKOUT_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many checkout attempts. Please wait.' });
  },
});

// ── 7. Payment endpoints ─────────────────────────────────────────────────────
export const paymentLimiter = rateLimit({
  windowMs: envMs('RATE_PAYMENT_WINDOW_MS', 1),
  max: envInt('RATE_PAYMENT_MAX', 20),
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many payment requests.' });
  },
});

// ── 8. Webhook endpoint ──────────────────────────────────────────────────────
export const webhookLimiter = rateLimit({
  windowMs: envMs('RATE_WEBHOOK_WINDOW_MS', 1),
  max: envInt('RATE_WEBHOOK_MAX', 100),
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Webhook rate limit exceeded.' });
  },
});

// ── 9. Review submissions ────────────────────────────────────────────────────
export const reviewLimiter = rateLimit({
  windowMs: envMs('RATE_REVIEW_WINDOW_MS', 60),
  max: envInt('RATE_REVIEW_MAX', 5),
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many review submissions. Try again later.' });
  },
});

// ── 10. Profile / password updates ───────────────────────────────────────────
export const profileLimiter = rateLimit({
  windowMs: envMs('RATE_PROFILE_WINDOW_MS', 15),
  max: envInt('RATE_PROFILE_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many profile update attempts.' });
  },
});

// ── 11. Search endpoint ──────────────────────────────────────────────────────
export const searchLimiter = rateLimit({
  windowMs: envMs('RATE_SEARCH_WINDOW_MS', 1),
  max: envInt('RATE_SEARCH_MAX', 60),
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req: Request, res: Response) {
    res.status(429).json({ error: 'Too many search requests.' });
  },
});

// ── 12. Strict schema validation reject middleware ───────────────────────────
// Usage: router.post('/path', validateBody(schema), handler)
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = (result.error as ZodError).issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(422).json({ error: 'Validation failed.', issues });
    }
    req.body = result.data; // replace with parsed & coerced data
    next();
  };
}

import { logSystemEvent } from '../services/system-log.service';

// ── 13. Safe error handler (no stack trace or DB errors to client) ───────────
// Mount as last middleware in Express app: app.use(safeErrorHandler)
export function safeErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Always log full error server-side
  console.error('[ERROR]', {
    message: err.message,
    stack:   err.stack,
    code:    err.code,
  });

  logSystemEvent({
    severity: (err.status || err.statusCode || 500) >= 500 ? 'ERROR' : 'WARN',
    module: 'api',
    message: err.message || 'Unhandled error',
    stack: err.stack,
    details: { code: err.code },
    req: _req,
    userId: (_req as any).user?.id,
  }).catch(() => undefined);

  // Prisma known errors → safe messages
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  if (err.code?.startsWith?.('P')) {
    return res.status(400).json({ error: 'Database operation failed.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' });
  }

  // Default: never expose internals
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status >= 500 ? 'Internal server error.' : err.message });
}
