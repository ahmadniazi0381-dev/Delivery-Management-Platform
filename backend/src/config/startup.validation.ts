/**
 * Validates required environment variables before the server accepts traffic.
 * Missing payment webhook secrets must fail startup — never accept unsigned webhooks.
 */

const REQUIRED_WEBHOOK_SECRETS = [
  'JAZZCASH_WEBHOOK_SECRET',
  'EASYPAISA_WEBHOOK_SECRET',
  'SAFEPAY_WEBHOOK_SECRET',
] as const;

const REQUIRED_ALWAYS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

function isDevelopmentOtpModeEnabled(): boolean {
  const value = process.env.OTP_DEV_MODE?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

function hasPlaceholderValue(value?: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;

  return [
    /\[PASSWORD\]/i,
    /REPLACE_WITH_/i,
    /YOUR_[A-Z_]+/i,
    /CHANGE_ME/i,
    /PLACEHOLDER/i,
    /example\.com/i,
    /your_[a-z0-9_]+/i,
  ].some((pattern) => pattern.test(trimmed));
}

export function validateStartupEnvironment(): void {
  const missingCritical: string[] = [];
  const placeholderCritical: string[] = [];
  const missingOptional: string[] = [];

  for (const key of ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET']) {
    const value = process.env[key];
    if (!value?.trim()) {
      missingCritical.push(key);
      continue;
    }
    if (hasPlaceholderValue(value)) {
      placeholderCritical.push(key);
    }
  }

  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JAZZCASH_WEBHOOK_SECRET', 'EASYPAISA_WEBHOOK_SECRET', 'SAFEPAY_WEBHOOK_SECRET']) {
    if (!process.env[key]?.trim()) missingOptional.push(key);
  }

  if (missingOptional.length > 0) {
    console.warn('[STARTUP WARNING] Missing external service secrets:');
    missingOptional.forEach((key) => console.warn(`  ⚠️  ${key}`));
    console.warn('[STARTUP WARNING] Related features will operate with fallbacks.');
  }

  const otpDevMode = isDevelopmentOtpModeEnabled();
  const twilioConfigPresent = !!process.env.TWILIO_ACCOUNT_SID?.trim() && !!process.env.TWILIO_AUTH_TOKEN?.trim() && !!process.env.TWILIO_PHONE_NUMBER?.trim();

  if (otpDevMode) {
    console.log('[STARTUP CHECK] Development OTP mode enabled. Real Twilio credentials are not required for local testing.');
  } else if (!twilioConfigPresent && process.env.NODE_ENV === 'production') {
    console.error('[STARTUP ERROR] Production requires real Twilio credentials or OTP_DEV_MODE=true.');
    process.exit(1);
  }

  if (placeholderCritical.length > 0 || missingCritical.length > 0) {
    console.error('========================================================');
    console.error('[STARTUP ERROR] Invalid or placeholder CRITICAL environment values:');
    if (missingCritical.length > 0) {
      missingCritical.forEach((key) => console.error(`  ❌ ${key} is missing`));
    }
    if (placeholderCritical.length > 0) {
      placeholderCritical.forEach((key) => console.error(`  ⚠️  ${key} contains placeholder values`));
    }
    console.error('[STARTUP ERROR] Replace the values with real secrets before production deployment.');
    console.error('========================================================');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('[STARTUP CHECK] Environment validation completed successfully.');
  }
}

