import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback } from 'react';


const formSchema = z.object({
    firstName: z.string()
        .min(1, { message: 'First name is required' })
        .max(255, { message: 'First name must not exceed 50 characters' }),
    lastName: z.string()
        .min(1, { message: 'Last name is required' })
        .max(255, { message: 'Last name must not exceed 50 characters' }),
    email: z.string()
        .email({ message: 'Invalid email format' })
        .min(1, { message: 'Email is required' }),
    password: z.string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .max(128, { message: 'Password must not exceed 128 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' })
        .regex(/[@$!%*?&]/, { message: 'Password must contain at least one special character' }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"], 
});


export const useSignupForm = () => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: 'onSubmit',
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = useCallback((values) => {
        console.table(values);
    }, []);

    return {
        form,
        onSubmit
    };
};