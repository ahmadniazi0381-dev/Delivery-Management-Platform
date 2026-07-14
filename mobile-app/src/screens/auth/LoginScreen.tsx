import React, { useState } from "react";
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
  Alert,
  Modal
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { apiPost } from "../../api/client";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const { colors } = useTheme();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Google sign-in state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googlePhone, setGooglePhone] = useState("");

  // Normalize Pakistan phone numbers (strips dashes/spaces/parens)
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
    // Simulated Google sign-in: use test credentials
    setGoogleLoading(true);
    setError("");
    const simEmail = "customer@gmail.com";
    const simName = "Google User";
    try {
      const res: any = await apiPost("/auth/google", { email: simEmail, name: simName });
      if (res.requirePhone) {
        // Backend needs phone to complete registration
        setGoogleEmail(simEmail);
        setGoogleName(simName);
        setShowPhoneModal(true);
        setGoogleLoading(false);
        return;
      }
      if (res.token) {
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

  const handleGooglePhoneSubmit = async () => {
    if (!googlePhone) { setError("Please enter your phone number."); return; }
    setGoogleLoading(true);
    setError("");
    try {
      const normalized = normalizePhone(googlePhone);
      const res: any = await apiPost("/auth/google", { email: googleEmail, name: googleName, phone: normalized });
      if (res.token) {
        setShowPhoneModal(false);
        await login(res.token, res.user);
      } else {
        setError(res.error || "Registration failed.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Cannot connect to server.");
    } finally {
      setGoogleLoading(false);
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

        <View style={[styles.formCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>Login to order delicious food</Text>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

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

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color="#D97706" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

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


      {/* Phone prompt modal for Google sign-in */}
      <Modal visible={showPhoneModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={[styles.formCard, { backgroundColor: colors.cardBg, width: "85%", padding: 24 }]}>
            <Text style={[styles.formTitle, { color: colors.textPrimary, marginBottom: 8 }]}>Almost There!</Text>
            <Text style={{ color: colors.textSecondary, textAlign: "center", marginBottom: 16, fontSize: 13 }}>
              Enter your phone number to complete Google sign-up
            </Text>
            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border, marginBottom: 16 }]}>
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="03001234567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={googlePhone}
                onChangeText={setGooglePhone}
              />
            </View>
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary }]}
              onPress={handleGooglePhoneSubmit}
              disabled={googleLoading}
            >
              {googleLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>Complete Sign Up</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: "center" }} onPress={() => { setShowPhoneModal(false); setError(""); }}>
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoText: { fontFamily: "Poppins-Bold", fontSize: 24, fontWeight: "700", textAlign: "center" },
  logoSubtext: { fontFamily: "Poppins-SemiBold", fontSize: 16, fontWeight: "600", textAlign: "center", marginTop: 2 },
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
  loginBtn: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 10 },
  loginBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: "600" },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: 52, borderRadius: 16, borderWidth: 1.5, gap: 10, marginBottom: 4,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600" },
  signupContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  signupText: { fontWeight: "700" },
});
