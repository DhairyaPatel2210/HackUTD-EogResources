import { AppPath } from '@/contants/AppPath';
import { useCurrentUser } from '@/hooks/zustand/useCurrentUser';
import { Navigate, Outlet } from 'react-router-dom';

export const AuthenticatedLayout = () => {
    const isAuthenticated = useCurrentUser((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to={AppPath.Login} />;
    }

    return (
        <Outlet />
    );
};