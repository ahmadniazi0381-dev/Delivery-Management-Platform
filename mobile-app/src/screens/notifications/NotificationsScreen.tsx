import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handlePressNotification = async (item: NotificationItem) => {
    try {
      if (!item.read) {
        await NotificationService.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
      }
      // If notification has context order target
      if (item.type === 'ORDER_STATUS_UPDATE' || item.body.includes('Order')) {
        navigation.navigate('Orders');
      }
    } catch (err) {
      console.warn('Notification press handling failed:', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Alert Inbox</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={[styles.readAll, { color: colors.primary }]}>Read All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.itemRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: item.read ? 'transparent' : 'rgba(217,119,6,0.05)',
                },
              ]}
              onPress={() => handlePressNotification(item)}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={item.read ? 'mail-open-outline' : 'mail-unread-outline'}
                  size={20}
                  color={item.read ? colors.textSecondary : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: colors.textPrimary, fontWeight: item.read ? '600' : '800' },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={[styles.itemBody, { color: colors.textSecondary }]}>{item.body}</Text>
                <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
                Inbox is empty.
              </Text>
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
  readAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconContainer: {
    paddingTop: 2,
  },
  itemTitle: {
    fontSize: 14,
  },
  itemBody: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  itemDate: {
    fontSize: 10,
    color: '#9A7B6A',
    marginTop: 6,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
  },
  emptyText: {
    fontSize: 13,
  },
});
