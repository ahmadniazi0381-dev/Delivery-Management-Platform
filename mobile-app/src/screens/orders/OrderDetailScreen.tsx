import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { apiGet, SOCKET_BASE_URL } from "../../api/client";
import { Order } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import { Ionicons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";

const STATUS_STEPS = ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function OrderDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchOrder();
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res: any = await apiGet(`/orders/${orderId}`);
      if (res?.data) setOrder(res.data);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    try {
      const socket = io(SOCKET_BASE_URL, { transports: ["websocket"] });
      socket.on("order:status", (data: { orderId: string; status: string }) => {
        if (data.orderId === orderId) {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
        }
      });
      socketRef.current = socket;
    } catch {}
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
  };

  const getStepIndex = (status: string) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : -1;
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "REJECTED";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Order ID & Status */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={[styles.orderIdLabel, { color: colors.textMuted }]}>ORDER</Text>
              <Text style={[styles.orderId, { color: colors.textPrimary }]}>#{order.id.slice(-8).toUpperCase()}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📍 Order Progress</Text>
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const stepLabels: Record<string, string> = {
                PENDING: "Order Placed",
                ACCEPTED: "Accepted by Kitchen",
                PREPARING: "Being Prepared",
                READY: "Ready for Pickup",
                OUT_FOR_DELIVERY: "Out for Delivery",
                DELIVERED: "Delivered! 🎉"
              };
              const stepIcons: Record<string, string> = {
                PENDING: "⏳",
                ACCEPTED: "✅",
                PREPARING: "🍳",
                READY: "📦",
                OUT_FOR_DELIVERY: "🛵",
                DELIVERED: "🎉"
              };

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineDotCol}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isCompleted ? colors.primary : colors.border,
                          width: isCurrent ? 14 : 10,
                          height: isCurrent ? 14 : 10,
                          borderRadius: isCurrent ? 7 : 5
                        }
                      ]}
                    />
                    {idx < STATUS_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: idx < currentStepIdx ? colors.primary : colors.border }
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        {
                          color: isCompleted ? colors.textPrimary : colors.textMuted,
                          fontWeight: isCurrent ? "700" : "500"
                        }
                      ]}
                    >
                      {stepIcons[step]} {stepLabels[step]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {isCancelled && (
          <View style={[styles.card, { backgroundColor: "#FEE2E2", marginTop: 16 }]}>
            <Text style={{ color: "#DC2626", fontWeight: "700", fontSize: 14, textAlign: "center" }}>
              ❌ This order was {order.status === "CANCELLED" ? "cancelled" : "rejected"}.
            </Text>
          </View>
        )}

        {/* Order Items */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🍽️ Items Ordered</Text>
          {order.orderItems?.map((oi, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={[styles.itemQty, { color: colors.primary }]}>{oi.quantity}x</Text>
              <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                {oi.itemName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Rs. {oi.lineTotal}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💰 Payment Summary</Text>
          <View style={styles.payRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Subtotal</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13 }}>Rs. {order.subtotal}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Delivery</Text>
            <Text style={{ color: order.deliveryCharge === 0 ? colors.success : colors.textPrimary, fontSize: 13 }}>
              {order.deliveryCharge === 0 ? "FREE" : `Rs. ${order.deliveryCharge}`}
            </Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.payRow}>
              <Text style={{ color: colors.success, fontSize: 13 }}>Discount</Text>
              <Text style={{ color: colors.success, fontSize: 13 }}>-Rs. {order.discountAmount}</Text>
            </View>
          )}
          <View style={[styles.payRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 6 }]}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Total</Text>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "700" }}>Rs. {order.total}</Text>
          </View>
          <View style={[styles.payRow, { marginTop: 8 }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Payment Method</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "600" }}>{order.paymentMethod}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {order.address && (
          <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📍 Delivery Address</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>{order.address.label}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{order.address.addressLine}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  pageTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    padding: 18,
    borderRadius: 18,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 40,
  },
  timelineDotCol: {
    width: 24,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 12,
  },
  timelineLabel: {
    fontSize: 13,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  itemQty: {
    width: 28,
    fontSize: 13,
    fontWeight: "700",
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    marginRight: 8,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
});
