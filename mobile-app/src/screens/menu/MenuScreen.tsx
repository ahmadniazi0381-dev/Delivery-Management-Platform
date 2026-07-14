import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { apiGet } from "../../api/client";
import { MenuItem, Category } from "../../types";
import FoodCard from "../../components/FoodCard";
import { Ionicons } from "@expo/vector-icons";

export default function MenuScreen({ route }: any) {
  const { colors } = useTheme();
  const initialCategoryId = route?.params?.categoryId || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(initialCategoryId);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    filterItems();
  }, [activeCategory, search, items]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const [catsRes, menuRes]: any = await Promise.all([
        apiGet("/menu/categories"),
        apiGet("/menu")
      ]);
      if (catsRes?.data) setCategories(catsRes.data);
      if (menuRes?.data) setItems(menuRes.data);
    } catch (err) {
      // Fallback stubs for offline
      setCategories([
        { id: "1", name: "Biryani", isActive: true, sortOrder: 1 },
        { id: "2", name: "Pulao", isActive: true, sortOrder: 2 },
        { id: "3", name: "Raita & Sides", isActive: true, sortOrder: 3 },
        { id: "4", name: "Drinks", isActive: true, sortOrder: 4 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let result = [...items];
    if (activeCategory) {
      result = result.filter((i) => i.categoryId === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
      );
    }
    setFilteredItems(result);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Menu</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search biryani, pulao..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category pills */}
      <View style={styles.categoryRow}>
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

      {/* Food grid */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
          renderItem={({ item }) => <FoodCard item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {search ? "No items match your search" : "No items in this category"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Try a different search or category filter
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
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  pageTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: "100%",
  },
  categoryRow: {
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    marginRight: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
});
