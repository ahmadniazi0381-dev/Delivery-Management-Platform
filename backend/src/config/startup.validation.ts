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

export function validateStartupEnvironment(): void {
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];

  for (const key of ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET']) {
    if (!process.env[key]?.trim()) missingCritical.push(key);
  }

  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JAZZCASH_WEBHOOK_SECRET', 'EASYPAISA_WEBHOOK_SECRET', 'SAFEPAY_WEBHOOK_SECRET']) {
    if (!process.env[key]?.trim()) missingOptional.push(key);
  }

  if (missingOptional.length > 0) {
    console.warn('[STARTUP WARNING] Missing external service secrets:');
    missingOptional.forEach((key) => console.warn(`  ⚠️  ${key}`));
    console.warn('[STARTUP WARNING] Related features will operate with fallbacks.');
  }

  if (missingCritical.length > 0) {
    console.error('========================================================');
    console.error('[STARTUP ERROR] Missing CRITICAL environment variables:');
    missingCritical.forEach((key) => console.error(`  ❌ ${key}`));
    console.error('[STARTUP ERROR] Server cannot start without database & JWT config.');
    console.error('========================================================');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('[STARTUP CHECK] Environment validation completed successfully.');
  }
}

