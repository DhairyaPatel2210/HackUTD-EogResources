import { create } from 'zustand';

export const useCurrentDevice = create((set) => ({
    // State
    currentDeviceId: '',
    injectionVolumeOverTimeData: [],
    valveOpeningPercentageOverTimeData: [],
    hydrationPeriodData: [],

    // Actions
    setCurrentDeviceId: (payload) => set(() => ({
        currentDeviceId: payload,
        injectionVolumeOverTimeData: [],
        valveOpeningPercentageOverTimeData: [],
        hydrationPeriodData: []
    })),
    setInjectionVolumeOverTimeData: (payload) => set((state) => ({
        injectionVolumeOverTimeData: [...state.injectionVolumeOverTimeData, ...payload]
    })),
    setValveOpeningPercentageOverTimeData: (payload) => set((state) => ({
        valveOpeningPercentageOverTimeData: [...state.valveOpeningPercentageOverTimeData, ...payload]
    })),
    setHydrationPeriodData: (payload) => set((state) => ({
        hydrationPeriodData: [...state.hydrationPeriodData, ...payload]
    }))
}));