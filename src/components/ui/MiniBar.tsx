/**
 * @file src/components/ui/MiniBar.tsx
 * @description Single bar component for the 30-day chart.
 */

interface MiniBarProps {
    value: number;
    maxValue?: number;
    isToday?: boolean;
    isSelected?: boolean;
}

export function MiniBar({ value, maxValue = 24, isToday = false, isSelected = false }: MiniBarProps) {
    const height = Math.min((value / maxValue) * 48, 48);
    
    const getBackground = () => {
        if (value >= 16) {
            return 'linear-gradient(to top, #CA8A04, #EAB308)';
        }
        if (value > 0) {
            return 'linear-gradient(to top, #44403C, #78716C)';
        }
        return 'transparent';
    };

    return (
        <div className="flex-1 flex flex-col items-center">
            <div
                className="w-full min-w-[3px] rounded-sm"
                style={{
                    height: `${height}px`,
                    background: getBackground(),
                    transition: 'height 0.4s ease',
                }}
            />
        </div>
    );
}
