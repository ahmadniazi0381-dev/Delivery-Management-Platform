/**
 * validation.schemas.ts
 * ─────────────────────
 * ponytail: one file, all Zod schemas. Reject on mismatch — no sanitise-and-hope.
 * Zod is already in package.json; no new dep needed.
 */
import { z } from 'zod';

// ── Primitives ─────────────────────────────────────────────────────────────

export function normalizePhone(raw: string): string {
  // Strip all non-digit characters except '+'
  let compact = raw.replace(/[^\d+]/g, '');
  
  if (compact.startsWith('0092')) {
    compact = '+' + compact.slice(4);
  }
  if (compact.startsWith('92') && compact.length === 12) {
    compact = '+' + compact;
  }
  if (compact.startsWith('03') && compact.length === 11) {
    compact = '+92' + compact.slice(1);
  }
  if (compact.startsWith('3') && compact.length === 10) {
    compact = '+92' + compact;
  }
  return compact;
}

const phone = z
  .string()
  .transform(normalizePhone)
  .pipe(
    z
      .string()
      .min(10, 'Phone number too short.')
      .max(16, 'Phone number too long.')
      .regex(/^\+[0-9]{10,15}$/, 'Invalid phone number format.')
  );

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password too long.');

const name = z.string().min(2, 'Name too short.').max(80, 'Name too long.').trim();

const email = z.string().email('Invalid email address.').max(255).optional();

const uuid = z.string().uuid('Invalid ID format.');

// ── Auth ────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name,
  phone,
  password,
  email,
});

// Login accepts phone OR email (dev accounts use email)
export const LoginSchema = z.object({
  phone:    phone.optional(),
  email:    z.string().email().optional(),
  password: z.string().min(1, 'Password is required.').max(128),
}).refine((d) => d.phone || d.email, { message: 'Phone or email is required.' });


export const GoogleLoginSchema = z.object({
  token:  z.string().max(4096).optional(), // Google ID token, validated server-side
  email:  z.string().email().max(255),
  name:   name,
  phone:  phone.optional(),
});

export const OtpVerifySchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits.').regex(/^\d{6}$/, 'OTP must be numeric.'),
});

export const ForgotPasswordSchema = z.object({
  phone,
});

export const ResetPasswordSchema = z.object({
  phone,
  code: z.string().length(6, 'OTP must be 6 digits.').regex(/^\d{6}$/, 'OTP must be numeric.'),
  newPassword: password,
});

// ── Address ─────────────────────────────────────────────────────────────────

export const AddressSchema = z.object({
  label:        z.string().min(1).max(40).trim(),
  addressLine:  z.string().min(5, 'Address too short.').max(300).trim(),
  latitude:     z.number().min(-90).max(90),
  longitude:    z.number().min(-180).max(180),
  apartment:    z.string().max(100).trim().optional().or(z.literal('')),
  floor:        z.string().max(50).trim().optional().or(z.literal('')),
  landmark:     z.string().max(200).trim().optional().or(z.literal('')),
  deliveryNote: z.string().max(500).trim().optional().or(z.literal('')),
  placeId:      z.string().max(200).trim().optional().or(z.literal('')),
  postalCode:   z.string().max(50).trim().optional().or(z.literal('')),
  city:         z.string().max(100).trim().optional().or(z.literal('')),
  province:     z.string().max(100).trim().optional().or(z.literal('')),
  country:      z.string().max(100).trim().optional().or(z.literal('')),
  isDefault:    z.boolean().optional(),
});

// Partial schema for PUT updates
export const UpdateAddressSchema = AddressSchema.partial();


// ── Cart ────────────────────────────────────────────────────────────────────

export const CartAddSchema = z.object({
  menuItemId: uuid,
  quantity:   z.number().int().min(1).max(50),
});

export const CartUpdateSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

// ── Order ───────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = ['COD', 'JAZZCASH', 'EASYPAISA', 'CARD'] as const;

export const PlaceOrderSchema = z.object({
  addressId:            uuid.optional(),
  latitude:             z.number().min(-90).max(90).optional(),
  longitude:            z.number().min(-180).max(180).optional(),
  addressLine:          z.string().min(5).max(300).optional(),
  paymentMethod:        z.enum(PAYMENT_METHODS),
  deliveryType:         z.enum(['STANDARD', 'PRIORITY']).optional(),
  promoCode:            z.string().max(40).trim().optional(),
  specialInstructions:  z.string().max(500).trim().optional(),
  recipientName:        z.string().max(80).trim().optional().or(z.literal('')),
  recipientPhone:       z.string().optional().transform((v) => (v ? normalizePhone(v) : undefined)).refine((v) => !v || /^\+[0-9]{10,15}$/.test(v), { message: 'Invalid recipient phone format.' }).optional().or(z.literal('')),
  recipientRelationship: z.string().max(50).trim().optional().or(z.literal('')),
  // Mobile app sends items inline (local cart); web uses backend cart
  items: z
    .array(
      z.object({
        menuItemId: uuid,
        quantity:   z.number().int().min(1).max(50),
      })
    )
    .optional(),
});

export const CheckoutSchema = PlaceOrderSchema;

// ── Payment ─────────────────────────────────────────────────────────────────

export const InitiatePaymentSchema = z.object({
  orderId:        uuid,
  method:         z.enum(PAYMENT_METHODS),
  transactionRef: z.string().max(200).trim().optional(),
});

// ── Owner — Category ────────────────────────────────────────────────────────

