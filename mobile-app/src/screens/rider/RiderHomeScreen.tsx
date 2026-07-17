import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSocket } from "../../hooks/useSocket";
import { OrderService } from "../../services/order.service";
import { apiPut } from "../../api/client";
import { Order } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function RiderHomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isConnected, subscribe, unsubscribe } = useSocket();

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [earningsToday, setEarningsToday] = useState(0);

  const fetchRiderDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await OrderService.getOrders();
      // Filter active orders assigned to this rider
      const active = orders.filter(
        (o) =>
          o.status !== "DELIVERED" &&
          o.status !== "CANCELLED" &&
          o.status !== "REJECTED"
      );
      setActiveOrders(active);

      // Compute earnings from delivered orders
      const deliveredToday = orders.filter((o) => o.status === "DELIVERED");
      const totalEarnings = deliveredToday.reduce((sum, o) => sum + (o.deliveryCharge || 60), 0);
      setEarningsToday(totalEarnings);
    } catch (err) {
      console.warn("Failed to load rider dashboard", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up socket listeners for real-time order alerts
  useEffect(() => {
    fetchRiderDashboard();

    // Listen for new order assignment
    const handleNewAssignment = (data: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("New Run Assigned! 📦", "A new delivery has been assigned to you.");
      fetchRiderDashboard();
    };

    const handleOrderUpdate = () => {
      fetchRiderDashboard();
    };

    subscribe("order:assigned", handleNewAssignment);
    subscribe("order:updated", handleOrderUpdate);

    return () => {
      unsubscribe("order:assigned", handleNewAssignment);
      unsubscribe("order:updated", handleOrderUpdate);
    };
  }, [subscribe, unsubscribe, fetchRiderDashboard]);

  const handleToggleOnline = async (val: boolean) => {
    setOnline(val);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await apiPut(`/owner/riders/${user?.id}/status`, {
        status: val ? "ACTIVE" : "INACTIVE",
      });
    } catch (err) {
      console.warn("Failed to update online status", err);
    }
  };

  const handleCall = (phone?: string | null) => {
    if (!phone) {
      Alert.alert("Error", "Customer phone number not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = (order: Order) => {
    if (!order.address || !order.address.latitude || !order.address.longitude) {
      // Fallback search with address text
      const query = encodeURIComponent(order.address?.addressLine || "");
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      return;
    }

    const lat = order.address.latitude;
    const lng = order.address.longitude;
    const scheme = Platform.select({ ios: "maps:0,0?q=", android: "geo:0,0?q=" });
    const latLng = `${lat},${lng}`;
    const label = encodeURIComponent(`Customer Address: ${order.customer?.name || "Order"}`);
    
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleStatusTransition = async (orderId: string, currentStatus: string) => {
    let nextStatus = "ACCEPTED";
    if (currentStatus === "ACCEPTED") nextStatus = "PREPARING";
    else if (currentStatus === "PREPARING") nextStatus = "READY";
    else if (currentStatus === "READY") nextStatus = "OUT_FOR_DELIVERY";
    else if (currentStatus === "OUT_FOR_DELIVERY") nextStatus = "DELIVERED";

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Update Run",
      `Progress this delivery run to ${nextStatus.replace(/_/g, " ")}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              setLoading(true);
              await apiPut(`/owner/orders/${orderId}/status`, { status: nextStatus });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await fetchRiderDashboard();
            } catch (err) {
              Alert.alert("Error", "Failed to update run status");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "#EF4444";
      case "ACCEPTED": return "#3B82F6";
      case "PREPARING": return "#F59E0B";
      case "READY": return "#10B981";
      case "OUT_FOR_DELIVERY": return "#8B5CF6";
      default: return colors.textSecondary;
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      {/* Top Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 50 }}>
        <View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: "Poppins-Medium" }}>RIDER GATEWAY</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, fontFamily: "Poppins-Bold" }}>
            {user?.name || "Delivery Partner"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: online ? "#10b981" : "#ef4444" }} />
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{online ? "Active" : "Offline"}</Text>
          <Switch value={online} onValueChange={handleToggleOnline} trackColor={{ true: colors.primary }} />
        </View>
      </View>

      {/* Connection Indicator */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20, backgroundColor: isConnected ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", padding: 10, borderRadius: 12 }}>
        <Ionicons name={isConnected ? "wifi" : "wifi-outline"} size={16} color={isConnected ? "#10b981" : "#ef4444"} />
        <Text style={{ fontSize: 12, color: isConnected ? "#10b981" : "#ef4444", fontWeight: "600" }}>
          {isConnected ? "Connected to Live Dispatcher Server" : "Disconnected. Reconnecting..."}
        </Text>
      </View>

      {/* Stats Board */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: "Poppins-SemiBold" }}>ACTIVE RUNS</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.primary, marginTop: 4 }}>
            {activeOrders.length}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: "Poppins-SemiBold" }}>DELIVERY COMMISSIONS</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#10b981", marginTop: 4 }}>
            Rs. {earningsToday}
          </Text>
        </View>
      </View>

      {/* Active Runs Listing */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, fontFamily: "Poppins-Bold" }}>
          Current Deliveries
        </Text>
        <TouchableOpacity onPress={fetchRiderDashboard} style={{ padding: 4 }}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : activeOrders.length === 0 ? (
        <View style={{ padding: 40, alignItems: "center", backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="bicycle" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 14 }}>No assignments found.</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
            New delivery assignments will appear here automatically. Keep the app open.
          </Text>
        </View>
      ) : (
        activeOrders.map((order) => (
          <View key={order.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontWeight: "800", color: colors.text, fontSize: 15 }}>
                #{order.id.slice(-6).toUpperCase()}
              </Text>
              <View style={{ backgroundColor: `${getStatusColor(order.status)}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: getStatusColor(order.status) }}>
                  {order.status.replace(/_/g, " ")}
                </Text>
              </View>
            </View>

            {/* Customer Details */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 15, marginBottom: 4 }}>
                {order.customer?.name || "Valued Customer"}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                📍 {order.address?.addressLine || "Address not provided"}
              </Text>
            </View>

            {/* Order Items */}
            <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 12, marginBottom: 16 }}>
              {order.orderItems?.map((item, index) => (
                <Text key={index} style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                  • {item.quantity}x <Text style={{ fontWeight: "600" }}>{item.itemName}</Text>
                </Text>
              ))}
            </View>

            {/* Call / Navigate / Action row */}
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => handleCall(order.customer?.phone)}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.border, paddingVertical: 10, borderRadius: 10 }}
              >
                <Ionicons name="call-outline" size={16} color={colors.text} />
                <Text style={{ fontWeight: "600", fontSize: 13, color: colors.text }}>Call Client</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigate(order)}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.border, paddingVertical: 10, borderRadius: 10 }}
              >
                <Ionicons name="map-outline" size={16} color={colors.text} />
                <Text style={{ fontWeight: "600", fontSize: 13, color: colors.text }}>Navigate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusTransition(order.id, order.status)}
                style={{ flex: 1.2, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>Update Run</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
