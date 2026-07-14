import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function RiderProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const stats = [
    { label: "Total Deliveries", value: "142", icon: "bicycle-outline" },
    { label: "Avg Rating", value: "4.9 ⭐", icon: "star-outline" },
    { label: "This Month", value: "Rs. 2,800", icon: "cash-outline" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={{ alignItems: "center", marginTop: 60, marginBottom: 28 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 32, color: "#fff", fontWeight: "800" }}>R</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{user?.name || "Rider"}</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{user?.phone}</Text>
        <View style={{ backgroundColor: "rgba(16,185,129,0.1)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#10b981" }}>DELIVERY RIDER</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
        {stats.map(stat => (
          <View key={stat.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name={stat.icon as any} size={22} color="#D97706" />
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 6 }}>{stat.value}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: "center", marginTop: 2 }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings Options */}
      {[
        { label: "Notification Settings", icon: "notifications-outline" },
        { label: "Vehicle Details", icon: "car-outline" },
        { label: "Bank / Payment Info", icon: "wallet-outline" },
        { label: "Help & Support", icon: "help-circle-outline" },
      ].map(item => (
        <TouchableOpacity
          key={item.label}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
        >
          <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
          <Text style={{ flex: 1, fontSize: 15, color: colors.text, fontWeight: "500" }}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}

      {/* Logout */}
      <TouchableOpacity
        onPress={logout}
        style={{ backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}
      >
        <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 15 }}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
