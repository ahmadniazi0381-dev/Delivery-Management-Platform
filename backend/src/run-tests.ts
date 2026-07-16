/**
 * run-tests.ts
 * ────────────
 * Integrated automated test suite to run validation, auth, and order flow checks
 * directly against the service/database layer and business logic.
 */
import prisma from './config/db';
import bcrypt from 'bcrypt';
import { isWithinDeliveryRadius } from './services/distance.service';
import { RegisterSchema, LoginSchema, PlaceOrderSchema } from './middleware/validation.schemas';

async function runTests() {
  console.log('========================================================');
  console.log('         STARTING COMPREHENSIVE QA API/SCHEMA TESTS      ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── TEST 1: Phone Validation Regex & Zod schema ──
  try {
    const validPhones = [
      '+923000000000',
      '03007864177',
      '03211234567',
      '+923456789012',
      '+92300-1234567', // handles dashes now
      '0300 1234567',   // handles spaces now
      '+92 (300) 123-4567', // handles parentheses and mixed formatting
      '0300-786-4177'   // local formatted
    ];
    const invalidPhones = ['123', 'phone1234567', 'abcde', '0300-123'];

    let allValidPassed = true;
    for (const ph of validPhones) {
      const parsed = RegisterSchema.safeParse({ name: 'Ali Ahmed', phone: ph, password: 'password123' });
      if (!parsed.success) {
        allValidPassed = false;
        console.error(`Phone validation failed incorrectly for valid number: ${ph}`, parsed.error.issues);
      }
    }
    assert(allValidPassed, 'Zod Schema correctly validates standard, formatted, and international phone formats');

    const localAdminLogin = LoginSchema.safeParse({ phone: '03000000000', password: 'admin123' });
    assert(
      localAdminLogin.success && localAdminLogin.data.phone === '+923000000000',
      'LoginSchema normalizes local admin phone format before credential lookup'
    );

    const prefixedAdminLogin = LoginSchema.safeParse({ phone: '923000000000', password: 'admin123' });
    assert(
      prefixedAdminLogin.success && prefixedAdminLogin.data.phone === '+923000000000',
      'LoginSchema normalizes 92-prefixed admin phone format before credential lookup'
    );

    let allInvalidFailed = true;
    for (const ph of invalidPhones) {
      const parsed = RegisterSchema.safeParse({ name: 'Ali Ahmed', phone: ph, password: 'password123' });
      if (parsed.success) {
        allInvalidFailed = false;
        console.error(`Phone validation passed incorrectly for invalid number: ${ph}`);
      }
    }
    assert(allInvalidFailed, 'Zod Schema correctly rejects malformed or invalid phone numbers');
  } catch (err) {
    console.error('Test 1 error:', err);
    failed++;
  }

  // ── TEST 2: Password Minimum Length Schema Validation ──
  try {
    const tooShort = RegisterSchema.safeParse({ name: 'Ali Ahmed', phone: '+923001234567', password: '123' });
    const correctLen = RegisterSchema.safeParse({ name: 'Ali Ahmed', phone: '+923001234567', password: 'password123' });

    assert(!tooShort.success && tooShort.error.issues[0].message.includes('Password must be at least 8 characters'), 
      'RegisterSchema correctly enforces 8-character minimum password constraint');
    assert(correctLen.success, 'RegisterSchema passes validation for passwords >= 8 characters');
  } catch (err) {
    console.error('Test 2 error:', err);
    failed++;
  }

  // ── TEST 3: Distance calculation for location UCP UCP Branch ──
  try {
    const shopLat = 31.4475531;
    const shopLng = 74.2690347;
    // Location near UCP (approx 150m)
    const nearLat = 31.446820;
    const nearLng = 74.268310;
    // Location far away (approx 10km)
    const farLat = 31.5204;
    const farLng = 74.3587;

    const resNear = isWithinDeliveryRadius(shopLat, shopLng, nearLat, nearLng, 2.2);
    const resFar = isWithinDeliveryRadius(shopLat, shopLng, farLat, farLng, 2.2);

    assert(resNear.eligible && resNear.distance < 0.3, 'Near location checks out as eligible for delivery');
    assert(!resFar.eligible, 'Out of bounds location checks out as ineligible');
  } catch (err) {
    console.error('Test 3 error:', err);
    failed++;
  }

  // ── TEST 4: Admin Seed Account & Credentials Validation ──
  try {
    const testAdminPhone = '+923000000000';
    const rawPass = 'admin123';

    // Verify Admin user exists in DB
    const admin = await prisma.user.findFirst({ where: { phone: testAdminPhone, role: 'ADMIN' } });
    assert(!!admin, 'Default administrator account successfully seeded in PostgreSQL database');

    if (admin && admin.passwordHash) {
      const match = await bcrypt.compare(rawPass, admin.passwordHash);
      assert(match, 'Admin seeded password compares successfully using bcrypt hashing');
    } else {
      assert(false, 'Admin password hash could not be verified');
    }
  } catch (err) {
    console.error('Test 4 error:', err);
    failed++;
  }

  // ── TEST 5: PlaceOrderSchema validator with items array ──
  try {
    const validOrderPayload = {
      addressLine: 'Block D, Johar Town, Lahore',
      latitude: 31.4470,
      longitude: 74.2680,
      paymentMethod: 'COD',
      items: [
        { menuItemId: 'd5162a87-43df-40cb-98be-8f3b14647311', quantity: 2 }
      ]
    };

    const parsed = PlaceOrderSchema.safeParse(validOrderPayload);
    assert(parsed.success, 'PlaceOrderSchema accepts items array sent from mobile application (local cart)');
  } catch (err) {
    console.error('Test 5 error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: Passed ${passed} / ${passed + failed} tests`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
