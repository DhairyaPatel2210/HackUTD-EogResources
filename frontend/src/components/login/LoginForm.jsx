import { useLoginForm } from '@/hooks/login/useLoginForm';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export const LoginForm = () => {

    const { form, loading, onSubmit } = useLoginForm();

    return (
        <Form {...form}>
            <form
                className='flex flex-col justify-center gap-5'
                onSubmit={form.handleSubmit(onSubmit)}
            >
                <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => {
                        return (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input
                                        className='w-full'
                                        placeholder='Email Address'
                                        disabled={loading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => {
                        return (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        className='w-full'
                                        placeholder='Password'
                                        type='password'
                                        disabled={loading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                <Button
                    disabled={loading}
                    className='w-full'
                >
                    {loading ? <Spinner /> : 'Login'}
                </Button>
            </form>
        </Form>
    );
};