import { Prisma, PaymentMethod, DeliveryType } from '@prisma/client';
import { Request } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { isWithinDeliveryRadius } from './distance.service';
import { logAudit } from './audit.service';
import {
  validateAndReserveInventory,
  releaseInventoryForSession,
  confirmInventoryForSession,
} from './inventory.service';
import { sendPushToUser } from './push.service';
import { getConfigNumber } from './config.service';
import { getDefaultBranchId } from './branch.service';
import { generateDailyInvoiceNumber } from './invoice.service';
import { buildGatewayRedirect } from './gateway.service';

const DEFAULT_SHOP_LAT = 31.4475531;
const DEFAULT_SHOP_LNG = 74.2690347;
const DEFAULT_MAX_KM = 2.2;
const ONLINE_METHODS: PaymentMethod[] = ['CARD', 'JAZZCASH', 'EASYPAISA'];

type CheckoutBody = {
  addressId?: string;
  latitude?: number;
  longitude?: number;
  addressLine?: string;
  paymentMethod: PaymentMethod;
  deliveryType?: DeliveryType;
  promoCode?: string;
  specialInstructions?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientRelationship?: string;
  items?: { menuItemId: string; quantity: number }[];
};

type SocketServer = {
  to(room: string): { emit(event: string, payload: unknown): void };
  emit(event: string, payload: unknown): void;
} | null | undefined;

type AuditRequest = Request | AuthenticatedRequest;

async function pendingTimeoutMinutes() {
  return getConfigNumber('checkout.timeout_minutes', 15);
}

async function priceLockMinutes() {
  return getConfigNumber('checkout.price_lock_minutes', 15);
}

async function maxPaymentAttempts() {
  return getConfigNumber('payment.max_attempts', 5);
}

async function paymentBlockMinutes() {
  return getConfigNumber('payment.block_minutes', 10);
}

function gatewayName(method: PaymentMethod) {
  if (method === 'CARD') return 'CARD';
  return method;
}

async function resolveBranchId() {
  return getDefaultBranchId();
}

function isRestaurantOpen(openingTime: string, closingTime: string, now = new Date()): boolean {
  const [oh, om] = openingTime.split(':').map(Number);
  const [ch, cm] = closingTime.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  if (closeMins >= openMins) return nowMins >= openMins && nowMins <= closeMins;
  return nowMins >= openMins || nowMins <= closeMins;
}

export function isOnlinePaymentMethod(method: PaymentMethod) {
  return ONLINE_METHODS.includes(method);
}

async function ensurePaymentMethodEnabled(method: PaymentMethod) {
  const setting = await prisma.paymentSetting.findUnique({ where: { method } });
  if (setting && !setting.enabled) {
    const err = new Error(`Payment method ${method} is currently disabled. Please choose another method.`);
    (err as any).status = 400;
    throw err;
  }
}

async function validateRestaurantOpen() {
  const shop = await prisma.shopSetting.findFirst();
  if (!shop) return;
  if (!shop.isAcceptingOrders) {
    const err = new Error('Restaurant is not accepting orders right now.');
    (err as any).status = 400;
    throw err;
  }
  if (!isRestaurantOpen(shop.openingTime, shop.closingTime)) {
    const err = new Error(`Restaurant is closed. Hours: ${shop.openingTime} - ${shop.closingTime}.`);
    (err as any).status = 400;
    throw err;
  }
}

async function getVerifiedCustomer(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found.');
    (err as any).status = 404;
    throw err;
  }
  if (user.blockedAt) {
    const err = new Error('Your account is blocked.');
    (err as any).status = 403;
    throw err;
  }
  if (!user.phone || !user.phoneVerified) {
    const err = new Error(
      !user.phone
        ? 'Add and verify a phone number before placing an order.'
        : 'Phone number verification is required before placing an order.'
    );
    (err as any).status = 403;
    (err as any).requirePhoneVerification = true;
    (err as any).requirePhone = !user.phone;
    throw err;
  }
  return user;
}

