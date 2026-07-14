import crypto from 'crypto';
import { PaymentMethod } from '@prisma/client';
import {
  verifyEasypaisaWebhook,
  verifyJazzCashWebhook,
  verifySafepayWebhook,
} from './payment.service';

export type GatewayRedirect = {
  method: 'GET' | 'POST';
  url: string;
  fields: Record<string, string>;
};

export type GatewayCallbackResult = {
  verified: boolean;
  success: boolean;
  sessionReference: string;
  gatewayTransactionId?: string;
  gatewayReference?: string;
  responseCode?: string;
  message?: string;
};

function apiBaseUrl(): string {
  return (process.env.PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
}

function callbackUrl(gateway: string): string {
  return `${apiBaseUrl()}/api/payments/callback/${gateway.toLowerCase()}`;
}

function jazzCashIntegritySalt(): string {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || process.env.JAZZCASH_WEBHOOK_SECRET;
  if (!salt?.trim()) throw new Error('JAZZCASH_INTEGRITY_SALT is required for JazzCash payments.');
  return salt;
}

function jazzCashSecureHash(fields: Record<string, string>): string {
  const salt = jazzCashIntegritySalt();
  const sortedKeys = Object.keys(fields)
    .filter((k) => k !== 'pp_SecureHash' && fields[k] !== undefined && fields[k] !== '')
    .sort();
  let concat = salt;
  for (const key of sortedKeys) {
    concat += `&${fields[key]}`;
  }
  return crypto.createHmac('sha256', salt).update(concat).digest('hex').toUpperCase();
}

function easypaisaHash(fields: Record<string, string>): string {
  const key = process.env.EASYPAISA_HASH_KEY || process.env.EASYPAISA_WEBHOOK_SECRET;
  if (!key?.trim()) throw new Error('EASYPAISA_HASH_KEY is required for EasyPaisa payments.');
  const sortedKeys = Object.keys(fields)
    .filter((k) => k !== 'hash' && fields[k] !== undefined && fields[k] !== '')
    .sort();
  const concat = sortedKeys.map((k) => `${k}=${fields[k]}`).join('&');
  return crypto.createHmac('sha256', key).update(concat).digest('base64');
}

function amountInMinorUnits(total: number): string {
  return Math.round(total * 100).toString();
}

function formatTxnDateTime(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

export function buildGatewayRedirect(session: {
  id: string;
  paymentMethod: PaymentMethod;
  total: { toString(): string };
  gatewayReference: string;
  customer?: { phone?: string | null; email?: string | null };
}): GatewayRedirect {
  const amountPkr = parseFloat(session.total.toString());
  const txnRef = session.gatewayReference;
  const billRef = session.id.replace(/-/g, '').slice(0, 20);

  if (session.paymentMethod === 'JAZZCASH') {
    const merchantId = process.env.JAZZCASH_MERCHANT_ID;
    const password = process.env.JAZZCASH_PASSWORD;
    if (!merchantId || !password) {
      throw new Error('JAZZCASH_MERCHANT_ID and JAZZCASH_PASSWORD are required.');
    }
    const jazzCashUrl =
      process.env.JAZZCASH_PAYMENT_URL ||
      'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';

    const fields: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: merchantId,
      pp_SubMerchantID: '',
      pp_Password: password,
      pp_BankID: 'TBANK',
      pp_ProductID: 'RETL',
      pp_TxnRefNo: txnRef,
      pp_Amount: amountInMinorUnits(amountPkr),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: formatTxnDateTime(),
      pp_BillReference: billRef,
      pp_Description: `Order ${session.id.slice(0, 8)}`,
      pp_TxnExpiryDateTime: formatTxnDateTime(new Date(Date.now() + 60 * 60 * 1000)),
      pp_ReturnURL: callbackUrl('jazzcash'),
      pp_SecureHash: '',
      ppmpf_1: session.id,
      ppmpf_2: session.customer?.phone || '',
      ppmpf_3: session.customer?.email || '',
      ppmpf_4: '',
      ppmpf_5: '',
    };
    fields.pp_SecureHash = jazzCashSecureHash(fields);

    return { method: 'POST', url: jazzCashUrl, fields };
  }

  if (session.paymentMethod === 'EASYPAISA') {
    const storeId = process.env.EASYPAISA_STORE_ID;
    if (!storeId) throw new Error('EASYPAISA_STORE_ID is required.');
    const easypaisaUrl =
      process.env.EASYPAISA_PAYMENT_URL || 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';

    const fields: Record<string, string> = {
      storeId,
      amount: amountPkr.toFixed(2),
      postBackURL: callbackUrl('easypaisa'),
      orderRefNum: txnRef,
      expiryDate: formatTxnDateTime(new Date(Date.now() + 60 * 60 * 1000)),
      merchantHashedReq: '',
      autoRedirect: '1',
      paymentMethod: 'MA',
      emailAddr: session.customer?.email || 'customer@naseeb.local',
      mobileNum: (session.customer?.phone || '').replace(/\D/g, '').slice(-11) || '03000000000',
      checkoutSessionId: session.id,
    };
    fields.merchantHashedReq = easypaisaHash(fields);

    return { method: 'POST', url: easypaisaUrl, fields };
  }

  if (session.paymentMethod === 'CARD') {
    const safepayUrl = process.env.SAFEPAY_CHECKOUT_URL;
    const apiKey = process.env.SAFEPAY_API_KEY;
    if (!safepayUrl || !apiKey) {
      throw new Error('SAFEPAY_CHECKOUT_URL and SAFEPAY_API_KEY are required for card payments.');
    }

    const fields: Record<string, string> = {
      api_key: apiKey,
      amount: amountPkr.toFixed(2),
      currency: 'PKR',
      order_id: txnRef,
      checkoutSessionId: session.id,
      return_url: callbackUrl('card'),
      cancel_url: `${apiBaseUrl()}/checkout/cancelled?sessionId=${session.id}`,
    };

    return { method: 'POST', url: safepayUrl, fields };
  }

  throw new Error(`Unsupported online payment method: ${session.paymentMethod}`);
}

function normalizePayload(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) {
      out[key] = String(value);
    }
  }
  return out;
}

