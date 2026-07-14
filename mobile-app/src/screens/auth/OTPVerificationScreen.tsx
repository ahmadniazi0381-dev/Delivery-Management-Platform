import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient, apiPost } from "../../api/client";
import { Ionicons } from "@expo/vector-icons";

export default function OTPVerificationScreen({ route, navigation }: any) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const { phone, token: initialToken, user: initialUser } = route.params || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const inputRefs = useRef<TextInput[]>([]);

  // Countdown timer for resend code
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Send initial OTP request on mount
  useEffect(() => {
    sendOtpRequest();
  }, []);

  const sendOtpRequest = async () => {
    setError("");
    try {
      // If we have an initial token, configure client defaults temporarily to authorize sending
      const headers = initialToken ? { Authorization: `Bearer ${initialToken}` } : {};
      const res: any = await apiClient.post("/auth/otp/send", { purpose: "PHONE_VERIFICATION" }, { headers });
    } catch (err: any) {
      setError("Failed to send verification SMS. Try resending.");
    }
  };

  const handleResend = async () => {
    setIsResendDisabled(true);
    setResendTimer(60);
    await sendOtpRequest();
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    // Auto-advance focus if digit typed
    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move backward if backspace pressed on empty input
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter the full 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send code verification request
      // Backend expects { code } not { otpCode }
      const headers = initialToken ? { Authorization: `Bearer ${initialToken}` } : {};
      const response: any = await apiClient.post(
        "/auth/otp/verify",
        { code: otpCode }, // ← correct field name per validation.schemas.ts
        { headers }
      );

      // Backend returns { message, token, phoneVerified } — no 'success' field
      if (response.data?.token || response.data?.phoneVerified) {
        const finalToken = response.data.token || initialToken;
        const finalUser = { ...initialUser, phoneVerified: true };
        await login(finalToken, finalUser);
      } else {
        setError(response.data?.error || "Incorrect OTP code. Please try again.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "OTP verification failed. Double-check your code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Verify Phone</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-digit code sent to your phone number {phone}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          <Text style={[styles.stepText, { color: colors.primary }]}>Step 2 of 2: Verification</Text>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <View style={styles.otpGrid}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
                style={[styles.otpInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleOtpChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {isResendDisabled ? (
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Resend code in <Text style={{ fontWeight: "700" }}>{resendTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendText, { color: colors.primary }]}>Resend Code via SMS</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 10,
    padding: 4,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  stepText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 24,
    textAlign: "center",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
  },
  otpGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: "700",
  },
  btn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  resendText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
