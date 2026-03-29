"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
require("react-native-url-polyfill/auto");
var supabase_js_1 = require("@supabase/supabase-js");
var SecureStore = require("expo-secure-store");
var react_native_1 = require("react-native");
var supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
var supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Custom storage adapter for SecureStore
var ExpoSecureStoreAdapter = {
    getItem: function (key) {
        return SecureStore.getItemAsync(key);
    },
    setItem: function (key, value) {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: function (key) {
        SecureStore.deleteItemAsync(key);
    },
};
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        storage: react_native_1.Platform.OS === 'web' ? localStorage : ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
