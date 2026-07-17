import { apiPost } from '../api/client';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    profilePicture?: string;
    loyaltyPoints: number;
    referralCode?: string;
  };
}

export const AuthService = {
  async phoneLogin(phone: string, password: string): Promise<AuthResponse> {
    return apiPost<AuthResponse>('/auth/login', { phone, password });
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    return apiPost<AuthResponse>('/auth/google', { idToken });
  },

  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    return apiPost('/auth/send-otp', { phone });
  },

  async verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
    return apiPost<AuthResponse>('/auth/verify-otp', { phone, otp });
  },

  async register(data: { name: string; phone: string; password: string; referralCode?: string }): Promise<AuthResponse> {
    return apiPost<AuthResponse>('/auth/register', data);
  },

  async registerPushToken(token: string): Promise<void> {
    try {
      await apiPost('/auth/push-token', { token });
    } catch { /* non-critical */ }
  },
};
