import { useCallback } from 'react';
import { useCurrentUser } from '../zustand/useCurrentUser';
import { removeAuthToken } from '@/lib/localStorage';

export const useLogout = () => {

    const logoutAction = useCurrentUser((state) => state.logout);

    const onLogout = useCallback(() => {
        removeAuthToken();
        logoutAction();
    }, []);

    return {
        onLogout
    };
};