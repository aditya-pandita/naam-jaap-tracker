/**
 * @file src/components/tabs/TodayTab.tsx
 * @description Default landing tab — log today's maalas.
 */

import { useState, useEffect } from 'react';
import { CHANTING } from '@/lib/constants';
import { formatIndianNumber, formatDisplayDate, getTodayString } from '@/lib/date-helpers';
import { DailyEntryData, StatsResponse } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { MaalaCounter } from '@/components/ui/MaalaCounter';

interface TodayTabProps {
    entry: DailyEntryData | null;
    stats: StatsResponse | null;
    onSave: (date: string, maalas: number) => void;
    onUpdate: (date: string, maalas: number) => void;
    onDelete: (date: string) => void;
    loading: boolean;
}

export function TodayTab({ entry, stats, onSave, onUpdate, onDelete, loading }: TodayTabProps) {
    const today = getTodayString();
    const todayDisplay = formatDisplayDate(today);
    const isToday = true;
    const dayLabel = 'Today';

    if (!entry) {
        return (
            <div>
                <Card variant="accent" className="text-center py-10 px-6">
                    <div className="text-5xl mb-4">📿</div>
                    <h2 className="text-xl font-semibold text-[#FAFAF9] mb-2">
                        Log Today&apos;s Sadhana
                    </h2>
                    <p className="text-sm text-[#A8A29E] mb-6">
                        How many maalas did you chant today?
                    </p>
                    <div className="flex flex-col items-center gap-3">
                        <Button
                            variant="gold"
                            size="lg"
                            onClick={() => onSave(today, CHANTING.DEFAULT_DAILY_MAALAS)}
                            disabled={loading}
                            className="w-full max-w-[200px]"
                        >
                            📿 Add 16 Maalas
                        </Button>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                min={0}
                                max={200}
                                placeholder="Custom"
                                className="
                                    w-24 py-2.5 px-3 rounded-lg
                                    bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)]
                                    text-[#FAFAF9] text-sm font-mono
                                    placeholder:text-[#57534E]
                                    focus:outline-none focus:border-[#EAB308]
                                "
                                id="customMaalasInput"
                            />
                            <Button
                                variant="ghost"
                                size="md"
                                onClick={() => {
                                    const input = document.getElementById('customMaalasInput') as HTMLInputElement;
                                    const val = parseInt(input.value, 10);
                                    if (!isNaN(val) && val >= 0 && val <= 200) {
                                        onSave(today, val);
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </Card>

                {stats && (
                    <>
                        <div className="grid grid-cols-3 gap-2.5 mb-4">
                            <StatCard icon="🔥" value={stats.currentStreak} label="Streak" />
                            <StatCard icon="📿" value={stats.totalMaalas.toLocaleString('en-IN')} label="Total Maalas" />
                            <StatCard icon="🎯" value={`${stats.percentComplete}%`} label="Complete" />
                        </div>
                        <Card>
                            <div className="flex justify-between text-xs text-[#A8A29E] mb-2">
                                <span>{formatIndianNumber(stats.totalNames)}</span>
                                <span className="text-[#57534E]">{formatIndianNumber(stats.goalTotalNames)}</span>
                            </div>
                            <ProgressBar percent={stats.percentComplete} />
                            <div className="mt-2.5 text-xs text-[#57534E]">
                                Est. completion:{' '}
                                <span className="text-[#EAB308] font-mono">
                                    {stats.projectedCompletionDate === 'COMPLETE'
                                        ? 'Complete!'
                                        : stats.projectedCompletionDate === 'INSUFFICIENT_DATA'
                                        ? 'N/A'
                                        : stats.projectedCompletionDate}
                                </span>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        );
    }

    return (
        <div>
            <Card variant="gold-glow" className="relative overflow-hidden">
                <div className="absolute top-[-60%] right-[-20%] w-[200px] h-[200px] bg-[rgba(234,179,8,0.08)] rounded-full pointer-events-none" />
                
                <div className="text-[13px] text-[#CA8A04] font-mono mb-1.5">
                    {dayLabel}, {todayDisplay}
                </div>
                
                <div className="flex items-center gap-4 flex-wrap my-4">
                    <div className="text-[56px] font-extrabold text-[#EAB308] font-mono leading-none tracking-tight">
                        {entry.maalas}
                    </div>
                    <div>
                        <div className="text-sm text-[#A8A29E]">maalas completed</div>
                        <div className="text-xs text-[#57534E] font-mono">
                            {(entry.maalas * CHANTING.NAMES_PER_MAALA).toLocaleString('en-IN')} names
                        </div>
                    </div>
                </div>

                <MaalaCounter
                    value={entry.maalas}
                    onChange={(newValue) => onUpdate(today, newValue)}
                    onDelete={() => onDelete(today)}
                />

                {entry.note && (
                    <div className="mt-3.5 text-xs text-[#A8A29E] italic">
                        Note: {entry.note}
                    </div>
                )}
            </Card>

            {stats && (
                <>
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                        <StatCard icon="🔥" value={stats.currentStreak} label="Streak" />
                        <StatCard icon="📿" value={stats.totalMaalas.toLocaleString('en-IN')} label="Total Maalas" />
                        <StatCard icon="🎯" value={`${stats.percentComplete}%`} label="Complete" />
                    </div>
                    <Card>
                        <div className="flex justify-between text-xs text-[#A8A29E] mb-2">
                            <span>{formatIndianNumber(stats.totalNames)}</span>
                            <span className="text-[#57534E]">{formatIndianNumber(stats.goalTotalNames)}</span>
                        </div>
                        <ProgressBar percent={stats.percentComplete} />
                        <div className="mt-2.5 text-xs text-[#57534E]">
                            Est. completion:{' '}
                            <span className="text-[#EAB308] font-mono">
                                {stats.projectedCompletionDate === 'COMPLETE'
                                    ? 'Complete!'
                                    : stats.projectedCompletionDate === 'INSUFFICIENT_DATA'
                                    ? 'N/A'
                                    : stats.projectedCompletionDate}
                            </span>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
