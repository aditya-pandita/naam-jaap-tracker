/**
 * @file src/components/tabs/HistoryTab.tsx
 * @description Scrollable list of recent entries (last 30 days with data).
 */

import { CHANTING } from '@/lib/constants';
import { getTodayString, daysAgo } from '@/lib/date-helpers';
import { DailyEntryData } from '@/types';
import { Card } from '@/components/ui/Card';

interface HistoryTabProps {
    entries: DailyEntryData[];
}

export function HistoryTab({ entries }: HistoryTabProps) {
    const today = getTodayString();

    const recentEntries = Array.from({ length: 30 }, (_, i) => {
        const dateStr = daysAgo(29 - i);
        const entry = entries.find((e) => e.date === dateStr);
        return entry ? { ...entry, isToday: dateStr === today } : null;
    }).filter(Boolean) as (DailyEntryData & { isToday: boolean })[];

    if (recentEntries.length === 0) {
        return (
            <Card className="text-center py-10">
                <div className="text-[#A8A29E]">No entries yet. Start logging your sadhana!</div>
            </Card>
        );
    }

    return (
        <div>
            <div className="text-[10px] text-[#57534E] font-mono uppercase tracking-wider mb-3">
                Recent Entries
            </div>
            
            {recentEntries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                    <div
                        key={entry.date}
                        className={`
                            flex items-center justify-between p-3 rounded-lg mb-1
                            border
                            ${
                                entry.isToday
                                    ? 'bg-[rgba(234,179,8,0.15)] border-[rgba(234,179,8,0.2)]'
                                    : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)]'
                            }
                        `}
                    >
                        <div>
                            <div className="text-sm text-[#FAFAF9] flex items-center gap-2">
                                {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                                {entry.isToday && (
                                    <span className="text-[9px] text-[#EAB308] bg-[rgba(234,179,8,0.15)] px-1.5 py-0.5 rounded">
                                        TODAY
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-[#57534E] mt-0.5">
                                {(entry.maalas * CHANTING.NAMES_PER_MAALA).toLocaleString('en-IN')} names
                            </div>
                        </div>
                        <div className="text-xl font-bold text-[#EAB308] font-mono">
                            {entry.maalas}
                            <span className="text-xs font-normal text-[#57534E] ml-1">m</span>
                        </div>
                    </div>
                ))}
        </div>
    );
}