export const CategorySchema = z.object({
  name:        z.string().min(1).max(80).trim(),
  description: z.string().max(500).trim().optional(),
  imageUrl:    z.string().url().max(1000).optional().or(z.literal('')),
  isActive:    z.boolean().optional(),
  sortOrder:   z.number().int().min(0).max(9999).optional(),
});

// ── Owner — Menu Item ───────────────────────────────────────────────────────

export const MenuItemSchema = z.object({
  categoryId:      uuid,
  name:            z.string().min(1).max(120).trim(),
  description:     z.string().max(1000).trim().optional(),
  price:           z.number().positive().max(99999),
  imageUrl:        z.string().url().max(1000).optional().or(z.literal('')),
  isAvailable:     z.boolean().optional(),
  inStock:         z.boolean().optional(),
  isFeatured:      z.boolean().optional(),
  isSpicy:         z.boolean().optional(),
  preparationTime: z.number().int().min(1).max(240).optional(),
  sortOrder:       z.number().int().min(0).max(9999).optional(),
});

// ── Owner — Discount ────────────────────────────────────────────────────────

export const DiscountSchema = z.object({
  title:     z.string().min(1).max(120).trim(),
  type:      z.enum(['PERCENT', 'FLAT']),
  value:     z.number().positive().max(100000),
  scope:     z.enum(['ITEM', 'CATEGORY', 'ORDER']),
  promoCode: z.string().min(2).max(40).trim().toUpperCase().optional(),
  startDate: z.string().datetime(),
  endDate:   z.string().datetime(),
  isActive:  z.boolean().optional(),
});

// ── Owner — Order status update ─────────────────────────────────────────────

const ORDER_STATUSES = [
  'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'
] as const;

export const OrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const AssignRiderSchema = z.object({
  riderId: z.string().uuid('Invalid rider ID.'),
});

export const RefundPaymentSchema = z.object({
  reason: z.string().max(500).trim().optional(),
  amount: z.coerce.number().positive().optional(),
});

export const ResetRiderPasswordSchema = z.object({
  newPassword: password,
});

// ── Owner — Delivery / Shop settings ───────────────────────────────────────

export const DeliverySettingSchema = z.object({
  shopLatitude:       z.number().min(-90).max(90),
  shopLongitude:      z.number().min(-180).max(180),
  maxDeliveryKm:      z.number().positive().max(50),
  baseDeliveryCharge: z.number().min(0).max(99999),
  perKmCharge:        z.number().min(0).max(9999),
  minOrderAmount:     z.number().min(0).max(99999),
  standardEnabled:    z.boolean().optional(),
  standardFee:        z.number().min(0).optional(),
  standardEta:        z.string().min(1).optional(),
  priorityEnabled:    z.boolean().optional(),
  priorityFee:        z.number().min(0).optional(),
  priorityEta:        z.string().min(1).optional(),
  maxPriorityOrders:  z.number().int().min(0).optional(),
});

export const ShopSettingSchema = z.object({
  shopName:                z.string().min(1).max(120).trim().optional(),
  contactNumber:           phone.optional(),
  openingTime:             z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closingTime:             z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isAcceptingOrders:       z.boolean().optional(),
  address:                 z.string().max(300).trim().optional(),
  taxRate:                 z.number().min(0).max(100).optional(),
  facebookUrl:             z.string().url().max(500).optional().or(z.literal('')),
  instagramUrl:            z.string().url().max(500).optional().or(z.literal('')),
  whatsappNumber:          phone.optional(),
  estimatedDeliveryMinutes:z.number().int().min(1).max(300).optional(),
  logoUrl:                 z.string().url().max(1000).optional().or(z.literal('')),
});

// ── Review ──────────────────────────────────────────────────────────────────

export const ReviewSchema = z.object({
  orderId: uuid,
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional(),
});

// ── Change Password ──────────────────────────────────────────────────────────
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: password,
});

// ── Rider CRUD Management ───────────────────────────────────────────────────
export const RiderCreateSchema = z.object({
  name: name,
  phone: phone,
  email: z.string().email('Invalid email address.').max(255).trim().toLowerCase().optional().or(z.literal('')),
  password: password,
  cnicNumber: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in 12345-1234567-1 format.').or(z.string().length(13)),
  dateOfBirth: z.string().pipe(z.coerce.date()),
  gender: z.string().min(1).max(20).trim(),
  houseNumber: z.string().min(1).max(50).trim(),
  street: z.string().min(1).max(100).trim(),
  area: z.string().min(1).max(100).trim(),
  city: z.string().min(1).max(50).trim(),
  province: z.string().min(1).max(50).trim(),
  postalCode: z.string().min(1).max(20).trim(),
  fullAddress: z.string().min(5).max(300).trim(),
  emergencyContactName: z.string().min(2).max(80).trim(),
  emergencyContactPhone: phone,
  vehicleType: z.string().min(1).max(50).trim(),
  vehicleNumber: z.string().min(1).max(30).trim(),
  drivingLicenseNumber: z.string().max(50).trim().optional().or(z.literal('')),
  profilePhotoUrl: z.string().max(1000).optional().or(z.literal('')),
  cnicFrontUrl: z.string().max(1000).optional().or(z.literal('')),
  cnicBackUrl: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'OFFLINE', 'ONLINE']).optional(),
});

export const RiderUpdateSchema = RiderCreateSchema.partial().extend({
  password: password.optional(),
});
