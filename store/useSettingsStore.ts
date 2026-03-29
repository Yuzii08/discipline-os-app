import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  notifs: boolean;
  dataSync: boolean;
  setNotifs: (enabled: boolean) => void;
  setDataSync: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifs: true,
      dataSync: true,
      setNotifs: (notifs) => set({ notifs }),
      setDataSync: (dataSync) => set({ dataSync }),
    }),
    {
      name: 'discipline_os_settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
