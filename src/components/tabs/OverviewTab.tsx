/**
 * @file src/components/tabs/OverviewTab.tsx
 * @description Full statistics dashboard tab.
 */

import { CHANTING } from '@/lib/constants';
import { formatIndianNumber, formatDisplayDate, getTodayString, daysAgo } from '@/lib/date-helpers';
import { StatsResponse } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface OverviewTabProps {
    stats: StatsResponse | null;
    entries: { date: string; maalas: number }[];
}

export function OverviewTab({ stats, entries }: OverviewTabProps) {
    const today = getTodayString();

    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split('T')[0];
        const entry = entries.find(e => e.date === dateStr);
        return {
            date: dateStr,
            maalas: entry?.maalas || 0,
            day: d.getDate(),
        };
    });

    if (!stats) {
        return (
            <Card className="text-center py-10">
                <div className="text-[#A8A29E]">Loading stats...</div>
            </Card>
        );
    }

    return (
        <div>
            <Card>
                <div className="flex items-center gap-6">
                    <ProgressRing percent={stats.percentComplete}>
                        <span className="text-2xl font-extrabold text-[#EAB308] font-mono">
                            {stats.percentComplete}%
                        </span>
                        <span className="text-[10px] text-[#57534E]">complete</span>
                    </ProgressRing>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#57534E] font-mono uppercase tracking-wider mb-2">
                            Total Names Chanted
                        </div>
                        <div className="text-2xl font-extrabold text-[#EAB308] font-mono">
                            {formatIndianNumber(stats.totalNames)}
                        </div>
                        <div className="text-xs text-[#57534E] mt-0.5 mb-3">
                            of {formatIndianNumber(stats.goalTotalNames)} ({stats.totalMaalas.toLocaleString('en-IN')} maalas)
                        </div>
                        <ProgressBar percent={stats.percentComplete} />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
                <StatCard
                    icon="🔥"
                    value={`${stats.currentStreak}d`}
                    label="Current Streak"
                />
                <StatCard
                    icon="🏆"
                    value={`${stats.longestStreak}d`}
                    label="Best Streak"
                />
                <StatCard
                    icon="📅"
                    value={`${stats.totalDaysWithEntries}/${stats.totalDaysTracked}`}
                    label="Active Days"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card>
                    <div className="text-[10px] text-[#57534E] font-mono uppercase tracking-wider mb-2">
                        Daily Averages (maalas)
                    </div>
                    {[
                        { label: 'Last 7 days', value: stats.last7DaysAvgMaalas },
                        { label: 'Last 30 days', value: stats.last30DaysAvgMaalas },
                        { label: 'All time', value: stats.allTimeAvgMaalas },
                    ].map((row) => (
                        <div
                            key={row.label}
                            className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.03)]"
                        >
                            <span className="text-xs text-[#A8A29E]">{row.label}</span>
                            <span className="text-sm font-semibold text-[#EAB308] font-mono">
                                {row.value}
                            </span>
                        </div>
                    ))}
                </Card>

                <Card variant="accent">
                    <div className="text-[10px] text-[#57534E] font-mono uppercase tracking-wider mb-1">
                        Projected Completion
                    </div>
                    <div className="text-base font-bold text-[#EAB308] mb-1">
                        {stats.projectedCompletionDate === 'COMPLETE'
                            ? 'Complete!'
                            : stats.projectedCompletionDate === 'INSUFFICIENT_DATA'
                            ? 'N/A'
                            : formatDisplayDate(stats.projectedCompletionDate)}
                    </div>
                    <div className="text-xs text-[#A8A29E]">
                        ~{stats.estimatedDaysRemaining.toLocaleString('en-IN')} days left
                    </div>
                    <div className="mt-2.5 p-2 bg-[rgba(0,0,0,0.2)] rounded-md text-[10px] text-[#57534E] font-mono">
                        Weighted: 50% recent · 30% monthly · 20% all-time
                    </div>
                </Card>
            </div>

            <Card>
                <div className="text-[10px] text-[#57534E] font-mono uppercase tracking-wider mb-3">
                    Last 30 Days
                </div>
                <div className="flex items-end gap-0.5 h-14">
                    {last30Days.map((d) => {
                        const height = Math.min((d.maalas / 24) * 48, 48);
                        const bg =
                            d.maalas >= 16
                                ? 'linear-gradient(to top, #CA8A04, #EAB308)'
                                : d.maalas > 0
                                ? 'linear-gradient(to top, #44403C, #78716C)'
                                : 'transparent';

                        return (
                            <div
                                key={d.date}
                                className="flex-1 flex flex-col items-center"
                                title={`${d.date}: ${d.maalas}m`}
                            >
                                <div
                                    className="w-full min-w-[3px] rounded-sm"
                                    style={{
                                        height: `${height}px`,
                                        background: bg,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] text-[#57534E] font-mono">{last30Days[0]?.day}</span>
                    <span className="text-[9px] text-[#57534E] font-mono">today</span>
                </div>
            </Card>
        </div>
    );
}