export function parseGatewayCallback(
  gateway: string,
  payload: Record<string, unknown>,
  headers: Record<string, string | string[] | undefined> = {}
): GatewayCallbackResult {
  const normalized = normalizePayload(payload);
  const gw = gateway.toLowerCase();

  if (gw === 'jazzcash') {
    const verified = verifyJazzCashWebhook(normalized, process.env.JAZZCASH_WEBHOOK_SECRET || jazzCashIntegritySalt());
    const sessionReference =
      normalized.ppmpf_1 || normalized.checkoutSessionId || normalized.pp_BillReference || normalized.pp_TxnRefNo;
    const success = verified && normalized.pp_ResponseCode === '000';
    return {
      verified,
      success,
      sessionReference,
      gatewayTransactionId: normalized.pp_TxnRefNo,
      gatewayReference: normalized.pp_TxnRefNo,
      responseCode: normalized.pp_ResponseCode,
      message: normalized.pp_ResponseMessage,
    };
  }

  if (gw === 'easypaisa') {
    const verified = verifyEasypaisaWebhook(normalized, process.env.EASYPAISA_WEBHOOK_SECRET || process.env.EASYPAISA_HASH_KEY);
    const sessionReference =
      normalized.checkoutSessionId || normalized.orderRefNum || normalized.transactionRef;
    const success =
      verified &&
      (normalized.responseCode === '000' ||
        normalized.status === 'PAID' ||
        normalized.status === 'COMPLETED' ||
        normalized.responseCode === '0000');
    return {
      verified,
      success,
      sessionReference,
      gatewayTransactionId: normalized.transactionId || normalized.orderRefNum,
      gatewayReference: normalized.orderRefNum,
      responseCode: normalized.responseCode || normalized.status,
      message: normalized.responseDesc || normalized.message,
    };
  }

  if (gw === 'card' || gw === 'safepay') {
    const signature = (headers['x-sfpy-signature'] || headers['x-safepay-signature']) as string | undefined;
    const verified = verifySafepayWebhook(normalized, signature, process.env.SAFEPAY_WEBHOOK_SECRET);
    const sessionReference =
      normalized.checkoutSessionId || normalized.order_id || normalized.gatewayReference;
    const success =
      verified &&
      (normalized.status === 'COMPLETED' ||
        normalized.status === 'paid' ||
        normalized.payment_status === 'COMPLETED');
    return {
      verified,
      success,
      sessionReference,
      gatewayTransactionId: normalized.transaction_id || normalized.id,
      gatewayReference: normalized.order_id,
      responseCode: normalized.status || normalized.payment_status,
      message: normalized.message,
    };
  }

  return {
    verified: false,
    success: false,
    sessionReference: normalized.checkoutSessionId || normalized.sessionId || '',
    message: 'Unknown gateway',
  };
}
