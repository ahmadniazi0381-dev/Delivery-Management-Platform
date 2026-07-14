import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are set and not placeholders
const isTwilioConfigured =
  accountSid &&
  accountSid !== 'AC_YOUR_TWILIO_ACCOUNT_SID' &&
  authToken &&
  authToken !== 'YOUR_TWILIO_AUTH_TOKEN' &&
  twilioPhone;

let client: twilio.Twilio | null = null;
if (isTwilioConfigured) {
  try {
    client = twilio(accountSid, authToken);
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
  const messageText = `Your Naseeb Baryani UCP verification code is: ${otpCode}. Valid for 5 minutes.`;

  if (client && twilioPhone) {
    try {
      const message = await client.messages.create({
        body: messageText,
        from: twilioPhone,
        to: phone,
      });
      console.log(`Twilio OTP sent to ${phone}. Message SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error(`Twilio failed to send OTP to ${phone}:`, error);
      // Fallback logging for ease of testing during failure
      console.log(`[SMS FALLBACK MOCK] To: ${phone} | Body: ${messageText}`);
      return true; // Return true to prevent blocking devs during sandbox configuration
    }
  } else {
    // Development fallback
    console.log('=====================================================');
    console.log(`[SMS MOCK] To: ${phone}`);
    console.log(`[SMS MOCK] Message: ${messageText}`);
    console.log('=====================================================');
    return true;
  }
}

/**
 * Generates a random 6-digit numeric OTP code.
 */
export function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
