/**
 * @file src/components/ui/ProgressRing.tsx
 * @description SVG circular progress indicator.
 */

interface ProgressRingProps {
    percent: number;
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
}

export function ProgressRing({
    percent,
    size = 140,
    strokeWidth = 12,
    children,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const strokeDashoffset = circumference * (1 - clampedPercent / 100);

    return (
        <div className="relative flex-shrink-0">
            <svg
                width={size}
                height={size}
                style={{ transform: 'rotate(-90deg)' }}
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#ringGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                />
                <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#EAB308" />
                        <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                </defs>
            </svg>
            {children && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}
