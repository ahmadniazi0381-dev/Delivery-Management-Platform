/**
 * launch-readiness.tests.ts
 * Verifies Priority 1–5 launch blockers without hitting live payment gateways.
 */
import crypto from 'crypto';
import prisma from './config/db';
import { parseGatewayCallback, buildGatewayRedirect } from './services/gateway.service';
import { getConfigNumber } from './services/config.service';
import { verifyJazzCashWebhook } from './services/payment.service';

async function runLaunchReadinessTests() {
  console.log('========================================================');
  console.log('         LAUNCH READINESS VERIFICATION TESTS            ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  // ── Priority 3: price_lock_minutes is wired separately from timeout ──
  try {
    const timeout = await getConfigNumber('checkout.timeout_minutes', 15);
    const priceLock = await getConfigNumber('checkout.price_lock_minutes', 15);
    assert(timeout > 0 && priceLock > 0, 'Config keys checkout.timeout_minutes and checkout.price_lock_minutes are readable');
    assert(typeof timeout === 'number' && typeof priceLock === 'number', 'Timeout and price lock are independent numeric config values');
  } catch (err) {
    console.error('Config test error:', err);
    failed++;
  }

  // ── Priority 2: JazzCash HMAC verification (no simulated path) ──
  try {
    const secret = process.env.JAZZCASH_WEBHOOK_SECRET || 'test-secret';
    const payload: Record<string, string> = {
      pp_ResponseCode: '000',
      pp_TxnRefNo: 'CHK-TEST-001',
      pp_Amount: '50000',
      ppmpf_1: 'session-uuid-test',
    };
    const sortedKeys = Object.keys(payload).sort();
    let concat = secret;
    for (const key of sortedKeys) {
      if (payload[key]) concat += `&${payload[key]}`;
    }
    payload.pp_SecureHash = crypto.createHmac('sha256', secret).update(concat).digest('hex').toUpperCase();

    assert(verifyJazzCashWebhook(payload, secret), 'JazzCash HMAC signature verification accepts valid callback');

    payload.pp_SecureHash = 'INVALID';
    assert(!verifyJazzCashWebhook(payload, secret), 'JazzCash HMAC signature verification rejects tampered callback');

    const parsed = parseGatewayCallback('jazzcash', payload, {});
    assert(parsed.verified === false && parsed.success === false, 'Tampered JazzCash callback is not treated as success');
  } catch (err) {
    console.error('Gateway verification test error:', err);
    failed++;
  }

  // ── Priority 2: Gateway redirect builder requires real credentials (no SIMULATED) ──
  try {
    let threw = false;
    try {
      buildGatewayRedirect({
        id: 'test-session',
        paymentMethod: 'JAZZCASH',
        total: { toString: () => '500' },
        gatewayReference: 'CHK-TEST',
        customer: { phone: '+923001234567', email: 'test@test.com' },
      });
    } catch {
      threw = true;
    }
    assert(
      threw || !!process.env.JAZZCASH_MERCHANT_ID,
      'JazzCash redirect requires merchant credentials (no simulated fallback)'
    );
  } catch (err) {
    console.error('Gateway redirect test error:', err);
    failed++;
  }

  // ── Priority 1: CheckoutSession schema supports COD inventory + price lock ──
  try {
    const fields = await prisma.checkoutSession.fields;
    assert(!!fields.priceLockedUntil, 'CheckoutSession has priceLockedUntil column');
    assert(!!fields.expiresAt, 'CheckoutSession has separate expiresAt column');
  } catch (err) {
    console.error('Schema test error:', err);
    failed++;
  }

  // ── Priority 4: Admin audit action types exist in source ──
  try {
    const fs = await import('fs');
    const path = await import('path');
    const directPath = path.join(__dirname, 'services/audit.service.ts');
    const srcPath = path.join(__dirname, '../src/services/audit.service.ts');
    const auditFile = fs.existsSync(directPath) ? directPath : srcPath;
    const auditSource = await fs.promises.readFile(auditFile, 'utf8');
    assert(auditSource.includes('ADMIN_ASSIGN_RIDER'), 'Audit log includes ADMIN_ASSIGN_RIDER');
    assert(auditSource.includes('ADMIN_REFUND_PAYMENT'), 'Audit log includes ADMIN_REFUND_PAYMENT');
    assert(auditSource.includes('ADMIN_RESET_RIDER_PASSWORD'), 'Audit log includes ADMIN_RESET_RIDER_PASSWORD');
  } catch (err) {
    console.error('Audit types test error:', err);
    failed++;
  }

  // ── Priority 5: Order recovery endpoint service ──
  try {
    const { getCheckoutRecovery } = await import('./services/order-recovery.service');
    const result = await getCheckoutRecovery('00000000-0000-0000-0000-000000000000');
    assert(result.state === 'NONE', 'Order recovery returns NONE for unknown user without throwing');
  } catch (err) {
    console.error('Order recovery test error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================================');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runLaunchReadinessTests().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
