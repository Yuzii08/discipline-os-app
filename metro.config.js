const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Required for lucide-react-native to resolve correctly with Metro
config.resolver.unstable_enablePackageExports = true;

// Fix: transform import.meta for web compatibility
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = withNativeWind(config, { input: './global.css' });
