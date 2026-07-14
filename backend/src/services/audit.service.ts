import { Request } from 'express';
import prisma from '../config/db';

export type AuditAction =
  | 'CHECKOUT_STARTED'
  | 'CHECKOUT_EXPIRED'
  | 'PAYMENT_CREATED'
  | 'GATEWAY_REDIRECT'
  | 'GATEWAY_CALLBACK'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_FAILED'
  | 'ORDER_CREATED'
  | 'INVOICE_GENERATED'
  | 'NOTIFICATION_SENT'
  | 'ADMIN_LOGIN'
  | 'CUSTOMER_LOGIN'
  | 'RIDER_LOGIN'
  | 'PASSWORD_RESET'
  | 'INVENTORY_RESERVED'
  | 'INVENTORY_RELEASED'
  | 'INVENTORY_CONFIRMED'
  | 'PAYMENT_BLOCKED'
  | 'ADMIN_DELETE_MENU'
  | 'ADMIN_CHANGE_PRICE'
  | 'ADMIN_REFUND_PAYMENT'
  | 'ADMIN_RESET_RIDER_PASSWORD'
  | 'ADMIN_ASSIGN_RIDER'
  | 'ADMIN_REJECT_ORDER'
  | 'CHECKOUT_RECOVERED'
  | 'ADMIN_ACCEPT_ORDER'
  | 'ADMIN_UPDATE_ORDER_STATUS'
  | 'ADMIN_UPDATE_SETTINGS'
  | 'ADMIN_BLOCK_CUSTOMER'
  | 'ADMIN_UPDATE_CATEGORY'
  | 'ADMIN_CREATE_CATEGORY'
  | 'ADMIN_DELETE_CATEGORY'
  | 'ADMIN_CREATE_MENU_ITEM'
  | 'ADMIN_UPDATE_MENU_ITEM'
  | 'ADMIN_DELETE_MENU_ITEM'
  | 'ADMIN_CREATE_DISCOUNT'
  | 'ADMIN_UPDATE_DISCOUNT'
  | 'ADMIN_DELETE_DISCOUNT'
  | 'ADMIN_BLOCK_CUSTOMER'
  | 'ADMIN_UNBLOCK_CUSTOMER'
  | 'ADMIN_CREATE_BANNER'
  | 'ADMIN_UPDATE_BANNER'
  | 'ADMIN_DELETE_BANNER'
  | 'ADMIN_HIDE_REVIEW'
  | 'ADMIN_SHOW_REVIEW'
  | 'ADMIN_UPDATE_SHOP_SETTINGS'
  | 'ADMIN_UPDATE_DELIVERY_SETTINGS'
  | 'ADMIN_UPDATE_PAYMENT_SETTING'
  | 'ADMIN_UPDATE_SETTINGS';

export type AuditResult = 'SUCCESS' | 'FAILED' | 'DUPLICATE' | 'BLOCKED';

type AuditContext = {
  req?: Request;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
};

function extractIp(req?: Request): string | null {
  if (!req) return null;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() || null;
  return req.ip || null;
}

function extractDevice(userAgent?: string | null): string | null {
  if (!userAgent) return null;
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return 'mobile';
  if (/postman|curl|insomnia/i.test(userAgent)) return 'api-client';
  return 'web';
}

export async function logAudit(
  action: AuditAction,
  result: AuditResult,
  details?: Record<string, unknown> | string,
  context: AuditContext = {}
): Promise<void> {
  try {
    const userAgent = context.userAgent ?? context.req?.headers['user-agent']?.toString() ?? null;
    await prisma.auditLog.create({
      data: {
        userId: context.userId ?? null,
        action,
        result,
        details: typeof details === 'string' ? details : details ? JSON.stringify(details) : null,
        ip: context.ip ?? extractIp(context.req),
        userAgent,
        device: context.device ?? extractDevice(userAgent),
      },
    });
  } catch (error) {
    console.error('[AUDIT] Failed to write audit log:', error);
  }
}
