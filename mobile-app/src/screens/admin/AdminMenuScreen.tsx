import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Platform,
  Alert
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { apiGet, apiPut } from "../../api/client";
import { MenuItem, Category } from "../../types";
import { Ionicons } from "@expo/vector-icons";

export default function AdminMenuScreen() {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  const fetchData = async () => {
    try {
      const [catsRes, menuRes]: any = await Promise.all([
        apiGet("/owner/categories"),
        apiGet("/owner/menu-items")
      ]);
      if (catsRes?.success && catsRes.data) setCategories(catsRes.data);
      if (menuRes?.success && menuRes.data) setItems(menuRes.data);
    } catch {
      // Stub fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleAvailable = async (itemId: string, currentVal: boolean) => {
    try {
      const res: any = await apiPut(`/owner/menu-items/${itemId}`, {
        isAvailable: !currentVal
      });
      if (res?.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isAvailable: !currentVal } : i))
        );
      } else {
        Alert.alert("Error", res?.error || "Failed to update item availability.");
      }
    } catch {
      Alert.alert("Error", "Could not toggle availability.");
    }
  };

  const getFilteredItems = () => {
    if (!activeCategory) return items;
    return items.filter((i) => i.categoryId === activeCategory);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Menu Management</Text>
      </View>

      {/* Categories Row */}
      <View style={styles.categoriesRow}>
        <FlatList
          data={[{ id: "", name: "All" }, ...categories]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyExtractor={(item) => item.id || "all"}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[
                styles.pill,
                {
                  backgroundColor: activeCategory === cat.id ? colors.primary : colors.cardBg,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: activeCategory === cat.id ? "#FFFFFF" : colors.textPrimary }
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={getFilteredItems()}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[styles.menuItemCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>Rs. {item.price}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                  {item.description || "No description provided."}
                </Text>
              </View>

              <View style={styles.toggleBlock}>
                <Text style={{ color: item.isAvailable ? colors.success : colors.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
                  {item.isAvailable ? "AVAILABLE" : "SOLD OUT"}
                </Text>
                <Switch
                  value={item.isAvailable}
                  onValueChange={() => handleToggleAvailable(item.id, item.isAvailable)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}
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
  categoriesRow: {
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    marginRight: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  menuItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  itemName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    fontWeight: "700",
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  toggleBlock: {
    alignItems: "center",
    marginLeft: 12,
  },
});
