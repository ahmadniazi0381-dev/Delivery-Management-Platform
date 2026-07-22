import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { ActivityIndicator, View, TextInput, TouchableOpacity, Alert, SafeAreaView, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { apiPut } from "../api/client";

import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import AdminTabs from "./AdminTabs";
import RiderTabs from "./RiderTabs";
import CheckoutScreen from "../screens/checkout/CheckoutScreen";
import OrderDetailScreen from "../screens/orders/OrderDetailScreen";
import OrderTrackingScreen from "../screens/orders/OrderTrackingScreen";
import AddressScreen from "../screens/address/AddressScreen";
import LoyaltyScreen from "../screens/profile/LoyaltyScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AdminMain: undefined;
  RiderMain: undefined;
  Checkout: { selectedAddressId?: string } | undefined;
  Address: { selectMode?: boolean } | undefined;
  OrderDetail: { orderId: string };
  OrderTracking: { orderId: string };
  Loyalty: undefined;
  Notifications: undefined;
  ForcedPasswordChange: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function ForcedPasswordChangeScreen() {
  const { user, login } = useAuth();
  const { colors } = useTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res: any = await apiPut("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (res.success && res.token) {
        Alert.alert("Success 🎉", "Your password has been changed successfully.");
        await login(res.token, { ...user!, mustChangePassword: false });
      } else {
        setError(res.error || "Failed to update password. Please check your current password.");
      }
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.error || data?.message || "Failed to change password. Make sure current password is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 }}>
      <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.border, shadowColor: colors.shadow, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 8, textAlign: "center" }}>
          Security Update required 🔒
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 24, textAlign: "center", lineHeight: 18 }}>
          As requested by our system administrator, you must update your password before accessing the Naseeb Biryani platform.
        </Text>

        {error ? (
          <View style={{ backgroundColor: colors.dangerBg, padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600", textAlign: "center" }}>{error}</Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 }}>Current Password</Text>
        <TextInput
          style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text, marginBottom: 16, fontSize: 15 }}
          placeholder="Enter current password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 }}>New Password (min. 8 characters)</Text>
        <TextInput
          style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text, marginBottom: 16, fontSize: 15 }}
          placeholder="Enter new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 }}>Confirm New Password</Text>
        <TextInput
          style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text, marginBottom: 24, fontSize: 15 }}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          onPress={handleUpdatePassword}
          disabled={loading}
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
            {loading ? "Updating..." : "Update Password & Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { token, user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const isRider = user?.role?.toUpperCase() === "RIDER";
  const isMustChange = !!user?.mustChangePassword;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            {isMustChange ? (
              <Stack.Screen name="ForcedPasswordChange" component={ForcedPasswordChangeScreen} />
            ) : isAdmin ? (
              <Stack.Screen name="AdminMain" component={AdminTabs} />
            ) : isRider ? (
              <Stack.Screen name="RiderMain" component={RiderTabs} />
            ) : (
              <Stack.Screen name="Main" component={MainTabs} />
            )}
            {/* Shared deep-link screens (only accessible to customers) */}
            {!isAdmin && !isRider && !isMustChange && (
              <>
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="Address" component={AddressScreen} />
                <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
              </>
            )}
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
