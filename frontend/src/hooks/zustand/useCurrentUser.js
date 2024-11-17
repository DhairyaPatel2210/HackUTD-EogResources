import { create } from 'zustand';

const initialState = {
    isAuthenticated: false,
    firstName: 'John',
    lastName: 'Wick'
};

export const useCurrentUser = create((set) => ({
    // State
    ...initialState,

    // Actions
    login: (payload) => set(() => ({
        isAuthenticated: true,
        ...payload
    })),
    logout: () => set(() => initialState)
}));