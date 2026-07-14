import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  Alert
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useCart } from "../../contexts/CartContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function CartScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { items, addItem, removeItem, clearCart, totalPrice, itemCount } = useCart();

  const deliveryFee = totalPrice >= 500 ? 0 : 100;
  const grandTotal = totalPrice + deliveryFee;

  const handleClearCart = () => {
    Alert.alert("Clear Cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearCart();
        }
      }
    ]);
  };

  const handleCheckout = () => {
    if (itemCount === 0) {
      Alert.alert("Empty Cart", "Add some items first.");
      return;
    }
    navigation.navigate("Checkout");
  };

  if (itemCount === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Your Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Cart is Empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Browse our menu and add some delicious biryani!
          </Text>
          <TouchableOpacity
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("Explore")}
          >
            <Text style={styles.browseBtnText}>Browse Menu →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Your Cart</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 200 }}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
            <View style={[styles.itemImage, { backgroundColor: colors.background }]}>
              {item.menuItem.imageUrl ? (
                <Image source={{ uri: item.menuItem.imageUrl }} style={styles.itemImg} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 28 }}>🍛</Text>
              )}
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.menuItem.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                Rs. {item.menuItem.price}
              </Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => removeItem(item.menuItem.id)}
                >
                  <Ionicons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    addItem(item.menuItem);
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.lineTotal, { color: colors.textPrimary }]}>
              Rs. {item.menuItem.price * item.quantity}
            </Text>
          </View>
        )}
      />

      {/* Summary + Checkout footer */}
      <View style={[styles.footer, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Subtotal</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>Rs. {totalPrice}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Delivery Fee</Text>
          <Text style={{ color: deliveryFee === 0 ? colors.success : colors.textPrimary, fontSize: 13, fontWeight: "600" }}>
            {deliveryFee === 0 ? "FREE" : `Rs. ${deliveryFee}`}
          </Text>
        </View>
        {deliveryFee === 0 && (
          <Text style={{ color: colors.success, fontSize: 11, fontStyle: "italic", marginBottom: 6 }}>
            ✓ Free delivery on orders Rs. 500+
          </Text>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Total</Text>
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "700" }}>Rs. {grandTotal}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={handleCheckout}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    fontSize: 22,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImg: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 14,
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  checkoutBtn: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
