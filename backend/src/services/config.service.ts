import prisma from '../config/db';

const CACHE_TTL_MS = 30_000;
let cache: Map<string, string> | null = null;
let cacheLoadedAt = 0;

export const CONFIG_KEYS = {
  CHECKOUT_TIMEOUT_MINUTES: 'checkout.timeout_minutes',
  PRICE_LOCK_DURATION_MINUTES: 'checkout.price_lock_minutes',
  PAYMENT_MAX_ATTEMPTS: 'payment.max_attempts',
  PAYMENT_BLOCK_MINUTES: 'payment.block_minutes',
  CURRENCY: 'restaurant.currency',
  TAX_PERCENTAGE: 'restaurant.tax_percentage',
  MAX_ORDER_AMOUNT: 'restaurant.max_order_amount',
  NOTIFICATION_SOUND_ENABLED: 'notifications.sound_enabled',
} as const;

const DEFAULTS: Record<string, { value: string; category: string; label: string }> = {
  [CONFIG_KEYS.CHECKOUT_TIMEOUT_MINUTES]: { value: '15', category: 'checkout', label: 'Checkout Timeout (minutes)' },
  [CONFIG_KEYS.PRICE_LOCK_DURATION_MINUTES]: { value: '15', category: 'checkout', label: 'Price Lock Duration (minutes)' },
  [CONFIG_KEYS.PAYMENT_MAX_ATTEMPTS]: { value: '5', category: 'payment', label: 'Maximum Payment Attempts' },
  [CONFIG_KEYS.PAYMENT_BLOCK_MINUTES]: { value: '10', category: 'payment', label: 'Fraud Block Duration (minutes)' },
  [CONFIG_KEYS.CURRENCY]: { value: 'PKR', category: 'restaurant', label: 'Currency' },
  [CONFIG_KEYS.TAX_PERCENTAGE]: { value: '0', category: 'restaurant', label: 'Tax Percentage' },
  [CONFIG_KEYS.MAX_ORDER_AMOUNT]: { value: '50000', category: 'restaurant', label: 'Maximum Order Amount' },
  [CONFIG_KEYS.NOTIFICATION_SOUND_ENABLED]: { value: 'true', category: 'notifications', label: 'Notification Sounds Enabled' },
};

async function refreshCache(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [key, def] of Object.entries(DEFAULTS)) {
    map.set(key, def.value);
  }
  try {
    const rows = await prisma.systemConfig.findMany();
    for (const row of rows) {
      map.set(row.key, row.value);
    }
  } catch (err: any) {
    console.warn('[CONFIG SERVICE] Database unavailable; using system defaults:', err?.message || err);
  }
  cache = map;
  cacheLoadedAt = Date.now();
  return map;
}

async function getCache(): Promise<Map<string, string>> {
  if (!cache || Date.now() - cacheLoadedAt > CACHE_TTL_MS) {
    return refreshCache();
  }
  return cache;
}

export function invalidateConfigCache(): void {
  cache = null;
  cacheLoadedAt = 0;
}

export async function getConfigString(key: string, fallback = ''): Promise<string> {
  const map = await getCache();
  return map.get(key) ?? DEFAULTS[key]?.value ?? fallback;
}

export async function getConfigNumber(key: string, fallback: number): Promise<number> {
  const raw = await getConfigString(key, String(fallback));
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getConfigBoolean(key: string, fallback: boolean): Promise<boolean> {
  const raw = (await getConfigString(key, String(fallback))).toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return fallback;
}

export async function setConfig(key: string, value: string, updatedBy?: string): Promise<void> {
  const def = DEFAULTS[key];
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value, updatedBy: updatedBy || null },
    create: {
      key,
      value,
      category: def?.category || 'general',
      label: def?.label || key,
      updatedBy: updatedBy || null,
    },
  });
  invalidateConfigCache();
}

export async function getAllConfig(category?: string) {
  await refreshCache();
  const rows = await prisma.systemConfig.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });
  const known = new Set(rows.map((r) => r.key));
  const merged = [...rows];
  for (const [key, def] of Object.entries(DEFAULTS)) {
    if (!known.has(key) && (!category || def.category === category)) {
      merged.push({
        key,
        value: def.value,
        category: def.category,
        label: def.label,
        updatedAt: new Date(),
        updatedBy: null,
      });
    }
  }
  return merged.sort((a, b) => a.category.localeCompare(b.category) || a.key.localeCompare(b.key));
}

export async function seedSystemConfig(): Promise<void> {
  for (const [key, def] of Object.entries(DEFAULTS)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: {},
      create: { key, value: def.value, category: def.category, label: def.label },
    });
  }
  invalidateConfigCache();
}
