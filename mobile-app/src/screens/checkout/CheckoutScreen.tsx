import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { apiGet, apiPost } from "../../api/client";
import { Address } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, Polyline } from "react-native-maps";

const SHOP_LAT = 31.4475531;
const SHOP_LNG = 74.2690347;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type PaymentMethod = "COD" | "JAZZCASH" | "EASYPAISA" | "CARD";
type DeliveryType = "STANDARD" | "PRIORITY";

interface PaymentMethodSetting {
  method: PaymentMethod;
  enabled: boolean;
}

interface DeliveryOption {
  enabled: boolean;
  fee: number | null;
  eta: string | null;
}

interface DeliveryOptions {
  standard: DeliveryOption;
  priority: DeliveryOption;
}

/** Reverse geocode lat/lng to a readable address string. Returns a short label like "Gulberg, Lahore" or null. */
async function reverseGeocodeLocation(lat: number, lng: number): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results && results.length > 0) {
      const r = results[0];
      const parts: string[] = [];
      if (r.street) parts.push(r.street);
      if (r.district) parts.push(r.district);
      if (r.city) parts.push(r.city);
      if (r.region && !parts.includes(r.region)) parts.push(r.region);
      return parts.length > 0 ? parts.join(", ") : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function CheckoutScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<PaymentMethod[]>(["COD", "CARD", "JAZZCASH", "EASYPAISA"]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Delivery settings from backend
  const [deliveryEligible, setDeliveryEligible] = useState<boolean | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("STANDARD");
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>({
    standard: { enabled: true, fee: 50, eta: "5-20 Minutes" },
    priority: { enabled: true, fee: 125, eta: "5-20 Minutes" },
  });

  const activeDeliveryCount = [deliveryOptions.standard.enabled, deliveryOptions.priority.enabled].filter(Boolean).length;

  const currentDeliveryFee = (() => {
    if (deliveryEligible !== true) return 0;
    if (deliveryType === "PRIORITY") return deliveryOptions.priority.fee ?? 125;
    return deliveryOptions.standard.fee ?? 50;
  })();

  const grandTotal = totalPrice + currentDeliveryFee;
  const mapRef = React.useRef<MapView>(null);
  const phoneReady = !!(user?.phone && user.phoneVerified);
  const canPlaceOrder = deliveryEligible !== false && enabledPaymentMethods.includes(paymentMethod) && phoneReady;

  useEffect(() => {
    fetchEnabledPaymentMethods();
    fetchAddresses().then((hasAddresses) => {
      if (!hasAddresses) {
        autoCaptureLocation();
      }
    });
  }, []);

  useEffect(() => {
    if (route?.params?.selectedAddressId && addresses.length > 0) {
      const selected = addresses.find((addr) => addr.id === route.params.selectedAddressId);
      if (selected) {
        setSelectedAddress(selected);
      }
    }
  }, [route?.params?.selectedAddressId, addresses]);

  useEffect(() => {
    if (selectedAddress) {
      const dist = haversineDistance(SHOP_LAT, SHOP_LNG, selectedAddress.latitude, selectedAddress.longitude);
      setDistanceKm(Math.round(dist * 10) / 10);

      // Query backend check-eligibility for single source of truth
      fetchEligibility(selectedAddress.latitude, selectedAddress.longitude);

      // Animate map to show both shop and user location
      if (mapRef.current) {
        const lat = selectedAddress.latitude;
        const lng = selectedAddress.longitude;
        const latDelta = Math.abs(SHOP_LAT - lat) * 2 + 0.015;
        const lngDelta = Math.abs(SHOP_LNG - lng) * 2 + 0.015;

        mapRef.current.animateToRegion(
          {
            latitude: (SHOP_LAT + lat) / 2,
            longitude: (SHOP_LNG + lng) / 2,
            latitudeDelta: Math.min(latDelta, 0.1),
            longitudeDelta: Math.min(lngDelta, 0.1),
          },
          1000
        );
      }
    }
  }, [selectedAddress]);

  const fetchEligibility = async (lat: number, lng: number) => {
    try {
      const res: any = await apiPost("/addresses/check-eligibility", {
        latitude: lat,
        longitude: lng
      });
      if (res?.success && res.data) {
        setDeliveryEligible(res.data.eligible);
        if (res.data.delivery) {
          setDeliveryOptions(res.data.delivery);
          // Auto select if only one is active
          if (!res.data.delivery.standard.enabled && res.data.delivery.priority.enabled) {
            setDeliveryType("PRIORITY");
          } else if (res.data.delivery.standard.enabled && !res.data.delivery.priority.enabled) {
            setDeliveryType("STANDARD");
          }
        }
      }
    } catch {
      // Fallback to offline radius calculation
      const dist = haversineDistance(SHOP_LAT, SHOP_LNG, lat, lng);
      setDeliveryEligible(dist <= 2.2);
    }
  };

  /** Reverse geocode and set a readable address — never expose raw coords to the customer. */
  const setLocationFromCoords = async (lat: number, lng: number, label: string) => {
    setDistanceKm(Math.round(haversineDistance(SHOP_LAT, SHOP_LNG, lat, lng) * 10) / 10);
    const readable = await reverseGeocodeLocation(lat, lng);
    setSelectedAddress({
      id: "current",
      label,
      addressLine: readable || "Unable to determine address",
      latitude: lat,
      longitude: lng,
      isDefault: false,
    });
    fetchEligibility(lat, lng);
  };

  const autoCaptureLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await setLocationFromCoords(loc.coords.latitude, loc.coords.longitude, "My Location");
    } catch {
      // Fail silently on auto-capture
    }
  };

  const fetchAddresses = async () => {
    try {
      const res: any = await apiGet("/addresses");
      if (res?.data && res.data.length > 0) {
        setAddresses(res.data);
        const defaultAddr = res.data.find((a: Address) => a.isDefault) || res.data[0];
        setSelectedAddress(defaultAddr);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchEnabledPaymentMethods = async () => {
    try {
      const res: any = await apiGet("/payments/methods");
      if (res?.success && Array.isArray(res.data)) {
        const enabled = res.data
          .filter((setting: PaymentMethodSetting) => setting.enabled)
          .map((setting: PaymentMethodSetting) => setting.method)
          .filter((method: PaymentMethod) => ["COD", "CARD", "JAZZCASH", "EASYPAISA"].includes(method));

        if (enabled.length > 0) {
          setEnabledPaymentMethods(enabled);
          setPaymentMethod((current) => (enabled.includes(current) ? current : enabled[0]));
        }
      }
    } catch {
      // Keep defaults if payment settings cannot be reached.
    }
  };

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required for delivery.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const readable = await reverseGeocodeLocation(loc.coords.latitude, loc.coords.longitude);
      if (readable) {
        await setLocationFromCoords(loc.coords.latitude, loc.coords.longitude, "My Location");
      } else {
        // FIX-ADDRESS-UX-003: Never show raw coords — show a friendly retry message
        Alert.alert(
          "Unable to determine address",
          "We could not find a readable address for your current location. Please try again or search manually.",
          [
            { text: "Retry", onPress: useCurrentLocation },
            { text: "Search Address", onPress: () => navigation.navigate("Address", { selectMode: true }) },
          ]
        );
      }
    } catch {
      Alert.alert("Error", "Unable to get location. Make sure GPS is enabled.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert("Select Address", "Please select a delivery address.");
      return;
    }
    if (!phoneReady) {
      Alert.alert(
        "Phone verification required",
        "Add and verify your phone number in Profile before placing an order."
      );
      return;
    }
    if (!deliveryEligible) {
      Alert.alert("Outside Range", "Delivery is only available within our configured branch zone.");
      return;
    }
    if (selectedAddress.addressLine === "Unable to determine address") {
      Alert.alert("Invalid Address", "Please use a valid address with a readable location.");
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((ci) => ({
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity
      }));

      const res: any = await apiPost("/checkout", {
        addressId: selectedAddress.id === "current" ? undefined : selectedAddress.id,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        addressLine: selectedAddress.addressLine,
        paymentMethod,
        deliveryType,
        specialInstructions: specialInstructions || undefined,
        items: orderItems
      });

      if (res?.success) {
        if (res.data?.flow === "ONLINE") {
          const redirectUrl = res.data.gatewayRedirect?.url;
          clearCart();
          if (redirectUrl) {
            try {
              const canOpen = await Linking.canOpenURL(redirectUrl);
              if (canOpen) {
                await Linking.openURL(redirectUrl);
              }
            } catch {
              // Non-blocking redirect attempt
            }
          }
          Alert.alert(
            "Payment Initiated",
            "Your online payment session has been created. Once payment is confirmed, your order will be processed.",
            [
              { text: "View Orders", onPress: () => navigation.navigate("Main") },
              { text: "OK", onPress: () => navigation.navigate("Main") }
            ]
          );
          return;
        }

        const orderId = res.data?.order?.id;
        if (!orderId) {
          Alert.alert("Error", "Order id was not returned.");
          return;
        }

        clearCart();
        Alert.alert("Order Placed! 🎉", "Your order has been sent to the kitchen.", [
          { text: "Track Order", onPress: () => navigation.navigate("OrderDetail", { orderId }) },
          { text: "OK", onPress: () => navigation.navigate("Main") }
        ]);
      } else {
        Alert.alert("Error", res?.error || "Failed to place order.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Could not place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods: { key: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "COD", label: "Cash on Delivery", icon: "cash-outline" },
    { key: "JAZZCASH", label: "JazzCash", icon: "phone-portrait-outline" },
    { key: "EASYPAISA", label: "Easypaisa", icon: "phone-portrait-outline" },
    { key: "CARD", label: "Credit/Debit Card", icon: "card-outline" }
  ];

  const visiblePaymentMethods = paymentMethods.filter((pm) => enabledPaymentMethods.includes(pm.key));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Delivery Address Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📍 Delivery Address</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          {loadingAddresses ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              {addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressOption,
                    {
                      borderColor: selectedAddress?.id === addr.id ? colors.primary : colors.border,
                      backgroundColor: selectedAddress?.id === addr.id ? `${colors.primary}10` : colors.cardBg
                    }
                  ]}
                  onPress={() => setSelectedAddress(addr)}
                >
                  <Ionicons
                    name={selectedAddress?.id === addr.id ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={selectedAddress?.id === addr.id ? colors.primary : colors.textMuted}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>{addr.label}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                      {addr.addressLine}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <TouchableOpacity style={[styles.locationBtn, { borderColor: colors.primary, flex: 1 }]} onPress={useCurrentLocation}>
                  <Ionicons name="navigate-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 8 }}>
                    Use Current Location
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.locationBtn, { borderColor: colors.primary, flex: 1 }]} onPress={() => navigation.navigate("Address", { selectMode: true })}>
                  <Ionicons name="list-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginLeft: 8 }}>
                    Saved Addresses
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {selectedAddress && (
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: (SHOP_LAT + selectedAddress.latitude) / 2,
                  longitude: (SHOP_LNG + selectedAddress.longitude) / 2,
                  latitudeDelta: Math.abs(SHOP_LAT - selectedAddress.latitude) * 2 + 0.015,
                  longitudeDelta: Math.abs(SHOP_LNG - selectedAddress.longitude) * 2 + 0.015,
                }}
              >
                <Marker
                  coordinate={{ latitude: SHOP_LAT, longitude: SHOP_LNG }}
                  title="Karachi Naseeb Baryani UCP"
                  description="Shop location"
                  pinColor="#D97706"
                />
                <Marker
                  coordinate={{ latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }}
                  title={selectedAddress.label}
                  description={selectedAddress.addressLine}
                  pinColor="#10B981"
                />
                <Polyline
                  coordinates={[
                    { latitude: SHOP_LAT, longitude: SHOP_LNG },
                    { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
                  ]}
                  strokeColor="#D97706"
                  strokeWidth={3}
                  lineDashPattern={[5, 5]}
                />
              </MapView>
            </View>
          )}

          {deliveryEligible !== null && (
            <View style={[styles.eligibilityBanner, { backgroundColor: deliveryEligible ? "#DCFCE7" : "#FEE2E2" }]}>
              <Ionicons
                name={deliveryEligible ? "checkmark-circle" : "close-circle"}
                size={18}
                color={deliveryEligible ? "#16A34A" : "#DC2626"}
              />
              <Text style={{ marginLeft: 8, color: deliveryEligible ? "#16A34A" : "#DC2626", fontSize: 12, fontWeight: "600", flex: 1 }}>
                {deliveryEligible
                  ? `Within delivery zone (${distanceKm} km from shop)`
                  : `Outside delivery zone (${distanceKm} km)`}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Options Selection */}
        {deliveryEligible === true && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>🛵 Delivery Speed</Text>
            <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
              {deliveryOptions.standard.enabled && (
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    {
                      borderColor: deliveryType === "STANDARD" ? colors.primary : colors.border,
                      backgroundColor: deliveryType === "STANDARD" ? `${colors.primary}10` : colors.cardBg
                    }
                  ]}
                  onPress={() => setDeliveryType("STANDARD")}
                >
                  <Ionicons name="bicycle-outline" size={20} color={deliveryType === "STANDARD" ? colors.primary : colors.textSecondary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.paymentLabel, { color: colors.textPrimary }]}>Standard Delivery</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{deliveryOptions.standard.eta || "5-20 Minutes"}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={{ color: "#16A34A", fontWeight: "700", marginRight: 10 }}>
                    {deliveryOptions.standard.fee === 0 ? "FREE" : `Rs. ${deliveryOptions.standard.fee}`}
                  </Text>
                  <Ionicons
                    name={deliveryType === "STANDARD" ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={deliveryType === "STANDARD" ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              )}
              {deliveryOptions.priority.enabled && (
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    {
                      borderColor: deliveryType === "PRIORITY" ? colors.primary : colors.border,
                      backgroundColor: deliveryType === "PRIORITY" ? `${colors.primary}10` : colors.cardBg
                    }
                  ]}
                  onPress={() => setDeliveryType("PRIORITY")}
                >
                  <Ionicons name="flash-outline" size={20} color={deliveryType === "PRIORITY" ? colors.primary : colors.textSecondary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.paymentLabel, { color: colors.textPrimary }]}>Priority Delivery</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{deliveryOptions.priority.eta || "5-20 Minutes"}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={{ color: "#D97706", fontWeight: "700", marginRight: 10 }}>
                    Rs. {deliveryOptions.priority.fee}
                  </Text>
                  <Ionicons
                    name={deliveryType === "PRIORITY" ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={deliveryType === "PRIORITY" ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Payment Method Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>💳 Payment Method</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          {visiblePaymentMethods.map((pm) => (
            <TouchableOpacity
              key={pm.key}
              style={[
                styles.paymentOption,
                {
                  borderColor: paymentMethod === pm.key ? colors.primary : colors.border,
                  backgroundColor: paymentMethod === pm.key ? `${colors.primary}10` : colors.cardBg
                }
              ]}
              onPress={() => setPaymentMethod(pm.key)}
            >
              <Ionicons name={pm.icon} size={20} color={paymentMethod === pm.key ? colors.primary : colors.textSecondary} />
              <Text style={[styles.paymentLabel, { color: colors.textPrimary, marginLeft: 10 }]}>{pm.label}</Text>
              <View style={{ flex: 1 }} />
              <Ionicons
                name={paymentMethod === pm.key ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={paymentMethod === pm.key ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>🧾 Order Summary</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
          {items.map((ci) => (
            <View key={ci.id} style={styles.summaryItem}>
              <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {ci.quantity}x {ci.menuItem.name}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Rs. {ci.menuItem.price * ci.quantity}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Subtotal</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>Rs. {totalPrice}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Delivery</Text>
            <Text style={{ color: currentDeliveryFee === 0 ? colors.success : colors.textPrimary, fontSize: 13, fontWeight: "600" }}>
              {currentDeliveryFee === 0 ? "FREE" : `Rs. ${currentDeliveryFee}`}
            </Text>
          </View>
          <View style={[styles.summaryItem, { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Total</Text>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "700" }}>Rs. {grandTotal}</Text>
          </View>
        </View>

        {!phoneReady && (
          <TouchableOpacity
            style={[styles.phoneGate, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={[styles.phoneGateText, { color: colors.textPrimary }]}>
              Phone verification is required to place orders. Tap here to add & verify your phone number in Profile.
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Place Order CTA */}
      <View style={[styles.footer, { backgroundColor: colors.cardBg, shadowColor: colors.shadow }]}>
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: canPlaceOrder ? colors.primary : colors.textMuted }]}
          onPress={handlePlaceOrder}
          disabled={loading || !canPlaceOrder}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.orderBtnText}>
                {phoneReady ? `Place Order - Rs. ${grandTotal}` : "Verify phone to order"}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </>
          )}
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
    fontSize: 18,
    fontWeight: "700",
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    borderStyle: "dashed",
  },
  eligibilityBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  phoneGate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 18,
  },
  phoneGateText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 10,
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
  orderBtn: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  orderBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  mapContainer: {
    height: 180,
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
});
