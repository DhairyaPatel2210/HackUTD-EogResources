import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import SpinnerIcon from '@/assets/icons/spinner.svg?react';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('', {
    variants: {
        size: {
            'sm': 'size-[1rem]',
            'md': 'size-[1.5rem]'
        }
    },
    defaultVariants: {
        size: 'md'
    }
});

export const Spinner = forwardRef(({ size, className, ...props }, ref) => {
    return (
        <SpinnerIcon
            className={cn('animate-spin', spinnerVariants({ size }), className)}
            ref={ref}
            {...props}
        />
    );
});