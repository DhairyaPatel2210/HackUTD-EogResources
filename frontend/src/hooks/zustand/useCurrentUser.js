import { create } from 'zustand';

export const useCurrentUser = create()((set) => ({
    // State
    isAuthenticated: true,
    firstName: 'John',
    lastName: 'Wick',

    // Actions
    login: (payload) => set(() => ({
        isAuthenticated: true,
        ...payload
    })),
    logout: () => set(() => ({ isAuthenticated: false }))
}));