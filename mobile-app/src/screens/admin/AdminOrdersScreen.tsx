import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { apiGet, apiPut } from "../../api/client";
import { Order } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import { Ionicons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const FILTER_TABS = ["ALL", "PENDING", "ACTIVE", "DELIVERED"];

export default function AdminOrdersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchOrders();
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const res: any = await apiGet("/owner/orders?limit=100");
      if (res?.success && res.data) {
        setOrders(res.data);
      }
    } catch {
      // Stub fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const connectSocket = async () => {
    try {
      const baseUrl = Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
      const token = await AsyncStorage.getItem("@naseeb_token");
      const socket = io(baseUrl, { transports: ["websocket"] });

      socket.on("connect", () => {
        if (token) socket.emit("admin:join", { token });
      });
      
      socket.on("order:new", (newOrder: Order) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOrders((prev) => [newOrder, ...prev]);
      });

      socket.on("order:status", (data: { orderId: string; status: string }) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
        );
      });

      socketRef.current = socket;
    } catch {}
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: string, action: "accept" | "reject" | "status", newStatus?: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      let endpoint = `/owner/orders/${orderId}/${action}`;
      let body: any = undefined;

      if (action === "status") {
        endpoint = `/owner/orders/${orderId}/status`;
        body = { status: newStatus };
      }

      const res: any = await apiPut(endpoint, body);
      if (res?.success) {
        // Optimistic state update or full refresh
        fetchOrders();
      } else {
        Alert.alert("Error", res?.error || "Failed to update order.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Could not update order.");
    }
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "PENDING":
        return orders.filter((o) => o.status === "PENDING");
      case "ACTIVE":
        return orders.filter((o) => ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status));
      case "DELIVERED":
        return orders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED" || o.status === "REJECTED");
      case "ALL":
      default:
        return orders;
    }
  };

  const renderActionButtons = (order: Order) => {
    if (order.status === "PENDING") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() => handleUpdateStatus(order.id, "accept")}
          >
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
            onPress={() => handleUpdateStatus(order.id, "reject")}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const nextActions: Record<string, { label: string; next: string }> = {
      ACCEPTED: { label: "Mark Preparing", next: "PREPARING" },
      PREPARING: { label: "Mark Ready", next: "READY" },
      READY: { label: "Out for Delivery", next: "OUT_FOR_DELIVERY" },
      OUT_FOR_DELIVERY: { label: "Mark Delivered", next: "DELIVERED" }
    };

    const action = nextActions[order.status];
    if (action) {
      return (
        <TouchableOpacity
          style={[styles.fullActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleUpdateStatus(order.id, "status", action.next)}
        >
          <Text style={styles.btnText}>{action.label}</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Order Management</Text>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.cardBg }]}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.textSecondary }
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={({ item: order }) => (
            <View style={[styles.orderCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.orderId, { color: colors.textPrimary }]}>
                    #{order.id.slice(-8).toUpperCase()}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {order.customer?.name || "Guest"} ({order.customer?.phone})
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              <View style={styles.itemsBlock}>
                {order.orderItems?.map((oi, idx) => (
                  <Text key={idx} style={[styles.itemText, { color: colors.textPrimary }]}>
                    {oi.quantity}x {oi.itemName}
                  </Text>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Method: <Text style={{ fontWeight: "700" }}>{order.paymentMethod}</Text>
                </Text>
                <Text style={[styles.priceText, { color: colors.primary }]}>Rs. {order.total}</Text>
              </View>

              {renderActionButtons(order)}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders found in this queue.</Text>
            </View>
          }
        />
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
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tabBtn: {
    paddingVertical: 12,
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  orderCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    fontWeight: "700",
  },
  itemsBlock: {
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
    paddingBottom: 8,
  },
  itemText: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceText: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fullActionBtn: {
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
  },
});
