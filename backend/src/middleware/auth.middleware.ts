import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string | null;
    role: 'CUSTOMER' | 'ADMIN' | 'RIDER';
    phoneVerified: boolean;
    mustChangePassword?: boolean;
    /** RBAC staff role (only present for ADMIN users with a StaffProfile) */
    staffRole?: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KDS';
    /** Granular permission list derived from the StaffProfile */
    permissions?: string[];
  };
}

/**
 * Middleware to authenticate requests using JWT tokens.
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as {
      id: string;
      phone: string | null;
      role: 'CUSTOMER' | 'ADMIN' | 'RIDER';
      phoneVerified: boolean;
      mustChangePassword?: boolean;
      staffRole?: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KDS';
      permissions?: string[];
    };
    req.user = decoded;

    // Enforce forced password change if flag is set (except for password change endpoints)
    if (
      decoded.mustChangePassword &&
      req.path !== '/change-password' &&
      req.path !== '/auth/change-password' &&
      !req.path.includes('/change-password')
    ) {
      return res.status(403).json({
        error: 'Password change required.',
        mustChangePassword: true,
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Middleware generator to enforce access control based on user roles.
 */
export function requireRole(...roles: Array<'CUSTOMER' | 'ADMIN' | 'RIDER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
}

/**
 * Middleware generator to enforce granular RBAC permission checks.
 * Owners automatically pass all permission checks.
 * Falls back to allow if the user has no StaffProfile (legacy admin token).
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Owners bypass all permission checks
    if (req.user.staffRole === 'OWNER') {
      return next();
    }

    // Legacy ADMIN tokens (no staffProfile yet) — allow during migration period
    if (!req.user.staffRole && !req.user.permissions) {
      return next();
    }

    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({
        error: `Access denied. Required permission: ${permission}`,
        requiredPermission: permission,
      });
    }

    next();
  };
}

