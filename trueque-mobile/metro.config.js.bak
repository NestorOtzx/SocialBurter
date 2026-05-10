const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite a Metro empaquetar archivos WebAssembly (necesario para expo-sqlite en web)
config.resolver.assetExts.push('wasm');

module.exports = config;
