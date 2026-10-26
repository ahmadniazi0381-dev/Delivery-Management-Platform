import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useCart } from "../../contexts/CartContext";
import { MenuService, Banner } from "../../services/menu.service";
import { OrderService } from "../../services/order.service";
import { MenuItem, Category, Order } from "../../types";
import FoodCard from "../../components/FoodCard";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { itemCount } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const bannerRef = useRef<FlatList>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [cats, featured, bannerList, orders] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getFeaturedItems(),
        MenuService.getBanners(),
        user ? OrderService.getOrders() : Promise.resolve([]),
      ]);
      
      setCategories(cats);
      setFeaturedItems(featured);
      setBanners(bannerList);
      if (orders && orders.length > 0) {
        setRecentOrders(orders.slice(0, 2));
      }
    } catch (err) {
      console.warn("Failed to retrieve live catalog. Using fallback stubs.");
      setCategories([
        { id: "1", name: "Biryani", isActive: true, sortOrder: 1 },
        { id: "2", name: "Pulao", isActive: true, sortOrder: 2 },
        { id: "3", name: "Raita", isActive: true, sortOrder: 3 },
        { id: "4", name: "Drinks", isActive: true, sortOrder: 4 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! 🌞";
    if (hour < 18) return "Good afternoon! 🍛";
    return "Good evening! 🌙";
  };

  // Auto scroll for banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeBannerIndex + 1) % banners.length;
      setActiveBannerIndex(nextIndex);
      bannerRef.current?.scrollToIndex({ animated: true, index: nextIndex });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBannerIndex, banners]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: colors.cardBg }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || "Guest"}</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate("Cart")}>
          <Ionicons name="cart-outline" size={24} color={colors.primary} />
          {itemCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Delivery Radius Hint */}
        <View style={[styles.deliveryInfo, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={[styles.deliveryTitle, { color: colors.textPrimary }]}>Delivery Zone</Text>
            <Text style={[styles.deliverySubtitle, { color: colors.textSecondary }]}>We deliver within 2.2 km</Text>
          </View>
        </View>

        {/* Promo Slider Banner Carousel */}
        {banners.length > 0 && (
          <View style={styles.section}>
            <FlatList
              ref={bannerRef}
              data={banners}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={width - 48}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 24 }}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - 48));
                setActiveBannerIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={[styles.bannerCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
                  <View style={[styles.bannerInner, { backgroundColor: colors.primary }]}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>}
                  </View>
                </View>
              )}
            />
            {/* Carousel Dots */}
            <View style={styles.dotsContainer}>
              {banners.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    { backgroundColor: idx === activeBannerIndex ? colors.primary : colors.border },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Categories Tab selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Explore Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { borderColor: colors.border, backgroundColor: activeCategory === "" ? colors.primary : colors.cardBg }
              ]}
              onPress={() => {
                setActiveCategory("");
                navigation.navigate("Explore");
              }}
            >
              <Text style={[styles.categoryText, { color: activeCategory === "" ? "#FFFFFF" : colors.textPrimary }]}>
                🔥 All Items
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { borderColor: colors.border, backgroundColor: activeCategory === cat.id ? colors.primary : colors.cardBg }
                ]}
                onPress={() => {
                  setActiveCategory(cat.id);
                  navigation.navigate("Explore", { categoryId: cat.id });
                }}
              >
                <Text style={[styles.categoryText, { color: activeCategory === cat.id ? "#FFFFFF" : colors.textPrimary }]}>
                  🍛 {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Recommendations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Featured Picks 🔥</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ margin: 20 }} />
          ) : (
            <FlatList
              data={featuredItems}
              numColumns={2}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 8 }}
              renderItem={({ item }) => <FoodCard item={item} />}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", color: colors.textSecondary, margin: 20, fontStyle: "italic" }}>
                  Featured dishes will be loaded soon.
                </Text>
              }
            />
          )}
        </View>

        {/* Recent Orders Strip */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Orders</Text>
            {recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.recentOrderCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentOrderTitle, { color: colors.textPrimary }]}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={[styles.recentOrderDate, { color: colors.textSecondary }]}>
                    {new Date(order.placedAt).toLocaleDateString()} · Rs. {order.total}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Restaurant Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Food Delivery Platform</Text>
              <Text style={[styles.statusTime, { color: colors.textSecondary }]}>Opening hours: 11:00 AM - 11:00 PM</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={[styles.indicatorDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.indicatorText, { color: colors.success }]}>Open</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
  },
  userName: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    fontWeight: "700",
  },
  cartBtn: {
    padding: 8,
    borderRadius: 50,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  deliverySubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  bannerCard: {
    width: width - 48,
    marginLeft: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  bannerInner: {
    padding: 24,
    height: 130,
    justifyContent: "center",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    fontWeight: "700",
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  recentOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  recentOrderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentOrderDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusTime: {
    fontSize: 12,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
