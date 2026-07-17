import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../contexts/ThemeContext';
import { OrderService, OrderDetail } from '../../services/order.service';
import { Ionicons } from '@expo/vector-icons';

export default function OrderTrackingScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { colors } = useTheme();
  const { isConnected, subscribe, unsubscribe } = useSocket();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await OrderService.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.warn('Failed to load tracking details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!isConnected) return;

    const handleUpdate = (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : null);
      }
    };

    subscribe('order:updated', handleUpdate);
    subscribe('order:accepted', handleUpdate);
    subscribe('order:preparing', handleUpdate);
    subscribe('order:ready', handleUpdate);
    subscribe('order:delivered', handleUpdate);

    return () => {
      unsubscribe('order:updated', handleUpdate);
      unsubscribe('order:accepted', handleUpdate);
      unsubscribe('order:preparing', handleUpdate);
      unsubscribe('order:ready', handleUpdate);
      unsubscribe('order:delivered', handleUpdate);
    };
  }, [isConnected, orderId, subscribe, unsubscribe]);

  const handleCancelOrder = async () => {
    try {
      await OrderService.cancelOrder(orderId);
      setOrder((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
    } catch (err) {
      console.warn('Failed to cancel order:', err);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED':
      case 'PREPARING':
        return 1;
      case 'READY':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return -1;
    }
  };

  const steps = [
    { title: 'Order Submitted', desc: 'Awaiting restaurant approval' },
    { title: 'In the Kitchen', desc: 'Preparing Karachi spices' },
    { title: 'Piping Hot & Ready', desc: 'Waiting for rider assignment' },
    { title: 'Out for Delivery', desc: 'Rider is on their way' },
    { title: 'Delivered', desc: 'Enjoy Naseeb Biryani!' },
  ];

  const currentStep = getStatusStepIndex(order?.status || 'PENDING');

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Live Handoff Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Estimated Handoff Countdown */}
        <View style={[styles.etaCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
          <Text style={styles.etaTime}>
            {order?.status === 'DELIVERED' ? 'Arrived!' : order?.status === 'CANCELLED' ? 'Cancelled' : '20-35 Mins'}
          </Text>
          <Text style={styles.etaStatus}>Order #{order?.id.slice(-6).toUpperCase()} · Status: {order?.status}</Text>
        </View>

        {/* Visual Timeline Steps */}
        <View style={[styles.timelineCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.iconColumn}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isDone || isActive ? colors.primary : colors.border,
                        borderColor: isActive ? '#fff' : 'transparent',
                        borderWidth: isActive ? 2 : 0,
                      },
                    ]}
                  >
                    {isDone && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  {idx < steps.length - 1 && (
                    <View
                      style={[
                        styles.connector,
                        { backgroundColor: idx < currentStep ? colors.primary : colors.border },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.contentColumn}>
                  <Text
                    style={[
                      styles.stepTitle,
                      {
                        color: isActive ? colors.primary : isDone ? colors.textPrimary : colors.textMuted,
                        fontWeight: isActive || isDone ? '700' : '500',
                      },
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Row */}
        {order?.status === 'PENDING' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
            <Text style={styles.cancelText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    padding: 20,
  },
  etaCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  etaLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  etaTime: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 6,
  },
  etaStatus: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  iconColumn: {
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 3,
    height: 48,
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 14,
  },
  stepDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  cancelBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
