import { Card } from '@/components/ui/Card';
import { LoginForm } from '@/components/login/LoginForm';
import { Link } from 'react-router-dom';
import { AppPath } from '@/contants/AppPath';

export const Login = () => {
    return (
        <Card className='flex flex-col justify-center gap-3 p-5 prose w-8/12'>
            <div className='flex flex-col gap-2 justify-center'>
                <h1 className='my-0'>Login</h1>
                <p className='my-0 text-gray-500'>Welcome back! Please sign in to continue</p>
            </div>
            <LoginForm />
            <p className='text-sm self-center'>
                New here? <Link to={`/${AppPath.Signup}`}>Create an account</Link> to get started.
            </p>
        </Card>
    );
};