async function buildCheckoutDraft(userId: string, body: CheckoutBody) {
  await validateRestaurantOpen();

  const settings = await prisma.deliverySetting.findFirst();
  const shopLat = settings?.shopLatitude || DEFAULT_SHOP_LAT;
  const shopLng = settings?.shopLongitude || DEFAULT_SHOP_LNG;
  const maxKm = settings?.maxDeliveryKm || DEFAULT_MAX_KM;

  let finalAddressId = body.addressId || null;
  let finalLatitude = 0;
  let finalLongitude = 0;
  let finalAddressLine = '';
  let addressPayload: Prisma.InputJsonValue | undefined;

  if (body.addressId) {
    const address = await prisma.address.findUnique({ where: { id: body.addressId } });
    if (!address || address.userId !== userId) {
      const err = new Error('Selected address not found.');
      (err as any).status = 404;
      throw err;
    }
    finalLatitude = address.latitude;
    finalLongitude = address.longitude;
    finalAddressLine = address.addressLine;
  } else {
    if (body.latitude === undefined || body.longitude === undefined || !body.addressLine) {
      const err = new Error('Address ID or inline coordinates with address line are required.');
      (err as any).status = 400;
      throw err;
    }
    finalLatitude = body.latitude;
    finalLongitude = body.longitude;
    finalAddressLine = body.addressLine;
    addressPayload = {
      label: 'Current Location',
      addressLine: finalAddressLine,
      latitude: finalLatitude,
      longitude: finalLongitude,
      isDefault: false,
    };
  }

  const distResult = isWithinDeliveryRadius(shopLat, shopLng, finalLatitude, finalLongitude, maxKm);
  if (!distResult.eligible) {
    const err = new Error(
      `Selected address is outside our delivery range. (Distance: ${distResult.distance} km, Max: ${maxKm} km)`
    );
    (err as any).status = 400;
    throw err;
  }

  let cartItems: { menuItemId: string; quantity: number; menuItem: any }[] = [];
  if (body.items && body.items.length > 0) {
    const menuItemIds = body.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { category: true },
    });
    cartItems = body.items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) {
        const err = new Error(`Menu item not found: ${item.menuItemId}`);
        (err as any).status = 400;
        throw err;
      }
      return { menuItemId: item.menuItemId, quantity: item.quantity, menuItem };
    });
  } else {
    const dbCart = await prisma.cartItem.findMany({
      where: { userId },
      include: { menuItem: { include: { category: true } } },
    });
    if (dbCart.length === 0) {
      const err = new Error('Shopping cart is empty.');
      (err as any).status = 400;
      throw err;
    }
    cartItems = dbCart.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      menuItem: item.menuItem,
    }));
  }

  if (cartItems.length === 0) {
    const err = new Error('Shopping cart is empty.');
    (err as any).status = 400;
    throw err;
  }

  let subtotal = 0;
  for (const item of cartItems) {
    if (!item.menuItem.isAvailable || !item.menuItem.inStock) {
      const err = new Error(`Item "${item.menuItem.name}" is currently unavailable. Please remove it from your cart.`);
      (err as any).status = 400;
      throw err;
    }
    if (!item.menuItem.category?.isActive) {
      const err = new Error(`Category for "${item.menuItem.name}" is not available.`);
      (err as any).status = 400;
      throw err;
    }
    subtotal += parseFloat(item.menuItem.price.toString()) * item.quantity;
  }

  const minOrderAmt = parseFloat(settings?.minOrderAmount?.toString() || '200.00');
  if (subtotal < minOrderAmt) {
    const err = new Error(`Minimum order amount is Rs. ${minOrderAmt}. Current subtotal is Rs. ${subtotal}.`);
    (err as any).status = 400;
    throw err;
  }

  const selectedType: DeliveryType = body.deliveryType === 'PRIORITY' ? 'PRIORITY' : 'STANDARD';
  let deliveryCharge: number;
  if (selectedType === 'PRIORITY') {
    if (!settings?.priorityEnabled) {
      const err = new Error('Priority delivery is currently unavailable.');
      (err as any).status = 400;
      throw err;
    }
    deliveryCharge = parseFloat(settings?.priorityFee?.toString() || '125.00');
  } else {
    if (settings && !settings.standardEnabled) {
      const err = new Error('Standard delivery is currently unavailable.');
      (err as any).status = 400;
      throw err;
    }
    deliveryCharge = settings?.standardFee
      ? parseFloat(settings.standardFee.toString())
      : parseFloat(settings?.baseDeliveryCharge?.toString() || '50.00') +
        Math.max(0, distResult.distance - 1) * parseFloat(settings?.perKmCharge?.toString() || '20.00');
  }

  let discountAmount = 0;
  if (body.promoCode) {
    const discount = await prisma.discount.findUnique({
      where: { promoCode: body.promoCode },
    });
    const now = new Date();
    if (!discount || !discount.isActive || now < discount.startDate || now > discount.endDate) {
      const err = new Error('Invalid or expired promo code.');
      (err as any).status = 400;
      throw err;
    }
    const val = parseFloat(discount.value.toString());
    discountAmount = discount.type === 'PERCENT' ? subtotal * (val / 100) : val;
    if (discountAmount > subtotal) discountAmount = subtotal;
  }

  const total = subtotal + deliveryCharge - discountAmount;
  const itemsPayload = cartItems.map((item) => ({
    menuItemId: item.menuItemId,
    itemName: item.menuItem.name,
    unitPrice: parseFloat(item.menuItem.price.toString()),
    quantity: item.quantity,
  }));

  return {
    addressId: finalAddressId,
    addressPayload,
    orderPayload: {
      specialInstructions: body.specialInstructions || null,
      recipientName: body.recipientName || null,
      recipientPhone: body.recipientPhone || null,
      recipientRelationship: body.recipientRelationship || null,
      couponCode: body.promoCode || null,
    },
    itemsPayload,
    subtotal,
    deliveryCharge,
    discountAmount,
    total,
    distanceKm: distResult.distance,
    deliveryType: selectedType,
    usedInlineItems: !!body.items,
  };
}

