import { Router } from 'express';
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  requestPhoneChange,
  confirmPhoneChange,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  authLimiter,
  otpLimiter,
  profileLimiter,
  validateBody,
} from '../middleware/security.middleware';
import {
  RegisterSchema,
  LoginSchema,
  GoogleLoginSchema,
  OtpVerifySchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from '../middleware/validation.schemas';

const router = Router();

// Strict rate limit + schema validation on all auth write routes
router.post('/register', authLimiter, validateBody(RegisterSchema), register);
router.post('/login',    authLimiter, validateBody(LoginSchema),    login);
router.post('/google',   authLimiter, validateBody(GoogleLoginSchema), googleLogin);

// Password Reset Routes
router.post('/forgot-password', authLimiter, validateBody(ForgotPasswordSchema), forgotPassword);
router.post('/reset-password',   authLimiter, validateBody(ResetPasswordSchema),   resetPassword);

// OTP: even stricter rate limit (anti-SMS-bomb)
router.post('/otp/send',   otpLimiter,  authenticate, sendOtp);
router.post('/otp/verify', otpLimiter,  authenticate, validateBody(OtpVerifySchema), verifyOtp);

// Profile management (authenticated)
router.get('/me',                  authenticate, getMe);
router.put('/profile',             profileLimiter, authenticate, updateProfile);
router.put('/change-password',     profileLimiter, authenticate, validateBody(ChangePasswordSchema), changePassword);
router.post('/phone/request',      profileLimiter, authenticate, requestPhoneChange);
router.post('/phone/confirm',      profileLimiter, authenticate, confirmPhoneChange);

export default router;
