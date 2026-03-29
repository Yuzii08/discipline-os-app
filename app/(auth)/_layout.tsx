import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#F9F7F2" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9F7F2' } }} />
    </>
  );
}