async function nextOrderNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const seq = await tx.orderSequence.upsert({
    where: { year },
    update: { seq: { increment: 1 } },
    create: { year, seq: 1 },
  });
  return `ORD-${year}-${String(seq.seq).padStart(4, '0')}`;
}

function emitOrderNew(io: SocketServer, order: any, user: { name: string }, itemsCount: number) {
  io?.to('admin').emit('order:new', {
    orderId: order.id,
    orderNumber: order.orderNumber || order.id,
    customerName: user.name,
    total: order.total,
    itemsCount,
    paymentMethod: order.paymentMethod,
    placedAt: order.placedAt,
  });
}

async function notifyAdminsNewOrder(order: any, customerName: string) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  for (const admin of admins) {
    await sendPushToUser(
      admin.id,
      'New Order',
      `${customerName} placed order ${order.orderNumber} for Rs. ${order.total}`,
      'ORDER_UPDATE'
    );
  }
  await logAudit('NOTIFICATION_SENT', 'SUCCESS', { type: 'order:new', orderId: order.id });
}

async function createOrderAndPayment(
  tx: Prisma.TransactionClient,
  userId: string,
  paymentMethod: PaymentMethod,
  draft: Awaited<ReturnType<typeof buildCheckoutDraft>>,
  payment: {
    status: 'PENDING' | 'COMPLETED';
    gatewayName?: string;
    gatewayTransactionId?: string | null;
    gatewayReference?: string | null;
    gatewayPayload?: string | null;
    gatewayResponse?: string | null;
    verified?: boolean;
    paidAt?: Date | null;
    paidAmount?: number | null;
    invoiceNumber?: string | null;
  }
) {
  let addressId = draft.addressId;
  if (!addressId && draft.addressPayload) {
    const address = await tx.address.create({
      data: {
        ...(draft.addressPayload as any),
        userId,
      },
    });
    addressId = address.id;
  }
  if (!addressId) throw new Error('Address could not be resolved.');

  const orderPayload = draft.orderPayload as any;
  const branchId = await resolveBranchId();
  const order = await tx.order.create({
    data: {
      branchId,
      orderNumber: await nextOrderNumber(tx),
      customerId: userId,
      addressId,
      status: 'PENDING',
      subtotal: draft.subtotal,
      deliveryCharge: draft.deliveryCharge,
      discountAmount: draft.discountAmount,
      total: draft.total,
      distanceKm: draft.distanceKm,
      paymentMethod,
      deliveryType: draft.deliveryType,
      paymentStatus: payment.status,
      specialInstructions: orderPayload.specialInstructions,
      recipientName: orderPayload.recipientName,
      recipientPhone: orderPayload.recipientPhone,
      recipientRelationship: orderPayload.recipientRelationship,
      couponCode: orderPayload.couponCode,
    },
  });

  await tx.orderItem.createMany({
    data: (draft.itemsPayload as any[]).map((item) => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity,
    })),
  });

  const invoiceNumber =
    payment.invoiceNumber ||
    (payment.status === 'COMPLETED' ? await generateDailyInvoiceNumber(tx) : null);

  await tx.payment.create({
    data: {
      branchId,
      orderId: order.id,
      method: paymentMethod,
      amount: draft.total,
      paidAmount: payment.paidAmount ?? (payment.status === 'COMPLETED' ? draft.total : null),
      currency: 'PKR',
      status: payment.status,
      transactionRef: payment.gatewayReference || null,
      gatewayName: payment.gatewayName || (paymentMethod === 'COD' ? 'COD' : null),
      gatewayTransactionId: payment.gatewayTransactionId || null,
      gatewayReference: payment.gatewayReference || null,
      gatewayPayload: payment.gatewayPayload || null,
      gatewayResponse: payment.gatewayResponse || null,
      verified: !!payment.verified,
      paidAt: payment.paidAt || null,
      refundStatus: 'NONE',
      invoiceNumber,
    },
  });

  if (invoiceNumber) {
    await logAudit('INVOICE_GENERATED', 'SUCCESS', { orderId: order.id, invoiceNumber });
  }

  await logAudit('ORDER_CREATED', 'SUCCESS', { orderId: order.id, orderNumber: order.orderNumber, paymentMethod });
  return order;
}

