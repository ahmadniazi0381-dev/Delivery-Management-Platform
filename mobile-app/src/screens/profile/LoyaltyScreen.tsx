import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ProfileService, LoyaltyTransaction } from '../../services/profile.service';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoyaltyScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLoyalty() {
      try {
        const data = await ProfileService.getLoyaltyHistory();
        setHistory(data);
      } catch (err) {
        console.warn('Failed to load loyalty points:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLoyalty();
  }, []);

  const totalPoints = history.reduce((sum, item) => sum + item.points, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Loyalty Point Ledger</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={[styles.pointsCard, { backgroundColor: colors.primary }]}>
              <Ionicons name="gift-outline" size={32} color="#FFFFFF" />
              <Text style={styles.pointsLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.pointsValue}>{totalPoints} Points</Text>
              <Text style={styles.pointsHint}>Earn points on every Biryani portions ordered!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.transactionRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txReason, { color: colors.textPrimary }]}>{item.reason}</Text>
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.txPoints, { color: item.points >= 0 ? colors.success : colors.danger }]}>
                {item.points >= 0 ? `+${item.points}` : item.points}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No points earned or spent yet.</Text>
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
  pointsCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 1.5,
  },
  pointsValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 6,
  },
  pointsHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  txReason: {
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 13,
  },
});
