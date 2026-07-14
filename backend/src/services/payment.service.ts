import crypto from 'crypto';

function missingSecretError(provider: string): never {
  throw new Error(`${provider}_WEBHOOK_SECRET is required. Server cannot verify webhooks without it.`);
}

export function verifyJazzCashWebhook(payload: any, secret: string | undefined): boolean {
  if (!secret?.trim()) missingSecretError('JAZZCASH');

  try {
    const secureHash = payload.pp_SecureHash;
    if (!secureHash) return false;

    const cleanPayload = { ...payload };
    delete cleanPayload.pp_SecureHash;

    const sortedKeys = Object.keys(cleanPayload).sort();
    let concatString = secret;
    for (const key of sortedKeys) {
      if (cleanPayload[key] !== undefined && cleanPayload[key] !== '') {
        concatString += `&${cleanPayload[key]}`;
      }
    }

    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(concatString)
      .digest('hex')
      .toUpperCase();

    return calculatedHash === secureHash.toUpperCase();
  } catch (error) {
    console.error('JazzCash verification failed:', error);
    return false;
  }
}

export function verifyEasypaisaWebhook(payload: any, secret: string | undefined): boolean {
  if (!secret?.trim()) missingSecretError('EASYPAISA');

  try {
    const signature = payload.signature;
    if (!signature) return false;

    const cleanPayload = { ...payload };
    delete cleanPayload.signature;

    const sortedKeys = Object.keys(cleanPayload).sort();
    const concatString = sortedKeys.map((k) => `${k}=${cleanPayload[k]}`).join('&');

    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(concatString)
      .digest('base64');

    return calculatedSignature === signature;
  } catch (error) {
    console.error('Easypaisa verification failed:', error);
    return false;
  }
}

export function verifySafepayWebhook(payload: any, signature: string | undefined, secret: string | undefined): boolean {
  if (!secret?.trim()) missingSecretError('SAFEPAY');
  if (!signature) return false;

  try {
    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return calculatedSignature === signature;
  } catch (error) {
    console.error('Safepay verification failed:', error);
    return false;
  }
}

export function verifyWebhookForGateway(
  gateway: string | undefined,
  payload: any,
  headers: Record<string, string | string[] | undefined>
): boolean {
  const normalized = (gateway || '').toLowerCase();
  if (normalized === 'jazzcash') {
    return verifyJazzCashWebhook(payload, process.env.JAZZCASH_WEBHOOK_SECRET);
  }
  if (normalized === 'easypaisa') {
    return verifyEasypaisaWebhook(payload, process.env.EASYPAISA_WEBHOOK_SECRET);
  }
  if (normalized === 'safepay' || normalized === 'card') {
    const signature = (headers['x-sfpy-signature'] || headers['x-safepay-signature']) as string | undefined;
    return verifySafepayWebhook(payload, signature, process.env.SAFEPAY_WEBHOOK_SECRET);
  }
  return false;
}
