import { useCallback } from 'react';
import { useCurrentUser } from '../zustand/useCurrentUser';

export const useLogout = () => {

    const logoutAction = useCurrentUser((state) => state.logout);

    const onLogout = useCallback(() => {
        logoutAction();
    }, []);

    return {
        onLogout
    };
};