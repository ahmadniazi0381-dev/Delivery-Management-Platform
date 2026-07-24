import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { generateSixDigitOtp, sendOtpSms } from '../services/otp.service';
import { logAudit } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordLoginHistory, notifyOwner } from '../services/management.service';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required.');
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

async function auditLogin(req: Request, user: { id: string; role: string }, success: boolean) {
  const action =
    user.role === 'ADMIN' ? 'ADMIN_LOGIN' : user.role === 'RIDER' ? 'RIDER_LOGIN' : 'CUSTOMER_LOGIN';
  await logAudit(action, success ? 'SUCCESS' : 'FAILED', { userId: user.id, role: user.role }, { req, userId: user.id });
}

/**
 * Register a new user (Customer by default).
 */
export async function register(req: Request, res: Response) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required.' });
    }

    // Check if user already exists with that phone
    const existingPhoneUser = await prisma.user.findUnique({ where: { phone } });
    if (existingPhoneUser) {
      return res.status(400).json({ error: 'Phone number is already registered.' });
    }

    // Check if email already exists
    if (email) {
      const existingEmailUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (existingEmailUser) {
        return res.status(400).json({ error: 'Email address is already registered.' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isDev = process.env.NODE_ENV !== 'production';

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : null,
        phone,
        passwordHash,
        role: 'CUSTOMER', // Default role
        phoneVerified: isDev, // Auto-verify phone in development only
      },
    });

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        mustChangePassword: !!user.mustChangePassword,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user.' });
  }
}

/**
 * Login customer, rider, or admin using phone/email and password.
 * In development mode, auto-seeds test accounts for admin@test.com,
 * customer@test.com, and rider@test.com.
 */
export async function login(req: Request, res: Response) {
  try {
    const { phone, email, password } = req.body;
    const identifier = email?.trim() || phone?.trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Phone/email and password are required.' });
    }

    const isDev = process.env.NODE_ENV !== 'production';

    // ── DEV-ONLY: seed and auto-login test accounts ───────────────────────────
    if (isDev) {
      const DEV_ACCOUNTS: Record<string, { phone: string; name: string; role: 'ADMIN' | 'CUSTOMER' | 'RIDER'; password: string }> = {
        'admin@test.com':    { phone: '+923000000000', name: 'Test Admin',    role: 'ADMIN',    password: 'Admin123@' },
        'customer@test.com': { phone: '+923000000002', name: 'Test Customer', role: 'CUSTOMER', password: 'Customer123@' },
        'rider@test.com':    { phone: '+923000000001', name: 'Test Rider',    role: 'RIDER',    password: 'Rider123@' },
      };

      const devAccount = DEV_ACCOUNTS[identifier.toLowerCase()];
      if (devAccount) {
        if (password !== devAccount.password) {
          return res.status(401).json({ error: 'Invalid credentials for dev account.' });
        }

        // Upsert the dev user
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(devAccount.password, salt);

        const devUser = await prisma.user.upsert({
          where: { phone: devAccount.phone },
          update: { email: identifier.toLowerCase(), role: devAccount.role as any, phoneVerified: true },
          create: {
            name: devAccount.name,
            email: identifier.toLowerCase(),
            phone: devAccount.phone,
            passwordHash,
            role: devAccount.role as any,
            phoneVerified: true,
          },
        });

        const token = jwt.sign(
          {
            id: devUser.id,
            phone: devUser.phone,
            role: devUser.role,
            phoneVerified: true,
            mustChangePassword: !!devUser.mustChangePassword,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN as any }
        );

        await auditLogin(req, devUser, true);

        return res.status(200).json({
          message: 'Dev login successful.',
          token,
          user: { id: devUser.id, name: devUser.name, email: devUser.email, phone: devUser.phone, role: devUser.role, phoneVerified: true },
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Production path: find user by phone or email
    let user = null;
    if (identifier.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: identifier },
        include: { staffProfile: true },
      });
    } else {
      // Normalize phone
      let compact = identifier.replace(/[^\d+]/g, '');
      if (compact.startsWith('0092')) compact = '+' + compact.slice(4);
      if (compact.startsWith('92') && compact.length === 12) compact = '+' + compact;
      if (compact.startsWith('03') && compact.length === 11) compact = '+92' + compact.slice(1);
      if (compact.startsWith('3') && compact.length === 10) compact = '+92' + compact;
      user = await prisma.user.findUnique({
        where: { phone: compact },
        include: { staffProfile: true },
      });
    }

    if (!user || !user.passwordHash) {
      await logAudit('CUSTOMER_LOGIN', 'FAILED', { identifier }, { req });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await auditLogin(req, user, false);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const staffProfile = (user as any).staffProfile ?? null;

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        mustChangePassword: !!user.mustChangePassword,
        ...(staffProfile && {
          staffRole: staffProfile.staffRole,
          permissions: staffProfile.permissions,
        }),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    await auditLogin(req, user, true);

    // Update lastLoginAt for staff & record LoginHistory + Notify Owner
    if (staffProfile) {
      prisma.staffProfile.update({
        where: { id: staffProfile.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => {});

      recordLoginHistory({
        userId: user.id,
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || undefined,
        userAgent: req.headers['user-agent'],
      }).catch(() => {});

      if (staffProfile.staffRole !== 'OWNER') {
        const io = req.app.get('io');
        notifyOwner({
          io,
          staffName: user.name,
          action: 'Staff Login',
          details: `Role: ${staffProfile.staffRole}`,
        }).catch(() => {});
      }
    }

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        mustChangePassword: !!user.mustChangePassword,
        ...(staffProfile && {
          staffRole: staffProfile.staffRole,
          permissions: staffProfile.permissions,
        }),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login.' });
  }
}


/**
 * Sends a 6-digit OTP verification code to the authenticated user's phone.
 */
export async function sendOtp(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.phone) {
      return res.status(400).json({
        error: 'Add a phone number in your profile before verifying.',
        requirePhone: true,
      });
    }

    const otpCode = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Store in database
    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpCode,
        purpose: `PHONE_VERIFICATION:${user.phone}`,
        expiresAt,
      },
    });

    // Send SMS
    await sendOtpSms(user.phone, otpCode);

    return res.status(200).json({ message: 'OTP verification code sent to your phone.' });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send OTP.' });
  }
}

