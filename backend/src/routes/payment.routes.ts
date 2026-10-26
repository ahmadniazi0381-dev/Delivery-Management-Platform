import { Router } from 'express';
import { authenticate, requireRole, authenticateWithQueryToken } from '../middleware/auth.middleware';
import {
  validateBody,
  checkoutLimiter,
  paymentLimiter,
  webhookLimiter,
  userLimiter,
} from '../middleware/security.middleware';
import { CheckoutSchema, InitiatePaymentSchema } from '../middleware/validation.schemas';
import {
  checkout,
  getEnabledPaymentMethods,
  initiatePayment,
  getPaymentStatus,
  verifyPayment,
  paymentCallback,
  getSessionPaymentStatus,
  getCheckoutRecoveryStatus,
  paymentRedirectPage,
  webhook,
  getAuditLogs,
} from '../controllers/payment.controller';

const router = Router();

router.get('/payments/methods', getEnabledPaymentMethods);
router.post('/checkout', checkoutLimiter, authenticate, validateBody(CheckoutSchema), checkout);
router.get('/checkout/recovery', userLimiter, authenticate, getCheckoutRecoveryStatus);

router.get('/payments/callback/:gateway', paymentCallback);
router.post('/payments/callback/:gateway', paymentCallback);

router.post('/payments/initiate', paymentLimiter, authenticate, validateBody(InitiatePaymentSchema), initiatePayment);
router.get('/payments/:orderId/status', paymentLimiter, authenticate, getPaymentStatus);
router.get('/payments/verify/:paymentId', paymentLimiter, authenticate, verifyPayment);
router.get('/payments/redirect/:sessionId', paymentLimiter, authenticateWithQueryToken, paymentRedirectPage);
router.get('/payments/session/:sessionId/status', paymentLimiter, authenticate, getSessionPaymentStatus);

router.post('/payments/webhook', webhookLimiter, webhook);

router.get('/owner/audit-logs', userLimiter, authenticate, requireRole('ADMIN'), getAuditLogs);

export default router;
