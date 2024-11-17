import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import { AppPath } from '@/contants/AppPath';
import { SignupForm } from '@/components/signup/SignupForm';

export const Signup = () => {
    return (
        <Card className='flex flex-col justify-center gap-3 p-5 prose w-8/12'>
            <div className='flex flex-col gap-2 justify-center'>
                <h1 className='my-0'>Sign Up</h1>
                <p className='my-0 text-gray-500'>Create an account to get started</p>
            </div>
            <SignupForm />
            <p className='text-sm self-center'>
                Already a member? <Link to={`/${AppPath.Login}`}>Log in</Link> to continue
            </p>
        </Card>
    );
};