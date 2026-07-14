import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { verifyWebhookForGateway } from '../services/payment.service';
import { parseGatewayCallback, buildGatewayRedirect } from '../services/gateway.service';
import { getCheckoutRecovery } from '../services/order-recovery.service';
import {
  createCheckout,
  completeCheckoutSession,
  failCheckoutSession,
} from '../services/checkout.service';
import { logAudit } from '../services/audit.service';

/** Online payment methods that trigger payment alerts (not COD). */
const ONLINE_METHODS = ['CARD', 'JAZZCASH', 'EASYPAISA'];

function frontendRedirect(path: string): string {
  const base = (process.env.FRONTEND_URL || process.env.PUBLIC_WEB_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function checkout(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await createCheckout(req.body, req.user!.id, req.app.get('io'), req);
    return res.status(result.flow === 'COD' ? 201 : 200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    await logAudit('CHECKOUT_STARTED', 'FAILED', { error: error.message }, { req, userId: req.user?.id });
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Checkout failed.',
      requirePhoneVerification: error.requirePhoneVerification,
    });
  }
}

export async function paymentRedirectPage(req: AuthenticatedRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: { customer: true },
    });

    if (!session) {
      return res.status(404).send('Checkout session not found.');
    }
    if (session.customerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).send('Unauthorized.');
    }
    if (session.status !== 'PENDING') {
      return res.status(409).send(`Checkout session is ${session.status}.`);
    }

    const redirect = buildGatewayRedirect(session);
    const inputs = Object.entries(redirect.fields)
      .map(
        ([name, value]) =>
          `<input type="hidden" name="${name.replace(/"/g, '&quot;')}" value="${String(value).replace(/"/g, '&quot;')}" />`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Redirecting to payment...</title></head>
<body onload="document.forms[0].submit()">
<p>Redirecting to ${session.paymentMethod}...</p>
<form method="${redirect.method}" action="${redirect.url}">
${inputs}
<noscript><button type="submit">Continue to payment</button></noscript>
</form>
</body></html>`);
  } catch (error: any) {
    console.error('Payment redirect page error:', error);
    return res.status(500).send(error.message || 'Failed to start payment redirect.');
  }
}

export async function getCheckoutRecoveryStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getCheckoutRecovery(req.user!.id);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Checkout recovery error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to recover checkout.' });
  }
}

export async function getSessionPaymentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: { customer: true },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Checkout session not found.' });
    }
    if (session.customerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized checkout session.' });
    }

    if (session.status === 'COMPLETED' && session.orderId) {
      const order = await prisma.order.findUnique({ where: { id: session.orderId } });
      return res.json({
        success: true,
        data: { status: 'COMPLETED', orderId: session.orderId, order },
      });
    }

    if (session.status !== 'PENDING') {
      return res.json({
        success: true,
        data: { status: session.status, message: `Checkout session is ${session.status}.` },
      });
    }

    let gatewayRedirect = null;
    try {
      gatewayRedirect = buildGatewayRedirect(session);
    } catch (error: any) {
      gatewayRedirect = null;
    }

    return res.json({
      success: true,
      data: {
        status: 'PENDING',
        checkoutSessionId: session.id,
        amount: session.total,
        expiresAt: session.expiresAt,
        priceLockedUntil: session.priceLockedUntil,
        gatewayRedirect,
      },
    });
  } catch (error: any) {
    console.error('Session payment status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch payment session status.' });
  }
}

/**
 * Gateway return URL — verifies provider signature/HMAC and completes or fails checkout.
 * No simulated verification; production callbacks only.
 */
export async function paymentCallback(req: AuthenticatedRequest, res: Response) {
  try {
    const { gateway } = req.params;
    const payload = { ...req.query, ...req.body } as Record<string, unknown>;
    const parsed = parseGatewayCallback(gateway, payload, req.headers as Record<string, string | string[] | undefined>);

    if (!parsed.sessionReference) {
      await logAudit('GATEWAY_CALLBACK', 'FAILED', { gateway, reason: 'missing_session_reference', payload }, { req });
      return res.redirect(frontendRedirect('/checkout/failed?reason=invalid_callback'));
    }

    if (!parsed.verified) {
      await logAudit('GATEWAY_CALLBACK', 'FAILED', {
        gateway,
        reason: 'invalid_signature',
        sessionReference: parsed.sessionReference,
      }, { req });
      await failCheckoutSession(parsed.sessionReference, 'Invalid gateway signature.', req);
      return res.redirect(frontendRedirect(`/checkout/failed?sessionId=${encodeURIComponent(parsed.sessionReference)}`));
    }

    if (parsed.success) {
      const result = await completeCheckoutSession(
        parsed.sessionReference,
        req.app.get('io'),
        {
          gatewayName: gateway.toUpperCase(),
          gatewayTransactionId: parsed.gatewayTransactionId,
          gatewayReference: parsed.gatewayReference,
          gatewayPayload: payload,
          gatewayResponse: payload,
        },
        req
      );

      const orderId = result.orderId || '';
      return res.redirect(
        frontendRedirect(`/checkout/success?orderId=${encodeURIComponent(orderId)}&sessionId=${encodeURIComponent(parsed.sessionReference)}`)
      );
    }

    await failCheckoutSession(parsed.sessionReference, parsed.message || 'Gateway reported payment failure.', req);
    return res.redirect(
      frontendRedirect(`/checkout/failed?sessionId=${encodeURIComponent(parsed.sessionReference)}&code=${encodeURIComponent(parsed.responseCode || 'failed')}`)
    );
  } catch (error: any) {
    console.error('Payment callback error:', error);
    return res.redirect(frontendRedirect('/checkout/failed?reason=processing_error'));
  }
}

/**
 * Get enabled payment methods for checkout (public endpoint).
 */
export async function getEnabledPaymentMethods(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await prisma.paymentSetting.findMany({
      where: { enabled: true },
      orderBy: { method: 'asc' },
    });

    const allEnabled = settings.length > 0;
    if (!allEnabled) {
      return res.json({
        success: true,
        data: [
          { method: 'COD', enabled: true },
          { method: 'CARD', enabled: true },
          { method: 'JAZZCASH', enabled: true },
          { method: 'EASYPAISA', enabled: true },
        ],
      });
    }

    return res.json({
      success: true,
      data: settings.map((s) => ({ method: s.method, enabled: s.enabled })),
    });
  } catch (error) {
    console.error('Get enabled payment methods error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch enabled payment methods.' });
  }
}

/**
 * Initiate a payment transaction for an order.
 * Amount is always calculated server-side from the order record.
 */
export async function initiatePayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId, method, transactionRef } = req.body;

    if (!orderId || !method) {
      return res.status(400).json({ success: false, error: 'Order ID and payment method are required.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, payment: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.customerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized to pay for this order.' });
    }

    if (order.payment?.status === 'COMPLETED') {
      return res.status(409).json({
        success: false,
        error: 'Payment already completed.',
        alreadyPaid: true,
        paymentId: order.payment.id,
      });
    }

    if (order.payment) {
      return res.json({
        success: true,
        message: 'Existing payment transaction returned.',
        data: {
          paymentId: order.payment.id,
          orderId: order.payment.orderId,
          amount: order.payment.amount,
          status: order.payment.status,
          method: order.payment.method,
          retryable: order.payment.status === 'PENDING' || order.payment.status === 'EXPIRED',
        },
      });
    }

    const methodSetting = await prisma.paymentSetting.findUnique({
      where: { method: method as any },
    });

    if (methodSetting && !methodSetting.enabled) {
      return res.status(400).json({
        success: false,
        error: `Payment method ${method} is currently disabled. Please choose another method.`,
      });
    }

    const payAmount = parseFloat(order.total.toString());

    const payment = await prisma.payment.create({
      data: {
        orderId,
        method,
        amount: payAmount,
        paidAmount: null,
        currency: 'PKR',
        status: 'PENDING',
        transactionRef: transactionRef || null,
        gatewayName: method === 'COD' ? 'COD' : method,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: method,
        paymentStatus: 'PENDING',
      },
    });

    await logAudit('PAYMENT_CREATED', 'SUCCESS', { paymentId: payment.id, orderId, method }, { req, userId: req.user?.id });

    const isOnlineMethod = ONLINE_METHODS.includes(method);
    return res.json({
      success: true,
      message: 'Payment transaction initiated successfully.',
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        redirectUrl: isOnlineMethod ? `/api/payments/callback/${method.toLowerCase()}` : undefined,
      },
    });
  } catch (error: any) {
    console.error('Initiate payment error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'This transaction reference has already been used.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to initiate payment.' });
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.' });
    }

    if (payment.order.customerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    return res.json({
      success: true,
      message:
        payment.status === 'COMPLETED'
          ? 'Payment already verified.'
          : 'Payment verification is handled by the payment gateway callback. Poll status or wait for webhook.',
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        verified: payment.verified,
        invoiceNumber: payment.invoiceNumber,
        retryable: payment.status === 'PENDING' || payment.status === 'FAILED' || payment.status === 'EXPIRED',
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch payment verification status.' });
  }
}

export async function getPaymentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'No payment transaction found for this order.' });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch payment status.' });
  }
}

export async function webhook(req: AuthenticatedRequest, res: Response) {
  try {
    const payload = req.body;
    const gateway = req.query.gateway as string;
    console.log(`[PAYMENT WEBHOOK RECEIVE] Gateway: ${gateway || 'unknown'}:`, JSON.stringify(payload, null, 2));

    if (!gateway) {
      return res.status(400).json({ success: false, error: 'Gateway query parameter is required.' });
    }

    let isVerified = false;
    try {
      isVerified = verifyWebhookForGateway(gateway, payload, req.headers as Record<string, string | string[] | undefined>);
    } catch (error: any) {
      console.error('[PAYMENT WEBHOOK ERROR]', error.message);
      return res.status(500).json({ success: false, error: 'Webhook verification is not configured.' });
    }

    if (!isVerified) {
      console.error('[PAYMENT WEBHOOK ERROR] Invalid signature verification.');
      await logAudit('GATEWAY_CALLBACK', 'FAILED', { gateway, reason: 'invalid_signature' }, { req });
      return res.status(400).json({ success: false, error: 'Invalid signature.' });
    }

    const transactionRef = payload.transactionRef || payload.pp_TxnRefNo || payload.transaction_id;
    const isSuccess = payload.status === 'COMPLETED' || payload.pp_ResponseCode === '000' || payload.responseCode === '000';
    const sessionRef = payload.checkoutSessionId || payload.sessionId || payload.paymentIntentId;
    const orderId = payload.orderId || payload.order_id;

    if (sessionRef || (!orderId && (payload.pp_BillReference || transactionRef))) {
      const reference = sessionRef || payload.pp_BillReference || transactionRef;
      if (isSuccess) {
        const result = await completeCheckoutSession(
          reference,
          req.app.get('io'),
          {
            gatewayName: gateway?.toUpperCase() || payload.gatewayName || 'CARD',
            gatewayTransactionId: payload.gatewayTransactionId || payload.transaction_id || payload.pp_TxnRefNo,
            gatewayReference: transactionRef || reference,
            gatewayPayload: payload,
            gatewayResponse: payload,
          },
          req
        );
        return res.status(200).json({
          success: true,
          message: result.processed ? 'Webhook received and processed.' : 'Duplicate webhook ignored.',
          data: result,
        });
      }

      await failCheckoutSession(reference, payload.reason || 'Gateway reported failure', req);
      return res.status(200).json({ success: true, message: 'Failed payment callback processed.' });
    }

    if (transactionRef && orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (order) {
        const processed = await prisma.$transaction(async (tx) => {
          const existing = await tx.payment.findUnique({ where: { orderId } });
          if (existing?.status === 'COMPLETED' && isSuccess) {
            return false;
          }

          if (existing) {
            await tx.payment.update({
              where: { id: existing.id },
              data: {
                status: isSuccess ? 'COMPLETED' : 'FAILED',
                verified: isSuccess,
                paidAt: isSuccess ? new Date() : null,
                paidAmount: isSuccess ? order.total : null,
                gatewayPayload: JSON.stringify(payload),
                gatewayResponse: JSON.stringify(payload),
              },
            });
          } else {
            await tx.payment.create({
              data: {
                orderId,
                method: (gateway?.toUpperCase() as any) || 'CARD',
                amount: order.total,
                paidAmount: isSuccess ? order.total : null,
                currency: 'PKR',
                status: isSuccess ? 'COMPLETED' : 'FAILED',
                transactionRef,
                gatewayName: gateway?.toUpperCase() || 'CARD',
                gatewayPayload: JSON.stringify(payload),
                gatewayResponse: JSON.stringify(payload),
                verified: isSuccess,
                paidAt: isSuccess ? new Date() : null,
              },
            });
          }

          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: isSuccess ? 'COMPLETED' : 'FAILED' },
          });

          return true;
        });

        if (!processed) {
          await logAudit('GATEWAY_CALLBACK', 'DUPLICATE', { orderId, gateway }, { req });
          return res.status(200).json({ success: true, message: 'Duplicate webhook ignored.' });
        }

        await logAudit('GATEWAY_CALLBACK', 'SUCCESS', { orderId, gateway }, { req });

        const io = req.app.get('io');
        const isOnlineMethod = ONLINE_METHODS.includes((gateway?.toUpperCase() || order.paymentMethod || ''));

        if (io && isOnlineMethod && isSuccess) {
          io.to('admin').emit('payment:success', {
            orderId,
            method: gateway?.toUpperCase() || order.paymentMethod,
            amount: parseFloat(order.total.toString()),
            transactionRef,
            timestamp: new Date(),
          });
        } else if (io && isOnlineMethod && !isSuccess) {
          io.to('admin').emit('payment:failed', {
            orderId,
            method: gateway?.toUpperCase() || order.paymentMethod,
            amount: parseFloat(order.total.toString()),
            reason: payload.reason,
            timestamp: new Date(),
          });
        }

        if (io) {
          io.to(`user:${order.customerId}`).emit('payment:updated', {
            orderId,
            paymentStatus: isSuccess ? 'COMPLETED' : 'FAILED',
            updatedAt: new Date(),
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook received and processed.' });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return res.status(200).json({ success: false, error: 'Internal processing failed.' });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      action,
      result,
      userId,
      search,
      from,
      to,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) where.action = action;
    if (result) where.result = result;
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }
    if (search) {
      where.OR = [
        { action: { contains: search as string } },
        { result: { contains: search as string } },
        { details: { contains: search as string } },
        { ip: { contains: search as string } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, phone: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
}