/**
 * Verifies the 6-digit OTP code.
 */
export async function verifyOtp(req: AuthenticatedRequest, res: Response) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const userObj = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!userObj || !userObj.phone) {
      return res.status(400).json({ error: 'No phone number associated with user profile.' });
    }

    // Find the latest active OTP for this user and phone number
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: req.user.id,
        otpCode: code,
        purpose: `PHONE_VERIFICATION:${userObj.phone}`,
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // Update OTP status
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    // Mark user phone as verified
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { phoneVerified: true },
    });

    // Issue a new token with updated phoneVerified status
    const token = jwt.sign(
      {
        id: updatedUser.id,
        phone: updatedUser.phone,
        role: updatedUser.role,
        phoneVerified: true,
        mustChangePassword: !!updatedUser.mustChangePassword,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(200).json({
      message: 'Phone number verified successfully.',
      token,
      phoneVerified: true,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Verification failed.' });
  }
}

/**
 * Handle Google Login via verified ID token (Google Identity Services / OAuth).
 * Creates the customer immediately without requiring a phone number.
 * Phone is collected later in profile or before checkout.
 */
export async function googleLogin(req: Request, res: Response) {
  try {
    const idToken: string | undefined = req.body.idToken || req.body.token;
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required.' });
    }

    const clientIdRaw = process.env.GOOGLE_CLIENT_ID?.trim() || '';
    const extraIds = (process.env.GOOGLE_CLIENT_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const audiences = Array.from(
      new Set([
        ...clientIdRaw.split(',').map((s) => s.trim()).filter(Boolean),
        ...extraIds,
      ])
    ).filter((id) => id && id !== 'your_google_client_id' && !id.includes('YOUR_GOOGLE'));

    if (audiences.length === 0) {
      console.error('[GOOGLE AUTH] GOOGLE_CLIENT_ID is not configured.');
      return res.status(503).json({ error: 'Google sign-in is not configured on the server.' });
    }

    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(audiences[0]);
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: audiences });
    } catch (verifyErr) {
      console.error('[GOOGLE AUTH] ID token verification failed:', verifyErr);
      return res.status(401).json({ error: 'Invalid Google credentials.' });
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ error: 'Google account email is required.' });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name =
      (payload.name && payload.name.trim()) ||
      email.split('@')[0] ||
      'Google User';
    const profilePicture = payload.picture || null;

    // Prefer googleId match, then email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          profilePicture,
          phone: null,
          phoneVerified: false,
          role: 'CUSTOMER',
        },
      });
    } else {
      // Link googleId / refresh profile fields if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId,
          email: user.email || email,
          profilePicture: user.profilePicture || profilePicture,
          name: user.name || name,
        },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        mustChangePassword: !!user.mustChangePassword,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(200).json({
      message: 'Google login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Failed to process Google sign in.' });
  }
}

