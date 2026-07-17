import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { OrderService } from "../../services/order.service";
import { Order } from "../../types";
import { Ionicons } from "@expo/vector-icons";

type TimeFilter = "TODAY" | "WEEK" | "ALL";

export default function RiderDeliveriesScreen() {
  const { colors } = useTheme();
  const [completed, setCompleted] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>("TODAY");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const orders = await OrderService.getOrders();
      const done = orders.filter((o) => o.status === "DELIVERED");
      setCompleted(done);
    } catch (err) {
      console.warn("Failed to load delivery history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getFilteredDeliveries = () => {
    if (filter === "ALL") return completed;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    return completed.filter((o) => {
      const placedTime = new Date(o.placedAt).getTime();
      if (filter === "TODAY") {
        return placedTime >= startOfToday;
      }
      if (filter === "WEEK") {
        return placedTime >= startOfWeek;
      }
      return true;
    });
  };

  const filteredDeliveries = getFilteredDeliveries();
  const totalEarnings = filteredDeliveries.reduce((sum, o) => sum + (o.deliveryCharge || 60), 0);
  const totalCashCollected = filteredDeliveries
    .filter((o) => o.paymentMethod === "COD")
    .reduce((sum, o) => sum + o.total, 0);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Title */}
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 50, marginBottom: 4, fontFamily: "Poppins-Bold" }}>
          Run History
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
          Track your past deliveries and earnings.
        </Text>

        {/* Interactive Period Filter Tabs */}
        <View style={{ flexDirection: "row", backgroundColor: colors.card, padding: 4, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
          {(["TODAY", "WEEK", "ALL"] as TimeFilter[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilter(type)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: filter === type ? colors.primary : "transparent",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: filter === type ? "#fff" : colors.textSecondary }}>
                {type === "TODAY" ? "Today" : type === "WEEK" ? "7 Days" : "All Time"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Earnings Stats Cards */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: "#10b981", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 }}>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" }}>EARNED ({filter})</Text>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 4 }}>Rs. {totalEarnings.toFixed(0)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#D97706", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 }}>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" }}>COD CASH COLLECTED</Text>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 4 }}>Rs. {totalCashCollected.toFixed(0)}</Text>
          </View>
        </View>

        {/* History List */}
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 20 }} />
        ) : filteredDeliveries.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center", backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="clipboard-outline" size={48} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: "600" }}>No completed runs in this period.</Text>
          </View>
        ) : (
          filteredDeliveries.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.9}
                onPress={() => toggleExpand(order.id)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 5,
                }}
              >
                {/* Header info */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontWeight: "800", color: colors.text }}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>5.0</Text>
                  </View>
                </View>

                {/* Customer */}
                <Text style={{ fontWeight: "700", color: colors.text, marginBottom: 2 }}>{order.customer?.name || "Valued Customer"}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>📍 {order.address?.addressLine || "Address"}</Text>

                {/* Collapsible item details */}
                {isExpanded && (
                  <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 12, marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 }}>ITEMS DELIVERED:</Text>
                    {order.orderItems?.map((oi, i) => (
                      <Text key={i} style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                        • {oi.quantity}x {oi.itemName} (Rs. {oi.unitPrice})
                      </Text>
                    ))}
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 6, flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>Payment Mode:</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{order.paymentMethod}</Text>
                    </View>
                  </View>
                )}

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {new Date(order.placedAt).toLocaleDateString()} {new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Order: Rs. {order.total}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#10b981" }}>+Rs. {order.deliveryCharge || 60}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
