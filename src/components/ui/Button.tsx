/**
 * @file src/components/ui/Button.tsx
 * @description Styled button component with multiple variants.
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'gold' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'ghost', size = 'md', children, ...props }, ref) => {
        const baseStyles = `
            inline-flex items-center justify-center gap-2
            font-mono font-medium rounded-lg
            border transition-all duration-150 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            whitespace-nowrap
        `;

        const variants = {
            gold: `
                bg-[#EAB308] text-[#0A0908] border-[#EAB308]
                hover:bg-[#FBBF24] hover:border-[#FBBF24]
            `,
            ghost: `
                bg-[rgba(255,255,255,0.06)] text-[#FAFAF9] border-[rgba(255,255,255,0.06)]
                hover:bg-[rgba(255,255,255,0.1)]
            `,
            danger: `
                bg-transparent text-[#EF4444] border-[rgba(239,68,68,0.2)]
                hover:bg-[rgba(239,68,68,0.1)]
            `,
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base rounded-xl',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
