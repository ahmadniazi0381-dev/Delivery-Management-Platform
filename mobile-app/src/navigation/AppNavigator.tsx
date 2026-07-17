import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            {isAdmin ? (
              <Stack.Screen name="AdminMain" component={AdminTabs} />
            ) : isRider ? (
              <Stack.Screen name="RiderMain" component={RiderTabs} />
            ) : (
              <Stack.Screen name="Main" component={MainTabs} />
            )}
            {/* Shared deep-link screens (only accessible to customers) */}
            {!isAdmin && !isRider && (
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
