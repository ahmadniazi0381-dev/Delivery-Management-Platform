import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { OrderService } from "../../services/order.service";
import { Ionicons } from "@expo/vector-icons";

export default function RiderProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const orders = await OrderService.getOrders();
        const done = orders.filter((o) => o.status === "DELIVERED");
        setTotalRuns(done.length);
      } catch (err) {
        console.warn("Failed to retrieve profile stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const showVehicleDetails = () => {
    Alert.alert(
      "Vehicle Information 🏍️",
      "Model: Honda CG 125 (2025)\nPlate No: LES-7890\nType: Motorcycle\nStatus: Registered & Verified",
      [{ text: "OK" }]
    );
  };

  const showPayoutDetails = () => {
    Alert.alert(
      "Bank / Payout Settings 🏦",
      "Receiving Bank: Habib Bank Limited (HBL)\nAccount Name: Naseeb Rider Account\nStatus: Auto-settlement active (weekly on Monday)",
      [{ text: "OK" }]
    );
  };

  const stats = [
    { label: "Total Runs", value: loading ? "..." : String(totalRuns), icon: "bicycle-outline" },
    { label: "Avg Rating", value: "4.9 ⭐", icon: "star-outline" },
    { label: "Role Status", value: "ONLINE", icon: "checkmark-circle-outline" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={{ alignItems: "center", marginTop: 60, marginBottom: 28 }}>
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6 }}>
          <Text style={{ fontSize: 36, color: "#fff", fontWeight: "800", fontFamily: "Poppins-Bold" }}>
            {user?.name ? user.name[0].toUpperCase() : "R"}
          </Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, fontFamily: "Poppins-Bold" }}>
          {user?.name || "Delivery Partner"}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{user?.phone}</Text>
        <View style={{ backgroundColor: "rgba(16,185,129,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#10b981" }}>CERTIFIED DELIVERY HERO</Text>
        </View>
      </View>

      {/* Stats Board */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
        {stats.map((stat) => (
          <View key={stat.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4 }}>
            <Ionicons name={stat.icon as any} size={22} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 6 }}>{stat.value}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: "center", marginTop: 2 }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings Options */}
      <View style={{ marginBottom: 24 }}>
        <TouchableOpacity
          onPress={showVehicleDetails}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name="car-outline" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: "700" }}>Vehicle Details</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Honda CG 125 • LES-7890</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={showPayoutDetails}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name="wallet-outline" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: "700" }}>Bank / Payment Info</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Habib Bank Limited (HBL)</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Alert.alert("Support 📞", "For live dispatcher support, please call +92 300 1234567.", [{ text: "OK" }])}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: "700" }}>Help & Support</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Contact admin dispatch hub</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={logout}
        style={{ backgroundColor: "rgba(239,68,68,0.06)", borderRadius: 16, padding: 16, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.15)" }}
      >
        <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 15 }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
