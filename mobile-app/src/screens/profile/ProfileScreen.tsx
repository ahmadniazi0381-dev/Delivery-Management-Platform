import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { apiPost, apiPut } from "../../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen({ navigation }: any) {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout, login: authLogin, setUser } = useAuth();

  // Phone update state
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"enter" | "verify">("enter");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Profile edit state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editLoading, setEditLoading] = useState(false);

  const normalizePhone = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.startsWith("+")) return trimmed;
    if (trimmed.startsWith("03")) return "+92" + trimmed.slice(1);
    if (trimmed.startsWith("3") && trimmed.length === 10) return "+92" + trimmed;
    return trimmed;
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        }
      }
    ]);
  };

  const handleGoogleSignIn = async () => {
    Alert.alert(
      "Google sign-in not configured",
      "Use an Expo AuthSession Google flow with EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID before enabling Google account linking in Expo Go."
    );
  };
  // ── Edit Profile ─────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setEditLoading(true);
    try {
      const res: any = await apiPut("/auth/profile", {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
      });
      if (res?.user) {
        setUser(res.user);
        setEditModalVisible(false);
        Alert.alert("Success", "Profile updated successfully.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to update profile.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Phone Number Change ──────────────────────────────────────────────────
  const handleRequestPhoneChange = async () => {
    const normalized = normalizePhone(newPhone);
    if (normalized.length < 12) {
      setPhoneError("Enter a valid phone number (e.g. 03001234567)");
      return;
    }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      await apiPost("/auth/phone/request", { phone: normalized });
      setPhoneStep("verify");
    } catch (err: any) {
      setPhoneError(err?.response?.data?.error || "Failed to send OTP.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleConfirmPhoneChange = async () => {
    if (otpCode.length !== 6) {
      setPhoneError("OTP must be 6 digits.");
      return;
    }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      const normalized = normalizePhone(newPhone);
      const res: any = await apiPost("/auth/phone/confirm", {
        phone: normalized,
        code: otpCode,
      });
      if (res?.token) {
        await AsyncStorage.setItem("@naseeb_token", res.token);
        if (res.user) setUser(res.user);
        setPhoneModalVisible(false);
        setPhoneStep("enter");
        setNewPhone("");
        setOtpCode("");
        Alert.alert("Success", "Phone number updated successfully!");
      }
    } catch (err: any) {
      setPhoneError(err?.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const menuItems = [
    {
      icon: "person-outline" as const,
      label: "Edit Profile",
      subtitle: "Update name and email",
      onPress: () => {
        setEditName(user?.name || "");
        setEditEmail(user?.email || "");
        setEditModalVisible(true);
      }
    },
    {
      icon: "call-outline" as const,
      label: "Update Phone Number",
      subtitle: user?.phone || "Not set",
      onPress: () => {
        setPhoneStep("enter");
        setNewPhone("");
        setOtpCode("");
        setPhoneError("");
        setPhoneModalVisible(true);
      }
    },
    {
      icon: "logo-google" as const,
      label: "Link Google Account",
      subtitle: user?.email ? `Linked: ${user.email}` : "Tap to connect Google",
      onPress: handleGoogleSignIn
    },
    {
      icon: "location-outline" as const,
      label: "Saved Addresses",
      subtitle: "Manage delivery addresses",
      onPress: () => navigation.navigate("Address", { selectMode: false })
    },
    {
      icon: "receipt-outline" as const,
      label: "Order History",
      onPress: () => navigation.navigate("Orders")
    },
    {
      icon: "star-outline" as const,
      label: "Loyalty Points",
      subtitle: `${user?.loyaltyPoints || 0} points`,
      onPress: () => Alert.alert("Loyalty Points", `You have ${user?.loyaltyPoints || 0} loyalty points.`)
    },
    {
      icon: "help-circle-outline" as const,
      label: "Help & Support",
      onPress: () => Alert.alert("Contact Us", "WhatsApp: +923007864177")
    },
    {
      icon: "information-circle-outline" as const,
      label: "About Us",
      onPress: () =>
        Alert.alert(
          "Karachi Naseeb Baryani & Pulao",
          "UCP Branch, Lahore\n\nAuthentic Karachi-style biryani and pulao prepared fresh daily with premium spices."
        )
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || "G"}</Text>
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
            <Text style={styles.userPhone}>{user?.phone || "No phone set"}</Text>
            {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
          {user?.phoneVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Dark Mode Toggle */}
        <View style={[styles.settingRow, { backgroundColor: colors.cardBg, marginHorizontal: 20, marginTop: 20, borderRadius: 18 }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name={theme === "dark" ? "moon" : "sunny-outline"} size={22} color={colors.primary} />
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuRow, idx < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  {item.subtitle && (
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }} numberOfLines={1}>{item.subtitle}</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>Naseeb Baryani App v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Full Name</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Email (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border, flex: 1 }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleSaveProfile}
                disabled={editLoading}
              >
                {editLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Phone Update Modal ─────────────────────────────────────────────── */}
      <Modal visible={phoneModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {phoneStep === "enter" ? "Update Phone Number" : "Verify New Phone"}
            </Text>

            {phoneError ? <Text style={styles.modalError}>⚠️ {phoneError}</Text> : null}

            {phoneStep === "enter" ? (
              <>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>New Phone Number</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="03001234567"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 12 }}>
                  An OTP will be sent to verify this number.
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                  Enter the 6-digit OTP sent to {newPhone}
                </Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg, letterSpacing: 6, textAlign: "center", fontSize: 20 }]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </>
            )}

            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border, flex: 1 }]}
                onPress={() => {
                  setPhoneModalVisible(false);
                  setPhoneStep("enter");
                  setPhoneError("");
                }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={phoneStep === "enter" ? handleRequestPhoneChange : handleConfirmPhoneChange}
                disabled={phoneLoading}
              >
                {phoneLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {phoneStep === "enter" ? "Send OTP" : "Verify"}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === "android" ? 40 : 0 },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  pageTitle: { fontFamily: "Poppins-Bold", fontSize: 22, fontWeight: "700" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
  },
  avatarCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  userName: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  userPhone: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  userEmail: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  verifiedText: { color: "#16A34A", fontSize: 10, fontWeight: "700", marginLeft: 4 },
  settingRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16,
  },
  settingLabel: { fontSize: 14, fontWeight: "600", marginLeft: 12 },
  menuCard: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 18,
    elevation: 2, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 16, paddingHorizontal: 18,
  },
  menuLabel: { fontSize: 14, fontWeight: "500" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginHorizontal: 20, marginTop: 24, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1.5, gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
  versionText: { textAlign: "center", fontSize: 11, marginTop: 20 },
  // Modal styles
  modalOverlay: {
    flex: 1, justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 20, fontFamily: "Poppins-Bold" },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 14, padding: 12,
    fontSize: 15, marginBottom: 14,
  },
  modalBtn: {
    paddingVertical: 14, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  modalError: { color: "#DC2626", fontSize: 13, marginBottom: 12 },
});
