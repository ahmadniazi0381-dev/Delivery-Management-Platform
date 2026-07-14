import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Switch,
  ActivityIndicator,
  Alert
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, apiPut } from "../../api/client";
import { Ionicons } from "@expo/vector-icons";

export default function AdminSettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [openingTime, setOpeningTime] = useState("11:00 AM");
  const [closingTime, setClosingTime] = useState("11:00 PM");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res: any = await apiGet("/owner/settings");
      if (res?.success && res.data) {
        setAcceptingOrders(res.data.isAcceptingOrders ?? true);
        setOpeningTime(res.data.openingTime || "11:00 AM");
        setClosingTime(res.data.closingTime || "11:00 PM");
      }
    } catch {
      // Offline default
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccepting = async () => {
    try {
      const res: any = await apiPut("/owner/settings", {
        isAcceptingOrders: !acceptingOrders
      });
      if (res?.success) {
        setAcceptingOrders(!acceptingOrders);
      } else {
        Alert.alert("Error", res?.error || "Failed to update shop status.");
      }
    } catch {
      Alert.alert("Error", "Could not toggle shop status.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Logout from owner dashboard?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Shop Settings</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Shop Status Control */}
          <View style={[styles.statusCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Accepting Orders</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                Toggle off to stop accepting customer orders immediately.
              </Text>
            </View>
            <Switch
              value={acceptingOrders}
              onValueChange={handleToggleAccepting}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Shop Hours Section */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>🕒 Business Hours</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
            <View style={styles.infoRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Opening Time</Text>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{openingTime}</Text>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.03)", paddingTop: 10, marginTop: 10 }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Closing Time</Text>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{closingTime}</Text>
            </View>
          </View>

          {/* Theme Preference */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>🎨 Preferences</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow, padding: 16 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={22} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600", marginLeft: 10 }}>Dark Mode</Text>
              </View>
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Admin Info */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>👤 Logged In As</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow, padding: 16 }]}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>{user?.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{user?.phone} (Role: {user?.role})</Text>
          </View>

          {/* Logout */}
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  pageTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    fontWeight: "700",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  infoCard: {
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoVal: {
    fontSize: 14,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
