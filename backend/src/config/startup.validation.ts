/**
 * Validates required environment variables before the server accepts traffic.
 * Missing payment webhook secrets must fail startup — never accept unsigned webhooks.
 */

const REQUIRED_WEBHOOK_SECRETS = [
  'JAZZCASH_WEBHOOK_SECRET',
  'EASYPAISA_WEBHOOK_SECRET',
  'SAFEPAY_WEBHOOK_SECRET',
] as const;

const REQUIRED_ALWAYS = ['JWT_SECRET', 'DATABASE_URL', 'DIRECT_URL'] as const;

export function validateStartupEnvironment(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ALWAYS) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  for (const key of REQUIRED_WEBHOOK_SECRETS) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  if (missing.length > 0) {
    console.error('========================================================');
    console.error('[STARTUP] Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error('[STARTUP] Server refused to start. Configure secrets before running.');
    console.error('========================================================');
    process.exit(1);
  }
}
