import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { MenuItem } from "../types";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface FoodCardProps {
  item: MenuItem;
}

export default function FoodCard({ item }: FoodCardProps) {
  const { addItem } = useCart();
  const { colors } = useTheme();

  const handleAdd = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem(item);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
      {/* Food Image Area */}
      <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholderEmoji}>
            {item.name.toLowerCase().includes("pulao") ? "🍚" : "🍛"}
          </Text>
        )}
        {item.isSpicy && (
          <View style={styles.spicyBadge}>
            <Text style={styles.spicyText}>🌶️ Spicy</Text>
          </View>
        )}
      </View>

      {/* Food Details */}
      <View style={styles.details}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description || "Fresh and hot, prepared with special Karachi spices daily."}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>Rs. {item.price}</Text>
          
          {item.isAvailable ? (
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.outOfStock}>Sold Out</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 8,
    maxWidth: "48%", // 2 columns layout friendly
  },
  imageContainer: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  spicyBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(220, 26, 26, 0.9)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  spicyText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  details: {
    padding: 12,
  },
  title: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    fontWeight: "600",
  },
  desc: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    marginTop: 4,
    height: 32,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  price: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    fontWeight: "700",
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStock: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
  },
});
