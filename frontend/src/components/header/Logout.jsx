import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/AlertDialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/Button';
import { useLogout } from '@/hooks/auth/useLogout';

export const Logout = () => {

    const { onLogout } = useLogout();

    return (
        <AlertDialog>
            <AlertDialogTrigger className={cn(buttonVariants({ variant: 'outline' }))}>
                Logout
            </AlertDialogTrigger>
            <AlertDialogContent className='w-1/3'>
                <AlertDialogTitle>Logout</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to log out? Your session will end, and you’ll need to log in again to continue.</AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(buttonVariants({ variant: 'destructive' }))}
                        onClick={onLogout}
                    >
                        Logout
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};