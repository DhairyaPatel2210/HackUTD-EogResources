import { useAxios } from '@/hooks/axios/useAxios';
import { getAuthToken } from '@/lib/localStorage';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from './zustand/useCurrentUser';

export const useApp = () => {
    const logoutAction = useCurrentUser((state) => state.logout);
    const loginAction = useCurrentUser((state) => state.login);
    const { axiosInstance } = useAxios();
    const [loading, setLoading] = useState(true);

    const validateToken = useCallback(async () => {
        const token = getAuthToken();

        if (!token) {
            logoutAction();
            setLoading(false);
            return;
        }

        try {
            const response = await axiosInstance.get('/validate');

            loginAction({
                firstName: response.data.first_name,
                lastName: response.data.last_name
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, logoutAction, loginAction]);

    useEffect(() => {
        validateToken();
    }, [validateToken]);

    return {
        loading
    };
};