import { AppPath } from '@/contants/AppPath';
import { useCurrentUser } from '@/hooks/zustand/useCurrentUser';
import { Navigate, Outlet } from 'react-router-dom';

export const PublicLayout = () => {
    const isAuthenticated = useCurrentUser((state) => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to={AppPath.Home} />;
    }

    return (
        <div className='flex flex-row justify-center items-center w-screen h-screen'>
            <Outlet />
        </div>
    );
};