/**
 * @file src/components/ui/Card.tsx
 * @description Card wrapper component with border and optional glow variants.
 */

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'accent' | 'gold-glow';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'default', children, ...props }, ref) => {
        const baseStyles = `
            rounded-[14px] p-5 border
            transition-all duration-200
        `;

        const variants = {
            default: 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)]',
            accent: `
                bg-[rgba(234,179,8,0.06)] 
                border-[rgba(234,179,8,0.2)]
            `,
            'gold-glow': `
                bg-gradient-to-br from-[rgba(234,179,8,0.08)] to-[rgba(234,179,8,0.02)]
                border-[rgba(234,179,8,0.2)]
            `,
        };

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
