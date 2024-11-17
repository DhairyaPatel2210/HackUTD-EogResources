import axios from 'axios';
import { SERVER_URI } from '@/contants/env';
import { getAuthToken, removeAuthToken } from '@/lib/localStorage';
import { useCurrentUser } from '../zustand/useCurrentUser';

export const useAxios = () => {

    const logoutAction = useCurrentUser((state) => state.logout);

    const axiosInstance = axios.create({
        baseURL: SERVER_URI
    });

    axiosInstance.interceptors.request.use((config) => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    });

    axiosInstance.interceptors.response.use((response) => response, (error) => {
        if (error.response.status === 401) {
            removeAuthToken();
            logoutAction();
        }
        return Promise.reject(error);
    });

    return { axiosInstance };
};