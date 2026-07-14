import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const MOCK_ASSIGNED = [
  { id: "ord-201", customer: "Ahmed Raza", address: "House 12, Block A, UCP Housing", items: "1× Naseeb Special Biryani", amount: 420, distance: "1.2km", status: "out_for_delivery" },
  { id: "ord-202", customer: "Sara Khan", address: "Plot 7, Canal Road, Lahore", items: "2× Sada Pulao (Double)", amount: 700, distance: "2.1km", status: "ready" },
];

export default function RiderHomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 50 }}>
        <View>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>Welcome back 👋</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{user?.name?.split(" ")[0] || "Rider"}</Text>
        </View>
        <View style={{ backgroundColor: "#10b981", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Online</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Assigned", value: MOCK_ASSIGNED.length, bg: "#f59e0b" },
          { label: "Done Today", value: 3, bg: "#10b981" },
          { label: "Earnings", value: "Rs 140", bg: "#8b5cf6" },
        ].map(stat => (
          <View key={stat.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: stat.bg }}>{stat.value}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Assigned Orders */}
      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        Assigned Orders ({MOCK_ASSIGNED.length})
      </Text>

      {MOCK_ASSIGNED.map(order => (
        <View key={order.id} style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontWeight: "700", color: colors.text }}>#{order.id}</Text>
            <View style={{ backgroundColor: order.status === "out_for_delivery" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: order.status === "out_for_delivery" ? "#f59e0b" : "#3b82f6" }}>
                {order.status === "out_for_delivery" ? "Delivering" : "Ready to Pick"}
              </Text>
            </View>
          </View>
          <Text style={{ fontWeight: "600", color: colors.text, marginBottom: 4 }}>{order.customer}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>📍 {order.address}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10 }}>🍛 {order.items}</Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>📏 {order.distance}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Rs. {order.amount}</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: "#D97706", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>✓ Delivered</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
