import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { apiPost } from "../../api/client";
import { Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const { login, biometricLogin, isBiometricSupported } = useAuth();
  const { colors } = useTheme();

  const [loginMethod, setLoginMethod] = useState<'phone' | 'google' | 'guest'>('phone');
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId || undefined,
    iosClientId: iosClientId || webClientId || undefined,
    androidClientId: androidClientId || webClientId || undefined,
    webClientId: webClientId || undefined,
  });

  useEffect(() => {
    // Check if biometric login is available and automatically try
    async function checkSavedCredentials() {
      try {
        const savedPhone = await AsyncStorage.getItem("@remember_phone");
        if (savedPhone) setPhone(savedPhone);
        
        const isBiometricEnabled = await AsyncStorage.getItem("@naseeb_biometric_enabled");
        if (isBiometricEnabled === "true" && isBiometricSupported) {
          const success = await biometricLogin();
          if (success) {
            console.log("Biometric login success");
          }
        }
      } catch {}
    }
    checkSavedCredentials();
  }, [isBiometricSupported]);

  useEffect(() => {
    const completeGoogleLogin = async () => {
      if (googleResponse?.type !== "success") return;
      const idToken =
        googleResponse.params?.id_token ||
        (googleResponse as { authentication?: { idToken?: string } }).authentication?.idToken;
      if (!idToken) {
        setError("Google did not return an ID token.");
        return;
      }
      setGoogleLoading(true);
      setError("");
      try {
        const res: any = await apiPost("/auth/google", { idToken });
        if (res.token) {
          if (rememberMe) {
            await AsyncStorage.setItem("@remember_phone", res.user.phone || "");
          }
          await login(res.token, res.user);
        } else {
          setError(res.error || "Google login failed.");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Cannot connect to server.");
      } finally {
        setGoogleLoading(false);
      }
    };
    completeGoogleLogin();
  }, [googleResponse, login, rememberMe]);

  const normalizePhone = (raw: string): string => {
    let c = raw.replace(/[^\d+]/g, "");
    if (c.startsWith("0092")) c = "+" + c.slice(4);
    if (c.startsWith("92") && c.length === 12) c = "+" + c;
    if (c.startsWith("03") && c.length === 11) c = "+92" + c.slice(1);
    if (c.startsWith("3") && c.length === 10) c = "+92" + c;
    return c;
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const isEmail = phone.includes("@");
      const identifier = isEmail ? phone.trim() : normalizePhone(phone);
      const payload = isEmail ? { email: identifier, password } : { phone: identifier, password };
      
      const response: any = await apiPost("/auth/login", payload);
      if (response.token) {
        if (rememberMe) {
          await AsyncStorage.setItem("@remember_phone", phone);
          await AsyncStorage.setItem("@naseeb_biometric_enabled", "true");
        } else {
          await AsyncStorage.removeItem("@remember_phone");
          await AsyncStorage.removeItem("@naseeb_biometric_enabled");
        }
        await login(response.token, response.user);
      } else {
        setError(response.error || "Login failed. Check your credentials.");
      }
    } catch (err: any) {
      const data = err.response?.data;
      let msg = data?.error || data?.message;
      if (data?.issues && Array.isArray(data.issues)) {
        msg = data.issues.map((i: any) => i.message).join("\n");
      }
      setError(msg || "Cannot connect to server. Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (email: string, pass: string) => {
    setError("");
    setLoading(true);
    setPhone(email);
    setPassword(pass);
    try {
      const response: any = await apiPost("/auth/login", { email, password: pass });
      if (response.token) {
        await login(response.token, response.user);
      } else {
        setError(response.error || "Dev login failed.");
      }
    } catch (err: any) {
      setError("Dev login failed. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    if (!webClientId && !iosClientId && !androidClientId) {
      setError("Google sign-in is not configured.");
      return;
    }
    if (!googleRequest) {
      setError("Google sign-in is loading...");
      return;
    }
    setGoogleLoading(true);
    try {
      await promptGoogleAsync();
    } catch {
      setError("Google sign-in failed to open.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    addToast("Apple Sign-in is only available on verified production configurations.", "info");
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const response: any = await apiPost("/auth/guest-login", {});
      if (response.token) {
        await login(response.token, response.user);
      }
    } catch {
      setError("Guest login failed.");
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
        <View style={styles.header}>
          <Image
            source={require("../../../assets/logo.jpg")}
            style={{
              width: 80, height: 80, borderRadius: 40,
              borderWidth: 1.5, borderColor: colors.primary, marginBottom: 12,
            }}
          />
          <Text style={[styles.logoText, { color: colors.primary }]}>Karachi Naseeb Baryani</Text>
          <Text style={[styles.logoSubtext, { color: colors.textSecondary }]}>& Pulao UCP Branch</Text>
        </View>

        {/* Auth Mode switcher tab */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, loginMethod === 'phone' && { borderBottomColor: colors.primary }]}
            onPress={() => setLoginMethod('phone')}
          >
            <Text style={[styles.tabText, { color: loginMethod === 'phone' ? colors.primary : colors.textSecondary }]}>Phone / Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, loginMethod === 'google' && { borderBottomColor: colors.primary }]}
            onPress={() => setLoginMethod('google')}
          >
            <Text style={[styles.tabText, { color: loginMethod === 'google' ? colors.primary : colors.textSecondary }]}>Social Logins</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, loginMethod === 'guest' && { borderBottomColor: colors.primary }]}
            onPress={() => setLoginMethod('guest')}
          >
            <Text style={[styles.tabText, { color: loginMethod === 'guest' ? colors.primary : colors.textSecondary }]}>Guest</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          {loginMethod === 'phone' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Phone Number or Email</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="03001234567 or email"
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="default"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Enter password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember me + Biometrics */}
              <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setRememberMe(!rememberMe)}>
                  <Ionicons name={rememberMe ? "checkbox" : "square-outline"} size={20} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.textSecondary }]}>Remember Me</Text>
                </TouchableOpacity>
                {isBiometricSupported && (
                  <TouchableOpacity onPress={biometricLogin} style={styles.biometricBtn}>
                    <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                    <Text style={[styles.optionText, { color: colors.primary, fontWeight: '700' }]}>Touch ID</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Login →</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {loginMethod === 'google' && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.socialTitle, { color: colors.textPrimary }]}>Choose dynamic login method</Text>
              <TouchableOpacity
                style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                    <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.googleBtn, { borderColor: colors.textPrimary, backgroundColor: '#000000' }]}
                  onPress={handleAppleLogin}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={[styles.googleBtnText, { color: '#FFFFFF' }]}>Continue with Apple</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {loginMethod === 'guest' && (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={[styles.guestText, { color: colors.textSecondary }]}>
                Browse the menu, add items to cart and check locations without creating an account.
              </Text>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.primary, width: '100%' }]}
                onPress={handleGuestLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginBtnText}>Proceed as Guest</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Dev Quick Login Panel */}
          {__DEV__ && (
            <View style={{
              marginTop: 18,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.primary,
              borderStyle: "dashed",
              backgroundColor: "rgba(217, 119, 6, 0.05)"
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: "700",
                color: colors.primary,
                textAlign: "center",
                marginBottom: 8,
                textTransform: "uppercase"
              }}>
                🛠️ Temporary Dev Logins
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  style={{
                    flex: 1, marginHorizontal: 2, paddingVertical: 8,
                    borderRadius: 8, backgroundColor: colors.primary, alignItems: "center"
                  }}
                  onPress={() => handleDevLogin("admin@test.com", "Admin123@")}
                >
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1, marginHorizontal: 2, paddingVertical: 8,
                    borderRadius: 8, backgroundColor: colors.primary, alignItems: "center"
                  }}
                  onPress={() => handleDevLogin("customer@test.com", "Customer123@")}
                >
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1, marginHorizontal: 2, paddingVertical: 8,
                    borderRadius: 8, backgroundColor: colors.primary, alignItems: "center"
                  }}
                  onPress={() => handleDevLogin("rider@test.com", "Rider123@")}
                >
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>Rider</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.signupContainer}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.signupText, { color: colors.primary }]}>Register</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ alignItems: "center", marginTop: 12 }}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Stub function to prevent throw
function addToast(msg: string, type: string) {
  console.log(msg, type);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 24 },
  logoText: { fontFamily: "Poppins-Bold", fontSize: 24, fontWeight: "700", textAlign: "center" },
  logoSubtext: { fontFamily: "Poppins-SemiBold", fontSize: 16, fontWeight: "600", textAlign: "center", marginTop: 2 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#FAF0E0' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  formCard: { padding: 28, borderRadius: 20, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  formTitle: { fontFamily: "Poppins-Bold", fontSize: 20, fontWeight: "700", textAlign: "center" },
  formSubtitle: { fontFamily: "Inter-Regular", fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 24 },
  errorText: { color: "#DC2626", fontSize: 13, fontWeight: "500", marginBottom: 16, textAlign: "center" },
  inputContainer: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 14, height: 52, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: "100%", fontSize: 14 },
  eyeIcon: { padding: 4 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  checkboxWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionText: { fontSize: 13, fontWeight: '600' },
  biometricBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loginBtn: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 10 },
  loginBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  socialTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: 52, borderRadius: 16, borderWidth: 1.5, gap: 10, marginBottom: 4,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600" },
  guestText: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  signupContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  signupText: { fontWeight: "700" },
});
