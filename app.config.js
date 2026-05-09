let appJsonConfig = null;

try {
  ({ expo: appJsonConfig } = require("./app.json"));
} catch (_error) {
  appJsonConfig = null;
}

const fallbackConfig = {
  name: "smart-school-erp",
  slug: "smart-school-erp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/AppIcon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
  },
  extra: {},
};

module.exports = ({ config } = {}) => {
  const baseConfig = config ?? appJsonConfig ?? fallbackConfig;

  const configuredApiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    baseConfig?.extra?.apiUrl;

  const android = {
    ...baseConfig.android,
    package: process.env.EXPO_ANDROID_PACKAGE || "com.aaqibmir.schoolerp",
  };

  const ios = {
    ...baseConfig.ios,
    bundleIdentifier: process.env.EXPO_IOS_BUNDLE_ID || "com.aaqibmir.schoolerp",
  };

  return {
    ...baseConfig,
    android,
    ios,
    extra: {
      ...baseConfig.extra,
      apiUrl: configuredApiUrl || "https://api.smartschoolerp.co.in",
      eas: {
        projectId: "e5c2c6c8-afba-4e63-af80-bf6596eb2f34",
      },
    },
  };
};
