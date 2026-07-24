import { OrderStatus, StaffRole } from '@prisma/client';
import prisma from '../config/db';

export interface AuditTrailInput {
  orderId: string;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string;
  previousStatus?: OrderStatus | null;
  newStatus?: OrderStatus | null;
  note?: string | null;
  isOverride?: boolean;
}

/**
 * Record an append-only audit trail entry for an order.
 * Never overwrites history.
 */
export async function recordOrderAuditTrail(input: AuditTrailInput) {
  try {
    const entry = await prisma.orderAuditTrail.create({
      data: {
        orderId: input.orderId,
        userId: input.userId || null,
        userName: input.userName || 'System',
        userRole: input.userRole || 'SYSTEM',
        action: input.action,
        previousStatus: input.previousStatus || null,
        newStatus: input.newStatus || null,
        note: input.note || null,
        isOverride: input.isOverride || false,
      },
    });
    return entry;
  } catch (error) {
    console.error('[AUDIT TRAIL] Failed to record order audit trail:', error);
  }
}

export interface OwnerNotificationInput {
  io?: import('socket.io').Server;
  staffName: string;
  action: string;
  orderNumber?: string | null;
  details?: string | null;
  targetUrl?: string | null;
}

/**
 * Send real-time Owner notification via Socket.IO and persist to DB.
 */
export async function notifyOwner(input: OwnerNotificationInput) {
  try {
    const title = `Staff Action: ${input.action}`;
    const body = `${input.staffName} performed ${input.action}${
      input.orderNumber ? ` on Order #${input.orderNumber}` : ''
    }${input.details ? ` (${input.details})` : ''}.`;

    // Emit via socket if io is available
    if (input.io) {
      input.io.to('admin').emit('owner:notification', {
        id: `notif-${Date.now()}`,
        staffName: input.staffName,
        action: input.action,
        orderNumber: input.orderNumber || null,
        details: input.details || null,
        targetUrl: input.targetUrl || '/dashboard/orders',
        timestamp: new Date().toISOString(),
      });
    }

    // Also persist in ActivityLog for chronological history
    const ownerUsers = await prisma.staffProfile.findMany({
      where: { staffRole: 'OWNER' },
      select: { userId: true },
    });

    for (const owner of ownerUsers) {
      await prisma.notification.create({
        data: {
          userId: owner.userId,
          title,
          body,
          type: 'STAFF_ACTION',
        },
      });
    }
  } catch (error) {
    console.error('[OWNER NOTIFICATION] Failed to notify owner:', error);
  }
}

/**
 * Record staff activity log for history tracking and activity center.
 */
export async function recordStaffActivity(input: {
  userId: string;
  action: string;
  details?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        details: input.details || null,
      },
    });
  } catch (error) {
    console.error('[STAFF ACTIVITY] Failed to record activity:', error);
  }
}

/**
 * Helper to record staff login history with user agent & device details.
 */
export async function recordLoginHistory(input: {
  userId: string;
  ip?: string;
  userAgent?: string;
}) {
  try {
    const ua = input.userAgent || '';
    let device = 'Desktop';
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet/i.test(ua)) device = 'Tablet';

    let browser = 'Unknown Browser';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';

    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    const entry = await prisma.loginHistory.create({
      data: {
        userId: input.userId,
        ip: input.ip || '127.0.0.1',
        device,
        browser,
        os,
        location: 'Lahore, Pakistan',
      },
    });

    return entry;
  } catch (error) {
    console.error('[LOGIN HISTORY] Failed to record login history:', error);
  }
}
