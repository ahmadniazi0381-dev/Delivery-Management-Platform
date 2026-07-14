import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";
import { Address } from "../../types";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
const SHOP_LAT = 31.4475531;
const SHOP_LNG = 74.2690347;

export default function AddressScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isSelectMode = route?.params?.selectMode === true;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [latitude, setLatitude] = useState<number>(SHOP_LAT);
  const [longitude, setLongitude] = useState<number>(SHOP_LNG);
  const [isDefault, setIsDefault] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const mapRef = useRef<MapView>(null);

  const defaultRegion = useMemo(() => ({
    latitude: latitude || SHOP_LAT,
    longitude: longitude || SHOP_LNG,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  }), [latitude, longitude]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !GOOGLE_MAPS_KEY) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadSuggestions() {
      setLoadingSuggestions(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${GOOGLE_MAPS_KEY}&input=${encodeURIComponent(
          searchQuery
        )}&components=country:pk&types=address`;
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();
        if (!active) return;
        if (data.status === "OK") {
          setSuggestions(data.predictions || []);
        } else {
          setSuggestions([]);
        }
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoadingSuggestions(false);
      }
    }

    const timeout = setTimeout(loadSuggestions, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  const fetchAddresses = async () => {
    setLoading(true);
    setError("");
    try {
      const res: any = await apiGet("/addresses");
      if (Array.isArray(res?.data)) {
        setAddresses(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load saved addresses.");
    } finally {
      setLoading(false);
    }
  };

  const startNewAddress = () => {
    setEditingId(null);
    setLabel("Home");
    setAddressLine("");
    setLatitude(SHOP_LAT);
    setLongitude(SHOP_LNG);
    setSearchQuery("");
    setIsDefault(false);
    setShowForm(true);
    setSuccess("");
    setError("");
  };

  const openEditAddress = (address: Address) => {
    setEditingId(address.id);
    setLabel(address.label);
    setAddressLine(address.addressLine);
    setLatitude(address.latitude);
    setLongitude(address.longitude);
    setSearchQuery(address.addressLine);
    setIsDefault(address.isDefault);
    setShowForm(true);
    setSuccess("");
    setError("");
  };

  const selectAddress = (address: Address) => {
    if (isSelectMode) {
      navigation.navigate("Checkout", { selectedAddressId: address.id });
      return;
    }
    setSuccess("Selected address for this session.");
    setAddressLine(address.addressLine);
    setLatitude(address.latitude);
    setLongitude(address.longitude);
    setLabel(address.label);
    setIsDefault(address.isDefault);
    setShowForm(true);
  };

  const saveAddress = async () => {
    if (!addressLine.trim()) {
      setError("Address line is required.");
      return;
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      setError("Valid coordinates are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        label: label.trim() || "Home",
        addressLine: addressLine.trim(),
        latitude,
        longitude,
        isDefault,
      };

      const res: any = editingId
        ? await apiPut(`/addresses/${editingId}`, payload)
        : await apiPost("/addresses", payload);

      if (res?.success) {
        await fetchAddresses();
        setSuccess(editingId ? "Address updated." : "Address saved.");
        setShowForm(false);
      } else {
        setError(res?.error || "Unable to save address.");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to save address.");
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (id: string) => {
    Alert.alert("Delete address", "Remove this saved address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiDelete(`/addresses/${id}`);
            await fetchAddresses();
            setSuccess("Address deleted.");
          } catch {
            setError("Failed to delete address.");
          }
        },
      },
    ]);
  };

  const toggleDefault = async (address: Address) => {
    try {
      await apiPut(`/addresses/${address.id}/default`, {});
      await fetchAddresses();
      setSuccess("Default address updated.");
    } catch {
      setError("Failed to set default address.");
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    if (!GOOGLE_MAPS_KEY) return;
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?key=${GOOGLE_MAPS_KEY}&place_id=${encodeURIComponent(
        placeId
      )}&fields=formatted_address,geometry`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK" && data.result?.geometry?.location) {
        setAddressLine(data.result.formatted_address || "");
        setLatitude(data.result.geometry.location.lat);
        setLongitude(data.result.geometry.location.lng);
        setSearchQuery(data.result.formatted_address || "");
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: data.result.geometry.location.lat,
              longitude: data.result.geometry.location.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            },
            500
          );
        }
        setSuggestions([]);
      }
    } catch {
      // ignore
    }
  };

  const updateLocationFromMap = (coords: { latitude: number; longitude: number }) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
  };

  const renderSuggestion = (item: any) => (
    <TouchableOpacity
      key={item.place_id}
      style={[styles.suggestionRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={() => fetchPlaceDetails(item.place_id)}
    >
      <Ionicons name="location-outline" size={18} color={colors.primary} />
      <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.topBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}> 
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} /> 
        </TouchableOpacity> 
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Saved Addresses</Text> 
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {error ? (
          <View style={[styles.banner, { backgroundColor: "#FEE2E2" }]}>
            <Text style={{ color: "#B91C1C" }}>{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={[styles.banner, { backgroundColor: "#DCFCE7" }]}>
            <Text style={{ color: "#166534" }}>{success}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={startNewAddress}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Add New Address</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Saved Addresses</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : addresses.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No saved addresses yet.</Text>
          ) : (
            addresses.map((address) => (
              <View key={address.id} style={[styles.addressCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <TouchableOpacity style={styles.addressSelectRow} onPress={() => selectAddress(address)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>{address.label}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={2}>{address.addressLine}</Text>
                    {address.isDefault ? <Text style={{ color: colors.primary, marginTop: 2, fontSize: 12 }}>Default address</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.addressActions}>
                  <TouchableOpacity style={[styles.smallButton, { borderColor: colors.primary }]} onPress={() => openEditAddress(address)}>
                    <Text style={[styles.smallButtonText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallButton, { borderColor: colors.error }]} onPress={() => removeAddress(address.id)}>
                    <Text style={[styles.smallButtonText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallButton, { borderColor: colors.primary }]} onPress={() => toggleDefault(address)}>
                    <Text style={[styles.smallButtonText, { color: colors.primary }]}>Default</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {showForm && (
          <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Address details</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Label (Home, Work, Other)"
              placeholderTextColor={colors.textMuted}
              value={label}
              onChangeText={setLabel}
            />

            <View style={[styles.input, { padding: 0, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.input, { minHeight: 44, paddingHorizontal: 12, borderWidth: 0 }]}
                placeholder="Search address"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>
            {loadingSuggestions && <ActivityIndicator color={colors.primary} style={{ marginTop: 6 }} />}
            {suggestions.length > 0 && (
              <View style={[styles.suggestions, { backgroundColor: colors.cardBg, borderColor: colors.border }]}> 
                {suggestions.map((item) => renderSuggestion(item))}
              </View>
            )}

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Address line"
              placeholderTextColor={colors.textMuted}
              value={addressLine}
              onChangeText={setAddressLine}
              multiline
            />
            <View style={styles.row}> 
              <TextInput
                style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Latitude"
                placeholderTextColor={colors.textMuted}
                value={latitude?.toString() || ""}
                onChangeText={(value) => setLatitude(parseFloat(value) || SHOP_LAT)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Longitude"
                placeholderTextColor={colors.textMuted}
                value={longitude?.toString() || ""}
                onChangeText={(value) => setLongitude(parseFloat(value) || SHOP_LNG)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={{ color: colors.textPrimary, fontSize: 14 }}>Set as default address</Text>
              <TouchableOpacity onPress={() => setIsDefault((prev) => !prev)} style={[styles.toggleSwitch, { backgroundColor: isDefault ? colors.primary : colors.border }]}> 
                <View style={[styles.toggleThumb, { left: isDefault ? 20 : 2 }]} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Tap the map to reposition the pin.</Text>
            <View style={styles.mapWrapper}> 
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                region={defaultRegion}
                onPress={(e) => updateLocationFromMap(e.nativeEvent.coordinate)}
              >
                <Marker
                  coordinate={{ latitude, longitude }}
                  draggable
                  onDragEnd={(e) => updateLocationFromMap(e.nativeEvent.coordinate)}
                  title="Delivery location"
                  description={addressLine || label}
                />
              </MapView>
            </View>

            <View style={styles.formActions}> 
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.border }]} onPress={() => setShowForm(false)}>
                <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={saveAddress} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  screenTitle: { fontSize: 20, fontWeight: "700" },
  banner: { padding: 12, borderRadius: 14, marginBottom: 16 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
  },
  actionButtonText: { color: "#FFFFFF", fontWeight: "700" },
  section: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  sectionSubtitle: { fontSize: 12, marginTop: 8 },
  addressCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  addressSelectRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addressLabel: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  addressActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  smallButtonText: { fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  smallInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    fontSize: 14,
  },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  toggleSwitch: {
    width: 42,
    height: 24,
    borderRadius: 14,
    justifyContent: "center",
  },
  toggleThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  mapWrapper: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1.5,
  },
  formActions: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  suggestions: { borderWidth: 1.5, borderRadius: 16, marginBottom: 12, maxHeight: 180, overflow: "hidden" },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1 },
  suggestionText: { flex: 1, fontSize: 13 },
});
