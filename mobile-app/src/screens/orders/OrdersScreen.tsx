import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { apiGet } from "../../api/client";
import { Order } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import { Ionicons } from "@expo/vector-icons";

export default function OrdersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res: any = await apiGet("/orders");
      if (res?.data) {
        setOrders(res.data);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const isActive = (status: string) => {
    return ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(status);
  };

  const activeOrders = orders.filter((o) => isActive(o.status));
  const pastOrders = orders.filter((o) => !isActive(o.status));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order.id}
      style={[styles.orderCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}
      onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}
      activeOpacity={0.8}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderId, { color: colors.textMuted }]}>#{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(order.placedAt)}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.orderItems}>
        {order.orderItems?.slice(0, 3).map((oi, idx) => (
          <Text key={idx} style={[styles.orderItemText, { color: colors.textPrimary }]} numberOfLines={1}>
            {oi.quantity}x {oi.itemName}
          </Text>
        ))}
        {(order.orderItems?.length || 0) > 3 && (
          <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: "italic" }}>
            +{order.orderItems.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>Rs. {order.total}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 4 }}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>My Orders</Text>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {activeOrders.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>🔥 Active Orders</Text>
                {activeOrders.map(renderOrderCard)}
              </>
            )}

            {pastOrders.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: activeOrders.length > 0 ? 24 : 0 }]}>
                  📦 Past Orders
                </Text>
                {pastOrders.map(renderOrderCard)}
              </>
            )}

            {orders.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Orders Yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Place your first order from our delicious menu!
                </Text>
                <TouchableOpacity
                  style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate("Explore")}
                >
                  <Text style={styles.browseBtnText}>Browse Menu →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
      />
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
    fontSize: 22,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  orderCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 11,
    marginTop: 2,
  },
  orderItems: {
    marginTop: 12,
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 13,
    marginBottom: 2,
    fontWeight: "500",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    paddingTop: 10,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  browseBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  browseBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
