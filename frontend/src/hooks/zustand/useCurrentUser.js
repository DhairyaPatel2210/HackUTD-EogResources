import { create } from 'zustand';

export const useCurrentUser = create((set) => ({
    // State
    isAuthenticated: false,

    // Actions
    login: () => set(() => ({ isAuthenticated: true })),
    logout: () => set(() => ({ isAuthenticated: false }))
}));