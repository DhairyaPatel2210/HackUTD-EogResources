import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';
import { Home } from '@/pages/Home';
import { AppPath } from '@/contants/AppPath';
import { PublicLayout } from '../layouts/PublicLayout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';

const createRouter = () => {
    return createBrowserRouter(
        createRoutesFromElements(
            <>
                <Route path='/' element={<AuthenticatedLayout />} >
                    <Route index element={<Home />} />
                </Route>
                <Route path='/' element={<PublicLayout />} >
                    <Route path={AppPath.Login} element={<Login />} />
                    <Route path={AppPath.Signup} element={<Signup />} />
                </Route>
            </>
        )
    );
};

export const AppRouter = () => {
    return <RouterProvider router={createRouter()} />;
};