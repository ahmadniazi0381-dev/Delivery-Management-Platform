import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logAudit } from '../services/audit.service';

// ─── Permission constants ─────────────────────────────────────────────────────

export const ALL_PERMISSIONS = [
  'DASHBOARD_VIEW',
  'ORDERS_VIEW',
  'ORDERS_MANAGE',
  'MENU_VIEW',
  'MENU_MANAGE',
  'CUSTOMERS_VIEW',
  'CUSTOMERS_MANAGE',
  'RIDERS_VIEW',
  'RIDERS_MANAGE',
  'REPORTS_VIEW',
  'PAYMENTS_VIEW',
  'PAYMENTS_MANAGE',
  'SETTINGS_VIEW',
  'SETTINGS_MANAGE',
  'STAFF_MANAGE',
  'KDS_VIEW',
  'KDS_MANAGE',
] as const;

export type StaffPermission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, StaffPermission[]> = {
  OWNER: [...ALL_PERMISSIONS],
  MANAGER: [
    'DASHBOARD_VIEW',
    'ORDERS_VIEW',
    'ORDERS_MANAGE',
    'MENU_VIEW',
    'MENU_MANAGE',
    'CUSTOMERS_VIEW',
    'CUSTOMERS_MANAGE',
    'RIDERS_VIEW',
    'RIDERS_MANAGE',
    'REPORTS_VIEW',
    'PAYMENTS_VIEW',
  ],
  CASHIER: [
    'ORDERS_VIEW',
    'ORDERS_MANAGE',
    'PAYMENTS_VIEW',
    'PAYMENTS_MANAGE',
  ],
  KDS: [
    'ORDERS_VIEW',
    'KDS_VIEW',
    'KDS_MANAGE',
  ],
  RIDER_MANAGER: [
    'ORDERS_VIEW',
    'RIDERS_VIEW',
    'RIDERS_MANAGE',
  ],
  BRANCH_MANAGER: [
    'DASHBOARD_VIEW',
    'ORDERS_VIEW',
    'ORDERS_MANAGE',
    'MENU_VIEW',
    'MENU_MANAGE',
    'CUSTOMERS_VIEW',
    'RIDERS_VIEW',
    'REPORTS_VIEW',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Select shape used for staff list + detail */
const STAFF_SELECT = {
  id: true,
  staffRole: true,
  permissions: true,
  isActive: true,
  notes: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  invitedById: true,
  user: {
    select: { id: true, name: true, email: true, phone: true, profilePicture: true },
  },
  invitedBy: {
    select: { id: true, name: true },
  },
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /owner/staff
 * List all staff profiles (requires STAFF_MANAGE permission).
 */
export async function getStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const staff = await prisma.staffProfile.findMany({
      select: STAFF_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: staff });
  } catch (error) {
    console.error('[STAFF] getStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get staff list.' });
  }
}

/**
 * GET /owner/staff/roles
 * Returns available roles and their default permissions.
 */
export async function getStaffRoles(_req: AuthenticatedRequest, res: Response) {
  return res.json({
    success: true,
    data: {
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'KDS', 'RIDER_MANAGER', 'BRANCH_MANAGER'],
      permissions: ALL_PERMISSIONS,
      defaults: ROLE_DEFAULT_PERMISSIONS,
    },
  });
}

/**
 * POST /owner/staff
 * Create a new staff user (role=ADMIN) + attach a StaffProfile.
 * Body: { name, email?, phone, password, staffRole, permissions?, notes? }
 */
