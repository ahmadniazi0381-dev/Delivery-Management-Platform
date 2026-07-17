import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useCart } from "../../contexts/CartContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function CartScreen({ navigation }: any) {
  const { colors } = useTheme();
  const {
    items,
    addItem,
    removeItem,
    clearCart,
    totalPrice,
    itemCount,
    deliveryFee,
    discountAmount,
    total,
    couponCode,
    applyCoupon,
    removeCoupon,
    specialInstructions,
    setSpecialInstructions,
    selectedDeliveryType,
    setSelectedDeliveryType,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [notesInput, setNotesInput] = useState(specialInstructions);

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

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    const success = await applyCoupon(promoInput.trim());
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Coupon applied successfully!");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Invalid or expired coupon code.");
    }
  };

  const handleCheckout = () => {
    if (itemCount === 0) {
      Alert.alert("Empty Cart", "Add some items first.");
      return;
    }
    // Save instructions notes
    setSpecialInstructions(notesInput);
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
          <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 280 }} showsVerticalScrollIndicator={false}>
        {/* Cart items list */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {items.map((item) => (
            <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
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
          ))}
        </View>

        {/* Special Instructions Box */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Special Instructions</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="e.g. Please make it spicy, or bring change for Rs. 1000..."
            placeholderTextColor={colors.textMuted}
            value={notesInput}
            onChangeText={setNotesInput}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Delivery Options Selector */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Delivery Tier</Text>
          <View style={styles.deliveryTiers}>
            <TouchableOpacity
              style={[
                styles.tierCard,
                { backgroundColor: colors.cardBg, borderColor: selectedDeliveryType === 'STANDARD' ? colors.primary : colors.border }
              ]}
              onPress={() => setSelectedDeliveryType('STANDARD')}
            >
              <Ionicons name="bicycle-outline" size={24} color={selectedDeliveryType === 'STANDARD' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tierTitle, { color: colors.textPrimary }]}>Standard</Text>
              <Text style={[styles.tierSub, { color: colors.textSecondary }]}>25-35 Mins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tierCard,
                { backgroundColor: colors.cardBg, borderColor: selectedDeliveryType === 'PRIORITY' ? colors.primary : colors.border }
              ]}
              onPress={() => setSelectedDeliveryType('PRIORITY')}
            >
              <Ionicons name="flash-outline" size={24} color={selectedDeliveryType === 'PRIORITY' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tierTitle, { color: colors.textPrimary }]}>Priority</Text>
              <Text style={[styles.tierSub, { color: colors.textSecondary }]}>15-20 Mins</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo code box */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Promo Coupon</Text>
          {couponCode ? (
            <View style={[styles.promoAppliedRow, { backgroundColor: colors.cardBg, borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.promoCodeText, { color: colors.textPrimary }]}>{couponCode} Applied</Text>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputRow}>
              <TextInput
                style={[styles.promoInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter Code (e.g. WELCOME10)"
                placeholderTextColor={colors.textMuted}
                value={promoInput}
                onChangeText={setPromoInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={[styles.applyPromoBtn, { backgroundColor: colors.primary }]} onPress={handleApplyPromo}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Summary + Checkout footer */}
      <View style={[styles.footer, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Subtotal</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>Rs. {totalPrice}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Delivery Fee</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>Rs. {deliveryFee}</Text>
        </View>
        {discountAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={{ color: colors.success, fontSize: 13 }}>Discount Applied</Text>
            <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>- Rs. {discountAmount}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Total</Text>
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "700" }}>Rs. {total}</Text>
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
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  notesInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 13,
    height: 80,
    textAlignVertical: "top",
  },
  deliveryTiers: {
    flexDirection: "row",
    gap: 12,
  },
  tierCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  tierSub: {
    fontSize: 11,
    marginTop: 2,
  },
  promoInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  promoInput: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  applyPromoBtn: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  promoAppliedRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 8,
  },
  promoCodeText: {
    flex: 1,
    fontSize: 13,
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
