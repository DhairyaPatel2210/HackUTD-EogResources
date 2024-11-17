import { Logout } from './Logout';

export const AppHeader = () => {
    return (
        <div className='flex flex-row justify-end items-center border-b h-14 px-2'>
            <Logout />
        </div>
    );
};