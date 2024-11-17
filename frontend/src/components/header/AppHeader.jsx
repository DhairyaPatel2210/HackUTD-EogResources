import { useCurrentUser } from '@/hooks/zustand/useCurrentUser';
import { Logout } from './Logout';
import WordMark from '@/assets/brand/wordmark.svg?react';

export const AppHeader = () => {

    const firstName = useCurrentUser((state) => state.firstName);
    const lastName = useCurrentUser((state) => state.lastName);

    return (
        <div className='flex flex-row items-center border-b h-14 px-2 w-full'>
            <div className='flex flex-row items-center prose flex-grow'>
                <h3 className='my-0'>Welcome, {firstName} {lastName}</h3>
            </div>
            <WordMark className='w-1/12' />
            <div className='flex flex-row items-center justify-end flex-grow'>
                <Logout />
            </div>
        </div>
    );
};