/**
 * @file src/components/ui/StatCard.tsx
 * @description Icon + value + label stat display component.
 */

interface StatCardProps {
    icon: string;
    value: string | number;
    label: string;
    className?: string;
}

export function StatCard({ icon, value, label, className = '' }: StatCardProps) {
    return (
        <div
            className={`
                bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]
                rounded-[14px] p-3.5
                ${className}
            `}
        >
            <div className="text-lg mb-1.5">{icon}</div>
            <div className="text-lg font-bold text-[#FAFAF9] font-mono">{value}</div>
            <div className="text-[10px] text-[#57534E] font-mono uppercase tracking-wider mt-0.5">
                {label}
            </div>
        </div>
    );
}
