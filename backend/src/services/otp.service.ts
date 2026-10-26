import twilio from 'twilio';
import crypto from 'crypto';

const hasPlaceholderValue = (value?: string): boolean => {
  if (!value) return true;
  const trimmed = value.trim();
  return [
    /REPLACE_WITH_/i,
    /YOUR_TWILIO_/i,
    /YOUR_[A-Z_]+/i,
    /CHANGE_ME/i,
    /PLACEHOLDER/i,
    /example/i,
    /^\s*$/,
  ].some((pattern) => pattern.test(trimmed));
};

export function isDevelopmentOtpModeEnabled(): boolean {
  const value = process.env.OTP_DEV_MODE?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

export function getTwilioConfig(): { accountSid?: string; authToken?: string; phoneNumber?: string; isConfigured: boolean } {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

  const isConfigured =
    !!accountSid &&
    !!authToken &&
    !!twilioPhone &&
    !hasPlaceholderValue(accountSid) &&
    !hasPlaceholderValue(authToken) &&
    !hasPlaceholderValue(twilioPhone) &&
    accountSid.startsWith('AC') &&
    accountSid.length > 10 &&
    authToken.length > 8;

  return { accountSid, authToken, phoneNumber: twilioPhone, isConfigured };
}

const { accountSid, authToken, phoneNumber, isConfigured } = getTwilioConfig();

let client: twilio.Twilio | null = null;
if (isConfigured) {
  try {
    client = twilio(accountSid!, authToken!);
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err);
  }
}

/**
 * Sends a 6-digit OTP verification code via SMS.
 * In development mode (without Twilio config), it logs the OTP to the console.
 *
 * @param phone Recipient phone number (e.g. +923001234567)
 * @param otpCode 6-digit verification code
 */
export async function sendOtpSms(phone: string, otpCode: string): Promise<boolean> {
  const messageText = `Your verification code is: ${otpCode}. Valid for 5 minutes.`;

  if (isDevelopmentOtpModeEnabled()) {
    console.log('=====================================================');
    console.log(`[DEV OTP MODE] To: ${phone}`);
    console.log(`[DEV OTP MODE] Message: ${messageText}`);
    console.log('=====================================================');
    return true;
  }

  if (client && phoneNumber) {
    try {
      const message = await client.messages.create({
        body: messageText,
        from: phoneNumber,
        to: phone,
      });
      console.log(`Twilio OTP sent to ${phone}. Message SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error(`Twilio failed to send OTP to ${phone}:`, error);
      throw new Error('Twilio SMS delivery failed while OTP delivery was required.');
    }
  }

  throw new Error('OTP delivery is not configured. Set valid Twilio credentials or enable OTP_DEV_MODE=true for local development.');
}

/**
 * Generates a cryptographically secure random 6-digit numeric OTP code.
 */
export function generateSixDigitOtp(): string {
  // crypto.randomInt is CSPRNG-backed — safe for security tokens
  return crypto.randomInt(100000, 999999).toString();
}