/**
 * Initiates the password reset flow.
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { phone } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // Return 200 even if user doesn't exist for security/privacy
      return res.status(200).json({ message: 'If the phone number is registered, an OTP will be sent.' });
    }

    if (!user.phone) {
      return res.status(200).json({ message: 'If the phone number is registered, an OTP will be sent.' });
    }

    const otpCode = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpCode,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    await sendOtpSms(user.phone, otpCode);

    return res.status(200).json({ message: 'If the phone number is registered, an OTP will be sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to request password reset.' });
  }
}

/**
 * Resets password using the OTP verification code.
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { phone, code, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        otpCode: code,
        purpose: 'PASSWORD_RESET',
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password and mark OTP verified
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isVerified: true },
      }),
    ]);

    await logAudit('PASSWORD_RESET', 'SUCCESS', { userId: user.id }, { req, userId: user.id });

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

/**
 * Get current authenticated user profile.
 */
export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        phoneVerified: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Failed to get user profile.' });
  }
}

/**
 * Update user profile (name, email).
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const { name, email } = req.body;
    if (!name && !email) {
      return res.status(400).json({ error: 'At least one field (name or email) is required.' });
    }
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, phoneVerified: true, loyaltyPoints: true },
    });
    return res.status(200).json({ message: 'Profile updated successfully.', user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

/**
 * Request phone number change — sends OTP to NEW phone number.
 */
export async function requestPhoneChange(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'New phone number is required.' });
    }

    // Check if the new phone is already taken
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ error: 'Phone number is already registered to another account.' });
    }

    const otpCode = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpVerification.create({
      data: {
        userId: req.user.id,
        otpCode,
        purpose: `PHONE_VERIFICATION:${phone}`,
        expiresAt,
      },
    });

    await sendOtpSms(phone, otpCode);

    return res.status(200).json({ message: 'OTP sent to new phone number.' });
  } catch (error) {
    console.error('Request phone change error:', error);
    return res.status(500).json({ error: 'Failed to send OTP.' });
  }
}

/**
 * Confirm phone number change using OTP.
 */
export async function confirmPhoneChange(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP code are required.' });
    }

    // Verify OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: req.user.id,
        otpCode: code,
        purpose: `PHONE_VERIFICATION:${phone}`,
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    // Update phone and mark OTP verified
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { phone, phoneVerified: true },
      }),
      prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isVerified: true },
      }),
    ]);

    // Issue new token with updated phone
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, phoneVerified: true, mustChangePassword: true },
    });

    const newToken = jwt.sign(
      {
        id: req.user.id,
        phone,
        role: req.user.role,
        phoneVerified: true,
        mustChangePassword: !!updatedUser?.mustChangePassword,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(200).json({
      message: 'Phone number updated successfully.',
      token: newToken,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Confirm phone change error:', error);
    return res.status(500).json({ error: 'Failed to update phone number.' });
  }
}

/**
 * Change own password (authenticated). Clears mustChangePassword flag.
 */
export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash, mustChangePassword: false },
    });

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        mustChangePassword: false,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      token,
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
}

