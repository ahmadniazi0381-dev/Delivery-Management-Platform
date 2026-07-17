import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, Modal, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ItemDetailBottomSheetProps {
  item: MenuItem;
  visible: boolean;
  onClose: () => void;
}

export default function ItemDetailBottomSheet({ item, visible, onClose }: ItemDetailBottomSheetProps) {
  const { addItem } = useCart();
  const { colors } = useTheme();
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity((q) => q + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem(item, quantity);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.cardBg }]}>
          {/* Header handle bar */}
          <View style={styles.handleBar} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Food Image */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="fast-food-outline" size={60} color="#FFFFFF" />
              </View>
            )}

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.price, { color: colors.primary }]}>Rs. {item.price}</Text>
              </View>

              {/* Rating + Prep time */}
              <View style={styles.metaRow}>
                <View style={styles.rating}>
                  <Ionicons name="star" size={16} color="#D97706" />
                  <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{item.rating || '4.8'}</Text>
                </View>
                <View style={styles.dot} />
                <View style={styles.prepTime}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.preparationTime || 20} mins prep
                  </Text>
                </View>
                {item.isSpicy && (
                  <>
                    <View style={styles.dot} />
                    <View style={styles.spicyBadge}>
                      <Ionicons name="flame" size={14} color="#DC2626" />
                      <Text style={styles.spicyText}>Spicy</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Description */}
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {item.description || 'Authentic Karachi spices cooked fresh over coal. Served piping hot with complimentary mint raita.'}
              </Text>

              {/* Ingredients / Badges */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ingredients & Details</Text>
                <View style={styles.tagGrid}>
                  <View style={[styles.tag, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.tagText, { color: colors.textPrimary }]}>🌾 Basmati Rice</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.tagText, { color: colors.textPrimary }]}>🍗 Fresh Halal Meat</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.tagText, { color: colors.textPrimary }]}>🌶️ Karachi Masala</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
            {/* Quantity Selector */}
            <View style={[styles.qtySelector, { backgroundColor: colors.inputBg }]}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement}>
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement}>
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Add to Cart CTA */}
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAddToCart}>
              <Text style={styles.addBtnText}>Add to Cart (Rs. {item.price * quantity})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 10, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#E8D5BC',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 250,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  prepTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  spicyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  spicyText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8D5BC',
    marginHorizontal: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1.5,
    gap: 16,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 8,
  },
  qtyBtn: {
    padding: 8,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    textAlign: 'center',
    minWidth: 30,
  },
  addBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