export async function expireCheckoutSessions(): Promise<number> {
  const now = new Date();
  const expired = await prisma.checkoutSession.findMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    select: { id: true },
  });

  if (expired.length === 0) return 0;

  await prisma.checkoutSession.updateMany({
    where: { id: { in: expired.map((s) => s.id) }, status: 'PENDING' },
    data: { status: 'EXPIRED' },
  });

  for (const session of expired) {
    await releaseInventoryForSession(session.id);
    await logAudit('CHECKOUT_EXPIRED', 'SUCCESS', { checkoutSessionId: session.id });
  }

  return expired.length;
}

async function assertSessionPayable(session: { paymentBlockedUntil: Date | null; attemptCount: number }) {
  if (session.paymentBlockedUntil && session.paymentBlockedUntil > new Date()) {
    const err = new Error('Too many failed payment attempts. Please try again later.');
    (err as any).status = 429;
    (err as any).retryAfter = session.paymentBlockedUntil;
    throw err;
  }
}

async function recordFailedPaymentAttempt(sessionId: string) {
  const session = await prisma.checkoutSession.findUnique({ where: { id: sessionId } });
  if (!session) return;

  const attemptCount = session.attemptCount + 1;
  const blocked = attemptCount >= (await maxPaymentAttempts());
  await prisma.checkoutSession.update({
    where: { id: sessionId },
    data: {
      attemptCount,
      status: blocked ? 'FAILED' : session.status,
      paymentBlockedUntil: blocked
        ? new Date(Date.now() + (await paymentBlockMinutes()) * 60 * 1000)
        : session.paymentBlockedUntil,
    },
  });

  if (blocked) {
    await releaseInventoryForSession(sessionId);
    await logAudit('PAYMENT_BLOCKED', 'BLOCKED', { checkoutSessionId: sessionId, attemptCount });
  }

  await logAudit('PAYMENT_FAILED', 'FAILED', { checkoutSessionId: sessionId, attemptCount });
}

