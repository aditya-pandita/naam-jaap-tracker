/**
 * @file src/components/ui/ProgressBar.tsx
 * @description Linear progress bar component.
 */

interface ProgressBarProps {
    percent: number;
    className?: string;
}

export function ProgressBar({ percent, className = '' }: ProgressBarProps) {
    const clampedPercent = Math.min(Math.max(percent, 0), 100);

    return (
        <div className={`h-2 rounded-md overflow-hidden bg-[rgba(255,255,255,0.06)] ${className}`}>
            <div
                className="h-full rounded-md bg-gradient-to-r from-[#CA8A04] via-[#EAB308] to-[#FBBF24]"
                style={{
                    width: `${clampedPercent}%`,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            />
        </div>
    );
}
