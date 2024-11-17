import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback, useState } from 'react';
import { useCurrentUser } from '../zustand/useCurrentUser';
import { useAxios } from '../axios/useAxios';
import { setAuthToken } from '@/lib/localStorage';

const formSchema = z.object({
    email: z.string()
        .email({ message: 'Invalid email format' })
        .min(1, { message: 'Email is required' }),
    password: z.string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .max(128, { message: 'Password must not exceed 128 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' })
        .regex(/[@$!%*?&]/, { message: 'Password must contain at least one special character' })
});

export const useLoginForm = () => {

    const loginAction = useCurrentUser((state) => state.login);
    const { axiosInstance } = useAxios();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: 'onSubmit',
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = useCallback(async (values) => {
        try {
            setLoading(true);
            console.table(values);

            const response = await axiosInstance.post('/login', values);

            setAuthToken(response.data.token);
            loginAction({
                firstName: response.data.first_name,
                lastName: response.data.last_name
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        form,
        loading,
        onSubmit
    };
};