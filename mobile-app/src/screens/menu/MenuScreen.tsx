import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useMenu } from "../../hooks/useMenu";
import { MenuItem, Category } from "../../types";
import FoodCard from "../../components/FoodCard";
import { SkeletonFoodCard } from "../../components/SkeletonLoader";
import { Ionicons } from "@expo/vector-icons";
import ItemDetailBottomSheet from "./ItemDetailBottomSheet";

export default function MenuScreen({ route }: any) {
  const { colors } = useTheme();
  const initialCategoryId = route?.params?.categoryId || "";

  const { categories, items, loading, refetch } = useMenu();
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(initialCategoryId);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Filters state
  const [spicyOnly, setSpicyOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    filterItems();
  }, [activeCategory, search, items, spicyOnly, featuredOnly, inStockOnly]);

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
    if (spicyOnly) {
      result = result.filter((i) => i.isSpicy);
    }
    if (featuredOnly) {
      result = result.filter((i) => i.isFeatured);
    }
    if (inStockOnly) {
      result = result.filter((i) => i.isAvailable);
    }
    setFilteredItems(result);
  };

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Menu Catalog</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search catalog..."
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

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, spicyOnly && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setSpicyOnly(!spicyOnly)}
        >
          <Ionicons name="flame" size={14} color={spicyOnly ? '#fff' : colors.primary} />
          <Text style={[styles.filterChipText, { color: spicyOnly ? '#fff' : colors.textPrimary }]}>Spicy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, featuredOnly && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setFeaturedOnly(!featuredOnly)}
        >
          <Ionicons name="star" size={14} color={featuredOnly ? '#fff' : colors.primary} />
          <Text style={[styles.filterChipText, { color: featuredOnly ? '#fff' : colors.textPrimary }]}>Featured</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, inStockOnly && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setInStockOnly(!inStockOnly)}
        >
          <Ionicons name="checkmark-circle" size={14} color={inStockOnly ? '#fff' : colors.primary} />
          <Text style={[styles.filterChipText, { color: inStockOnly ? '#fff' : colors.textPrimary }]}>Available</Text>
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <View style={styles.categoryRow}>
        <FlatList
          data={[{ id: "", name: "All Items" }, ...categories]}
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
        <FlatList
          data={[1, 2, 3, 4]}
          numColumns={2}
          keyExtractor={(item) => String(item)}
          contentContainerStyle={{ padding: 8 }}
          renderItem={() => <SkeletonFoodCard />}
        />
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelectItem(item)} activeOpacity={0.9}>
              <FoodCard item={item} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No items match your preferences.
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Try toggling the search query or filter chips.
              </Text>
            </View>
          }
        />
      )}

      {selectedItem && (
        <ItemDetailBottomSheet
          item={selectedItem}
          visible={!!selectedItem}
          onClose={() => setSelectedItem(null)}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FAF0E0',
    gap: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    paddingVertical: 8,
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
