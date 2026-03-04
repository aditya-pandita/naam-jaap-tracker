/**
 * @file src/components/tabs/CalendarTab.tsx
 * @description Month view calendar with date navigation and inline entry editor.
 */

import { useState } from 'react';
import { CHANTING } from '@/lib/constants';
import { formatDisplayDate, getTodayString, daysInMonth } from '@/lib/date-helpers';
import { DailyEntryData } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CalendarTabProps {
    entries: Map<string, DailyEntryData>;
    selectedDate: string;
    onSelectDate: (date: string) => void;
    onSave: (date: string, maalas: number) => void;
    onUpdate: (date: string, maalas: number) => void;
    onDelete: (date: string) => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarTab({
    entries,
    selectedDate,
    onSelectDate,
    onSave,
    onUpdate,
    onDelete,
}: CalendarTabProps) {
    const today = getTodayString();
    const todayDate = new Date(today + 'T00:00:00');
    const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
    const [viewYear, setViewYear] = useState(todayDate.getFullYear());

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysCount = daysInMonth(viewYear, viewMonth);

    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarCells.push(null);
    }
    for (let i = 1; i <= daysCount; i++) {
        calendarCells.push(i);
    }

    const formatDateKey = (day: number) => {
        const month = String(viewMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${viewYear}-${month}-${dayStr}`;
    };

    const selectedEntry = entries.get(selectedDate);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPrevMonth}
                    className="
                        w-9 h-9 rounded-lg flex items-center justify-center
                        bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)]
                        text-[#A8A29E] cursor-pointer hover:bg-[rgba(255,255,255,0.1)]
                        transition-all duration-150
                    "
                >
                    ←
                </button>
                <span className="text-base font-semibold">
                    {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                    onClick={goToNextMonth}
                    className="
                        w-9 h-9 rounded-lg flex items-center justify-center
                        bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)]
                        text-[#A8A29E] cursor-pointer hover:bg-[rgba(255,255,255,0.1)]
                        transition-all duration-150
                    "
                >
                    →
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((dow) => (
                    <div
                        key={dow}
                        className="text-center text-[10px] text-[#57534E] font-mono uppercase py-1"
                    >
                        {dow}
                    </div>
                ))}

                {calendarCells.map((day, i) => {
                    if (day === null) {
                        return <div key={`empty-${i}`} />;
                    }

                    const dateKey = formatDateKey(day);
                    const entry = entries.get(dateKey);
                    const maalas = entry?.maalas || 0;
                    const isToday = dateKey === today;
                    const isSelected = dateKey === selectedDate;
                    const intensity = Math.min(maalas / 24, 1);

                    return (
                        <button
                            key={dateKey}
                            onClick={() => onSelectDate(dateKey)}
                            className={`
                                aspect-square rounded-lg flex flex-col items-center justify-center
                                border cursor-pointer transition-all duration-150 text-sm
                                ${
                                    isToday
                                        ? 'border-2 border-[#EAB308]'
                                        : isSelected
                                        ? 'bg-[rgba(234,179,8,0.15)] border-[#EAB308]'
                                        : 'border-transparent hover:border-[rgba(234,179,8,0.2)]'
                                }
                            `}
                            style={{
                                background: isSelected
                                    ? undefined
                                    : maalas > 0
                                    ? `rgba(234,179,8,${0.05 + intensity * 0.25})`
                                    : 'rgba(255,255,255,0.03)',
                                color: maalas > 0 ? '#FAFAF9' : '#57534E',
                            }}
                        >
                            <span>{day}</span>
                            {maalas > 0 && (
                                <span className="text-[8px] text-[#CA8A04] font-mono mt-0.5">
                                    {maalas}m
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4">
                {!selectedEntry ? (
                    <Card variant="accent" className="text-center py-8 px-6">
                        <div className="text-5xl mb-4">📿</div>
                        <h3 className="text-lg font-semibold text-[#FAFAF9] mb-2">
                            {selectedDate === today ? "Log Today's Sadhana" : 'No Entry'}
                        </h3>
                        <p className="text-sm text-[#A8A29E] mb-6">
                            {selectedDate === today
                                ? 'How many maalas did you chant today?'
                                : formatDisplayDate(selectedDate)}
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <Button
                                variant="gold"
                                size="lg"
                                onClick={() => onSave(selectedDate, CHANTING.DEFAULT_DAILY_MAALAS)}
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
                                    id="calendarCustomInput"
                                />
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={() => {
                                        const input = document.getElementById('calendarCustomInput') as HTMLInputElement;
                                        const val = parseInt(input.value, 10);
                                        if (!isNaN(val) && val >= 0 && val <= 200) {
                                            onSave(selectedDate, val);
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card variant="gold-glow" className="relative overflow-hidden">
                        <div className="absolute top-[-60%] right-[-20%] w-[200px] h-[200px] bg-[rgba(234,179,8,0.08)] rounded-full pointer-events-none" />
                        
                        <div className="text-[13px] text-[#CA8A04] font-mono mb-1.5">
                            {formatDisplayDate(selectedDate)}
                        </div>
                        
                        <div className="flex items-center gap-4 flex-wrap my-4">
                            <div className="text-[48px] font-extrabold text-[#EAB308] font-mono leading-none tracking-tight">
                                {selectedEntry.maalas}
                            </div>
                            <div>
                                <div className="text-sm text-[#A8A29E]">maalas completed</div>
                                <div className="text-xs text-[#57534E] font-mono">
                                    {(selectedEntry.maalas * CHANTING.NAMES_PER_MAALA).toLocaleString('en-IN')} names
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="flex gap-1.5">
                                {[-4, -1].map((delta) => (
                                    <button
                                        key={delta}
                                        onClick={() => {
                                            const newValue = Math.max(0, Math.min(200, selectedEntry.maalas + delta));
                                            onUpdate(selectedDate, newValue);
                                        }}
                                        className="
                                            w-12 h-12 rounded-xl text-base font-mono font-semibold
                                            flex items-center justify-center cursor-pointer
                                            bg-[rgba(239,68,68,0.08)] text-[#EF4444]
                                            border border-[rgba(239,68,68,0.15)]
                                            hover:bg-[rgba(239,68,68,0.15)]
                                            transition-all duration-150
                                        "
                                    >
                                        {delta}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-1.5">
                                {[1, 4].map((delta) => (
                                    <button
                                        key={delta}
                                        onClick={() => {
                                            const newValue = Math.max(0, Math.min(200, selectedEntry.maalas + delta));
                                            onUpdate(selectedDate, newValue);
                                        }}
                                        className="
                                            w-12 h-12 rounded-xl text-base font-mono font-semibold
                                            flex items-center justify-center cursor-pointer
                                            bg-[rgba(234,179,8,0.15)] text-[#EAB308]
                                            border border-[rgba(234,179,8,0.2)]
                                            hover:bg-[rgba(234,179,8,0.25)]
                                            transition-all duration-150
                                        "
                                    >
                                        +{delta}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                            <input
                                type="number"
                                min={0}
                                max={200}
                                placeholder="Set"
                                className="
                                    w-20 py-2.5 px-3 rounded-lg
                                    bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)]
                                    text-[#FAFAF9] text-sm font-mono
                                    placeholder:text-[#57534E]
                                    focus:outline-none focus:border-[#EAB308]
                                "
                                id="calendarSetInput"
                            />
                            <Button
                                variant="gold"
                                size="md"
                                onClick={() => {
                                    const input = document.getElementById('calendarSetInput') as HTMLInputElement;
                                    const val = parseInt(input.value, 10);
                                    if (!isNaN(val) && val >= 0 && val <= 200) {
                                        onUpdate(selectedDate, val);
                                    }
                                }}
                            >
                                Set
                            </Button>
                            <Button variant="danger" size="md" onClick={() => onDelete(selectedDate)}>
                                Delete Entry
                            </Button>
                        </div>

                        {selectedEntry.note && (
                            <div className="mt-3.5 text-xs text-[#A8A29E] italic">
                                Note: {selectedEntry.note}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