export async function createCheckout(body: CheckoutBody, userId: string, io: SocketServer, req?: AuditRequest) {
  await ensurePaymentMethodEnabled(body.paymentMethod);
  const user = await getVerifiedCustomer(userId);
  const draft = await buildCheckoutDraft(userId, body);

  if (!isOnlinePaymentMethod(body.paymentMethod)) {
    await expireCheckoutSessions();

    const now = new Date();
    const timeoutMin = await pendingTimeoutMinutes();
    const lockMin = await priceLockMinutes();
    const expiresAt = new Date(now.getTime() + timeoutMin * 60 * 1000);
    const priceLockedUntil = new Date(now.getTime() + lockMin * 60 * 1000);
    const branchId = await resolveBranchId();
    const gatewayReference = `COD-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const order = await prisma.$transaction(async (tx) => {
      const session = await tx.checkoutSession.create({
        data: {
          branchId,
          customerId: userId,
          paymentMethod: body.paymentMethod,
          deliveryType: draft.deliveryType,
          addressId: draft.addressId,
          addressPayload: draft.addressPayload,
          orderPayload: draft.orderPayload,
          itemsPayload: draft.itemsPayload as Prisma.InputJsonValue,
          subtotal: draft.subtotal,
          deliveryCharge: draft.deliveryCharge,
          discountAmount: draft.discountAmount,
          total: draft.total,
          distanceKm: draft.distanceKm,
          gatewayName: 'COD',
          gatewayReference,
          priceLockedAt: now,
          priceLockedUntil,
          expiresAt,
        },
      });

      await validateAndReserveInventory(
        tx,
        session.id,
        (draft.itemsPayload as any[]).map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        }))
      );

      const created = await createOrderAndPayment(tx, userId, body.paymentMethod, draft, {
        status: 'PENDING',
        gatewayName: 'COD',
        gatewayReference,
      });

      await confirmInventoryForSession(tx, session.id);

      await tx.checkoutSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          orderId: created.id,
        },
      });

      if (!draft.usedInlineItems) await tx.cartItem.deleteMany({ where: { userId } });
      return created;
    });

    await logAudit('INVENTORY_CONFIRMED', 'SUCCESS', { flow: 'COD', orderId: order.id }, { req, userId });
    await logAudit('PAYMENT_CREATED', 'SUCCESS', { orderId: order.id, method: 'COD' }, { req, userId });
    emitOrderNew(io, order, user, draft.itemsPayload.length);
    await notifyAdminsNewOrder(order, user.name);
    await logAudit('CHECKOUT_STARTED', 'SUCCESS', { flow: 'COD', orderId: order.id }, { req, userId });
    return { flow: 'COD', order };
  }

  await expireCheckoutSessions();

  const now = new Date();
  const timeoutMin = await pendingTimeoutMinutes();
  const lockMin = await priceLockMinutes();
  const expiresAt = new Date(now.getTime() + timeoutMin * 60 * 1000);
  const priceLockedUntil = new Date(now.getTime() + lockMin * 60 * 1000);
  const branchId = await resolveBranchId();

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.checkoutSession.create({
      data: {
        branchId,
        customerId: userId,
        paymentMethod: body.paymentMethod,
        deliveryType: draft.deliveryType,
        addressId: draft.addressId,
        addressPayload: draft.addressPayload,
        orderPayload: draft.orderPayload,
        itemsPayload: draft.itemsPayload as Prisma.InputJsonValue,
        subtotal: draft.subtotal,
        deliveryCharge: draft.deliveryCharge,
        discountAmount: draft.discountAmount,
        total: draft.total,
        distanceKm: draft.distanceKm,
        gatewayName: gatewayName(body.paymentMethod),
        gatewayReference: `CHK-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        priceLockedAt: now,
        priceLockedUntil,
        expiresAt,
      },
    });

    await validateAndReserveInventory(
      tx,
      created.id,
      (draft.itemsPayload as any[]).map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }))
    );

    return created;
  });

  await logAudit(
    'CHECKOUT_STARTED',
    'SUCCESS',
    {
      checkoutSessionId: session.id,
      total: parseFloat(session.total.toString()),
      priceLockedUntil: priceLockedUntil.toISOString(),
      checkoutExpiresAt: expiresAt.toISOString(),
    },
    { req, userId }
  );
  await logAudit('PAYMENT_CREATED', 'SUCCESS', { checkoutSessionId: session.id, method: body.paymentMethod }, { req, userId });

  const sessionWithCustomer = await prisma.checkoutSession.findUnique({
    where: { id: session.id },
    include: { customer: true },
  });
  const gatewayRedirect = buildGatewayRedirect(sessionWithCustomer!);

  await logAudit(
    'GATEWAY_REDIRECT',
    'SUCCESS',
    { checkoutSessionId: session.id, gatewayReference: session.gatewayReference, gateway: body.paymentMethod },
    { req, userId }
  );

  return {
    flow: 'ONLINE',
    checkoutSessionId: session.id,
    status: session.status,
    amount: session.total,
    gatewayName: session.gatewayName,
    gatewayReference: session.gatewayReference,
    expiresAt: session.expiresAt,
    priceLockedAt: session.priceLockedAt,
    priceLockedUntil: session.priceLockedUntil,
    gatewayRedirect,
    callbackUrl: `/api/payments/callback/${body.paymentMethod.toLowerCase()}`,
  };
}

