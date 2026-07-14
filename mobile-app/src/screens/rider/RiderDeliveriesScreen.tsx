import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const HISTORY = [
  { id: "ord-190", customer: "Ali Hassan", address: "DHA Phase 6", amount: 350, completedAt: "Today, 1:10 PM", rating: 5 },
  { id: "ord-188", customer: "Fatima Malik", address: "Johar Town", amount: 560, completedAt: "Today, 11:45 AM", rating: 4 },
  { id: "ord-185", customer: "Usman Tariq", address: "Model Town", amount: 420, completedAt: "Today, 10:20 AM", rating: 5 },
  { id: "ord-180", customer: "Zara Ahmed", address: "Gulberg III", amount: 280, completedAt: "Yesterday, 6:30 PM", rating: 5 },
];

export default function RiderDeliveriesScreen() {
  const { colors } = useTheme();
  const totalEarnings = HISTORY.reduce((sum, o) => sum + o.amount * 0.1, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 50, marginBottom: 4 }}>Delivery History</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>Your completed deliveries</Text>

      {/* Summary Card */}
      <View style={{ backgroundColor: "#D97706", borderRadius: 16, padding: 20, marginBottom: 24, flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Total Earned Today</Text>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>Rs. {totalEarnings.toFixed(0)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Deliveries</Text>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>{HISTORY.length}</Text>
        </View>
      </View>

      {/* History List */}
      {HISTORY.map(order => (
        <View key={order.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ fontWeight: "700", color: colors.text }}>#{order.id}</Text>
            <View style={{ flexDirection: "row" }}>
              {Array(order.rating).fill(null).map((_, i) => (
                <Ionicons key={i} name="star" size={14} color="#f59e0b" />
              ))}
            </View>
          </View>
          <Text style={{ fontWeight: "600", color: colors.text, marginBottom: 2 }}>{order.customer}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>📍 {order.address}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{order.completedAt}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Order: Rs. {order.amount}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#10b981" }}>+Rs. {(order.amount * 0.1).toFixed(0)}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
