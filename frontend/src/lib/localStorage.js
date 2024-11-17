import { TOKEN_KEY } from '@/contants/env';

export const setAuthToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};