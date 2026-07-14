import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeColors = () => {
    switch (status) {
      case "PENDING":
        return { bg: "#FEF3C7", text: "#D97706" }; // Amber
      case "ACCEPTED":
      case "PREPARING":
        return { bg: "#FFEDD5", text: "#EA580C" }; // Orange
      case "READY":
      case "OUT_FOR_DELIVERY":
        return { bg: "#DBEAFE", text: "#2563EB" }; // Blue
      case "DELIVERED":
        return { bg: "#DCFCE7", text: "#16A34A" }; // Green
      case "CANCELLED":
      case "REJECTED":
      default:
        return { bg: "#FEE2E2", text: "#DC2626" }; // Red
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