export async function createStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, phone, password, staffRole, permissions, notes } = req.body;

    if (!name || !phone || !password || !staffRole) {
      return res.status(400).json({ success: false, message: 'name, phone, password, and staffRole are required.' });
    }

    const validRoles = ['OWNER', 'MANAGER', 'CASHIER', 'KDS', 'RIDER_MANAGER', 'BRANCH_MANAGER'];
    if (!validRoles.includes(staffRole)) {
      return res.status(400).json({ success: false, message: `staffRole must be one of: ${validRoles.join(', ')}.` });
    }

    // Only Owner can create another Owner
    const callerProfile = await prisma.staffProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (staffRole === 'OWNER' && callerProfile?.staffRole !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only an Owner can create another Owner.' });
    }

    // Check uniqueness
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is already in use.' });
      }
    }
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email is already in use.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Resolve permissions (use provided or fall back to defaults for role)
    const resolvedPermissions: string[] =
      Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : ROLE_DEFAULT_PERMISSIONS[staffRole] ?? [];

    // Transactionally create User + StaffProfile
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email ? email.toLowerCase().trim() : null,
          phone,
          passwordHash,
          role: 'ADMIN',
          phoneVerified: true, // Staff are verified by Owner
          mustChangePassword: true, // Force password change on first login
        },
      });

      const staffProfile = await tx.staffProfile.create({
        data: {
          userId: newUser.id,
          staffRole,
          permissions: resolvedPermissions,
          isActive: true,
          invitedById: req.user!.id,
          notes: notes || null,
        },
        select: STAFF_SELECT,
      });

      return staffProfile;
    });

    await logAudit(
      'ADMIN_CREATE_STAFF' as any,
      'SUCCESS',
      { staffUserId: result.user.id, staffRole },
      { req, userId: req.user?.id }
    );

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[STAFF] createStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create staff member.' });
  }
}

/**
 * PUT /owner/staff/:id
 * Update a staff profile's role, permissions, active status, or notes.
 * :id is the StaffProfile id.
 */
export async function updateStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { staffRole, permissions, isActive, notes, name, email } = req.body;

    const existing = await prisma.staffProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Only Owner can modify another Owner profile
    const callerProfile = await prisma.staffProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (existing.staffRole === 'OWNER' && callerProfile?.userId !== existing.userId) {
      return res.status(403).json({ success: false, message: 'Cannot modify another Owner account.' });
    }
    if (staffRole === 'OWNER' && callerProfile?.staffRole !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only an Owner can promote to Owner.' });
    }

    // Build update payload
    const profileUpdate: Record<string, unknown> = {};
    if (staffRole) profileUpdate.staffRole = staffRole;
    if (Array.isArray(permissions)) profileUpdate.permissions = permissions;
    if (typeof isActive === 'boolean') profileUpdate.isActive = isActive;
    if (notes !== undefined) profileUpdate.notes = notes;

    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Optionally update the linked user's name / email
      if (name || email) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(name && { name: name.trim() }),
            ...(email && { email: email.toLowerCase().trim() }),
          },
        });
      }

      return tx.staffProfile.update({
        where: { id },
        data: profileUpdate,
        select: STAFF_SELECT,
      });
    });

    await logAudit(
      'ADMIN_UPDATE_STAFF' as any,
      'SUCCESS',
      { staffProfileId: id, changes: profileUpdate },
      { req, userId: req.user?.id }
    );

    return res.json({ success: true, data: updatedProfile });
  } catch (error) {
    console.error('[STAFF] updateStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff member.' });
  }
}


/**
 * DELETE /owner/staff/:id
 * Hard-deletes the staff profile and associated user account.
 * Owners cannot be deleted (deactivate instead).
 */
export async function deleteStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const profile = await prisma.staffProfile.findUnique({ where: { id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Cannot delete Owner via this endpoint
    if (profile.staffRole === 'OWNER') {
      return res.status(403).json({ success: false, message: 'Owner accounts cannot be deleted. Deactivate instead.' });
    }

    // Cannot delete yourself
    if (profile.userId === req.user!.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account.' });
    }

    await prisma.user.delete({ where: { id: profile.userId } }); // cascades to staffProfile

    await logAudit(
      'ADMIN_DELETE_STAFF' as any,
      'SUCCESS',
      { staffProfileId: id },
      { req, userId: req.user?.id }
    );

    return res.json({ success: true, message: 'Staff member deleted.' });
  } catch (error) {
    console.error('[STAFF] deleteStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete staff member.' });
  }
}

/**
 * PUT /owner/staff/:id/reset-password
 * Owner resets a staff member's password.
 */
export async function resetStaffPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const profile = await prisma.staffProfile.findUnique({ where: { id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: profile.userId },
      data: { passwordHash, mustChangePassword: true },
    });

    await logAudit(
      'ADMIN_RESET_STAFF_PASSWORD' as any,
      'SUCCESS',
      { staffProfileId: id },
      { req, userId: req.user?.id }
    );

    return res.json({ success: true, message: 'Password reset. Staff must change it on next login.' });
  } catch (error) {
    console.error('[STAFF] resetStaffPassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
}
