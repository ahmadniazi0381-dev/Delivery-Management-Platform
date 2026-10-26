const fs = require("fs");
const path = require("path");

function readEnvValue(key) {
  if (process.env[key]) {
    return process.env[key].trim();
  }
  const envPath = path.resolve(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return "";
  }
  const content = fs.readFileSync(envPath, "utf-8");
  const match = content.match(new RegExp(`^${key}=([\s\S]+)$`, "m"));
  return match ? match[1].trim().replace(/['"]/g, "") : "";
}

const googleMapsApiKey = readEnvValue("EXPO_PUBLIC_GOOGLE_MAPS_KEY");

module.exports = {
  name: "Food Delivery Platform",
  slug: "food-delivery",
  shortName: "Food Delivery",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FFF8F0",
  },
  plugins: ["expo-font", "expo-status-bar"],
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "We need your location to calculate delivery distance.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Allow Food Delivery Platform to use your location for delivery distance calculation.",
    },
    ...(googleMapsApiKey
      ? {
          config: {
            googleMaps: {
              apiKey: googleMapsApiKey,
            },
          },
        }
      : {}),
  },
  android: {
    package: "com.fooddelivery.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundColor: "#FFF8F0",
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    ...(googleMapsApiKey
      ? {
          config: {
            googleMaps: {
              apiKey: googleMapsApiKey,
            },
          },
        }
      : {}),
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "21044275-4558-436d-90f7-62ac53d4c59b",
    },
  },
};