export async function completeCheckoutSession(
  sessionIdOrReference: string,
  io: SocketServer,
  gatewayData: {
    gatewayName?: string;
    gatewayTransactionId?: string;
    gatewayReference?: string;
    gatewayPayload?: unknown;
    gatewayResponse?: unknown;
  } = {},
  req?: AuditRequest,
  userId?: string
) {
  await expireCheckoutSessions();

  const session = await prisma.checkoutSession.findFirst({
    where: {
      OR: [{ id: sessionIdOrReference }, { gatewayReference: sessionIdOrReference }],
    },
    include: { customer: true },
  });

  if (!session) {
    const err = new Error('Checkout session not found.');
    (err as any).status = 404;
    throw err;
  }

  if (userId && session.customerId !== userId) {
    const err = new Error('Unauthorized checkout session.');
    (err as any).status = 403;
    throw err;
  }

  await assertSessionPayable(session);

  if (session.status === 'COMPLETED' && session.orderId) {
    await logAudit('GATEWAY_CALLBACK', 'DUPLICATE', { checkoutSessionId: session.id, orderId: session.orderId }, { req, userId });
    return { processed: false, orderId: session.orderId, message: 'Payment already completed.' };
  }

  if (session.status === 'EXPIRED' || session.expiresAt < new Date()) {
    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
    await releaseInventoryForSession(session.id);
    await logAudit('CHECKOUT_EXPIRED', 'SUCCESS', { checkoutSessionId: session.id }, { req, userId });
    const err = new Error('Payment session expired. Please retry checkout.');
    (err as any).status = 409;
    throw err;
  }

  if (session.priceLockedUntil && session.priceLockedUntil < new Date()) {
    await releaseInventoryForSession(session.id);
    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
    await logAudit('CHECKOUT_EXPIRED', 'SUCCESS', {
      checkoutSessionId: session.id,
      reason: 'price_lock_expired',
    }, { req, userId });
    const err = new Error('Price lock expired. Please start checkout again to get current prices.');
    (err as any).status = 409;
    throw err;
  }

  if (session.status !== 'PENDING') {
    const err = new Error(`Payment session is ${session.status}.`);
    (err as any).status = 409;
    throw err;
  }

  const draft = {
    addressId: session.addressId,
    addressPayload: session.addressPayload as Prisma.InputJsonValue | undefined,
    orderPayload: session.orderPayload as any,
    itemsPayload: session.itemsPayload as any[],
    subtotal: parseFloat(session.subtotal.toString()),
    deliveryCharge: parseFloat(session.deliveryCharge.toString()),
    discountAmount: parseFloat(session.discountAmount.toString()),
    total: parseFloat(session.total.toString()),
    distanceKm: session.distanceKm,
    deliveryType: session.deliveryType,
    usedInlineItems: true,
  };

  const gatewayPayload = gatewayData.gatewayPayload ? JSON.stringify(gatewayData.gatewayPayload) : null;
  const gatewayResponse = gatewayData.gatewayResponse ? JSON.stringify(gatewayData.gatewayResponse) : gatewayPayload;
  const gatewayReference = gatewayData.gatewayReference || session.gatewayReference;

  const result = await prisma.$transaction(async (tx) => {
    const lockedSession = await tx.checkoutSession.findUnique({ where: { id: session.id } });
    if (!lockedSession || lockedSession.status !== 'PENDING') return null;

    const invoiceNumber = await generateDailyInvoiceNumber(tx);

    const created = await createOrderAndPayment(tx, session.customerId, session.paymentMethod, draft, {
      status: 'COMPLETED',
      gatewayName: gatewayData.gatewayName || session.gatewayName,
      gatewayTransactionId: gatewayData.gatewayTransactionId || null,
      gatewayReference,
      gatewayPayload,
      gatewayResponse,
      verified: true,
      paidAt: new Date(),
      paidAmount: parseFloat(session.total.toString()),
      invoiceNumber,
    });

    await confirmInventoryForSession(tx, session.id);

    await tx.checkoutSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        orderId: created.id,
        gatewayTransactionId: gatewayData.gatewayTransactionId || null,
        gatewayPayload,
      },
    });

    await tx.cartItem.deleteMany({ where: { userId: session.customerId } });
    return { order: created, invoiceNumber };
  });

  if (!result) {
    const refreshed = await prisma.checkoutSession.findUnique({ where: { id: session.id } });
    await logAudit('GATEWAY_CALLBACK', 'DUPLICATE', { checkoutSessionId: session.id }, { req, userId });
    return { processed: false, orderId: refreshed?.orderId || null, message: 'Payment already processed.' };
  }

  const { order, invoiceNumber } = result;

  await logAudit('GATEWAY_CALLBACK', 'SUCCESS', { checkoutSessionId: session.id, orderId: order.id }, { req, userId });
  await logAudit('PAYMENT_VERIFIED', 'SUCCESS', { checkoutSessionId: session.id, orderId: order.id }, { req, userId });

  io?.to('admin').emit('payment:success', {
    orderId: order.id,
    method: session.paymentMethod,
    amount: parseFloat(session.total.toString()),
    transactionRef: gatewayReference,
    timestamp: new Date(),
  });
  emitOrderNew(io, order, session.customer, (session.itemsPayload as any[]).length);
  await notifyAdminsNewOrder(order, session.customer.name);
  io?.to(`user:${session.customerId}`).emit('payment:updated', {
    orderId: order.id,
    paymentStatus: 'COMPLETED',
    updatedAt: new Date(),
  });

  return { processed: true, orderId: order.id, order, invoiceNumber };
}

export async function failCheckoutSession(sessionIdOrReference: string, reason?: string, req?: AuditRequest) {
  const session = await prisma.checkoutSession.findFirst({
    where: {
      OR: [{ id: sessionIdOrReference }, { gatewayReference: sessionIdOrReference }],
      status: 'PENDING',
    },
  });
  if (!session) return;
  await recordFailedPaymentAttempt(session.id);
  await prisma.checkoutSession.updateMany({
    where: { id: session.id, status: 'PENDING' },
    data: {
      gatewayPayload: reason ? JSON.stringify({ reason }) : undefined,
    },
  });
  await logAudit('GATEWAY_CALLBACK', 'FAILED', { checkoutSessionId: session.id, reason }, { req });
}

export async function createCodOrderFromLegacyRoute(req: AuthenticatedRequest, io: SocketServer) {
  const body = req.body as CheckoutBody;
  if (isOnlinePaymentMethod(body.paymentMethod)) {
    const err = new Error('Online payments must use /api/checkout so the order is created only after payment succeeds.');
    (err as any).status = 400;
    throw err;
  }
  const result = await createCheckout(body, req.user!.id, io, req);
  return result.order;
}
