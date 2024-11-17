import { AppPath } from '@/contants/AppPath';
import { useCurrentUser } from '@/hooks/zustand/useCurrentUser';
import { Navigate, Outlet } from 'react-router-dom';
import { AppHeader } from '../header/AppHeader';

export const AuthenticatedLayout = () => {
    const isAuthenticated = useCurrentUser((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to={AppPath.Login} />;
    }

    return (
        <div className='grid grid-rows-[auto_1fr] w-screen h-screen'>
            <AppHeader />
            <Outlet />
        </div>
    );
};