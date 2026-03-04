/**
 * @file src/components/ui/MaalaCounter.tsx
 * @description The +/- stepper with big number display.
 * Core interaction component used in Today tab and Calendar tab.
 */

import { useState, KeyboardEvent } from 'react';
import { Button } from './Button';

interface MaalaCounterProps {
    value: number;
    onChange: (newValue: number) => void;
    onDelete: () => void;
    min?: number;
    max?: number;
}

export function MaalaCounter({
    value,
    onChange,
    onDelete,
    min = 0,
    max = 200,
}: MaalaCounterProps) {
    const [inputValue, setInputValue] = useState('');

    const handleIncrement = (delta: number) => {
        const newValue = Math.max(min, Math.min(max, value + delta));
        onChange(newValue);
    };

    const handleSetFromInput = () => {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed)) {
            const newValue = Math.max(min, Math.min(max, parsed));
            onChange(newValue);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSetFromInput();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex gap-1.5">
                    <button
                        onClick={() => handleIncrement(-4)}
                        className="
                            w-12 h-12 rounded-xl text-base font-mono font-semibold
                            flex items-center justify-center cursor-pointer
                            bg-[rgba(239,68,68,0.08)] text-[#EF4444]
                            border border-[rgba(239,68,68,0.15)]
                            hover:bg-[rgba(239,68,68,0.15)]
                            transition-all duration-150
                        "
                    >
                        -4
                    </button>
                    <button
                        onClick={() => handleIncrement(-1)}
                        className="
                            w-12 h-12 rounded-xl text-base font-mono font-semibold
                            flex items-center justify-center cursor-pointer
                            bg-[rgba(239,68,68,0.08)] text-[#EF4444]
                            border border-[rgba(239,68,68,0.15)]
                            hover:bg-[rgba(239,68,68,0.15)]
                            transition-all duration-150
                        "
                    >
                        -1
                    </button>
                </div>

                <div className="flex gap-1.5">
                    <button
                        onClick={() => handleIncrement(1)}
                        className="
                            w-12 h-12 rounded-xl text-base font-mono font-semibold
                            flex items-center justify-center cursor-pointer
                            bg-[rgba(234,179,8,0.15)] text-[#EAB308]
                            border border-[rgba(234,179,8,0.2)]
                            hover:bg-[rgba(234,179,8,0.25)]
                            transition-all duration-150
                        "
                    >
                        +1
                    </button>
                    <button
                        onClick={() => handleIncrement(4)}
                        className="
                            w-12 h-12 rounded-xl text-base font-mono font-semibold
                            flex items-center justify-center cursor-pointer
                            bg-[rgba(234,179,8,0.15)] text-[#EAB308]
                            border border-[rgba(234,179,8,0.2)]
                            hover:bg-[rgba(234,179,8,0.25)]
                            transition-all duration-150
                        "
                    >
                        +4
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Set"
                    className="
                        w-20 py-2.5 px-3 rounded-lg
                        bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)]
                        text-[#FAFAF9] text-sm font-mono
                        placeholder:text-[#57534E]
                        focus:outline-none focus:border-[#EAB308]
                    "
                />
                <Button variant="gold" size="md" onClick={handleSetFromInput}>
                    Set
                </Button>
                <Button variant="danger" size="md" onClick={onDelete}>
                    Delete Entry
                </Button>
            </div>
        </div>
    );
}
