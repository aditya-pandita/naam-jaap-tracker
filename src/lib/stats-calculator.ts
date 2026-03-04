/**
 * @file src/lib/stats-calculator.ts
 * @description Pure functions for computing statistics from chanting entries.
 * No side effects, no I/O — takes raw entry data and returns computed stats.
 * Implements the weighted projection algorithm from the PRD.
 */

import { CHANTING, PROJECTION_WEIGHTS } from './constants';
import { StatsResponse } from '@/types';
import { formatDate, getDateRange } from './date-helpers';

/** Minimal entry shape needed for calculations */
export interface EntryForCalc {
    date: string;   // YYYY-MM-DD
    maalas: number;
}

/**
 * Calculate the average maalas over the last N calendar days (ending today).
 * Uses calendar days in denominator — includes zero days — for a realistic daily rate.
 */
function calcLastNDaysAvg(
    entriesMap: Map<string, number>,
    n: number,
    today: string
): number {
    const todayDate = new Date(today + 'T00:00:00');
    let sum = 0;

    for (let i = 0; i < n; i++) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const key = formatDate(d);
        sum += entriesMap.get(key) ?? 0;
    }

    return sum / n;
}

/**
 * Calculate current streak: count backward from today through consecutive days with entries.
 * Stops as soon as a day with 0 maalas is found.
 */
function calcCurrentStreak(entriesMap: Map<string, number>, today: string): number {
    let streak = 0;
    const d = new Date(today + 'T00:00:00');

    while (true) {
        const key = formatDate(d);
        if (!entriesMap.has(key) || (entriesMap.get(key) ?? 0) === 0) break;
        streak++;
        d.setDate(d.getDate() - 1);
    }

    return streak;
}

/**
 * Calculate longest streak across all calendar days from first entry to today.
 */
function calcLongestStreak(
    entriesMap: Map<string, number>,
    firstDate: string,
    today: string
): number {
    const dates = getDateRange(firstDate, today);
    let longest = 0;
    let current = 0;

    for (const date of dates) {
        if ((entriesMap.get(date) ?? 0) > 0) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 0;
        }
    }

    return longest;
}

/**
 * Calculate projected completion date using a weighted moving average.
 *
 * Weighting rationale: recent behaviour is more predictive of near-term pace.
 * Weights: 50% last 7 days, 30% last 30 days, 20% all-time.
 *
 * @param totalNames - Names chanted so far
 * @param goalTotalNames - Target total names
 * @param last7DaysAvgMaalas - Average maalas per day over last 7 days
 * @param last30DaysAvgMaalas - Average maalas per day over last 30 days
 * @param allTimeAvgMaalas - All-time average maalas per day
 * @param today - Today's date string (YYYY-MM-DD)
 */
export function calculateProjection(input: {
    totalNames: number;
    goalTotalNames: number;
    last7DaysAvgMaalas: number;
    last30DaysAvgMaalas: number;
    allTimeAvgMaalas: number;
    today: string;
}): { estimatedDaysRemaining: number; projectedCompletionDate: string } {
    const remaining = input.goalTotalNames - input.totalNames;

    // Goal already achieved
    if (remaining <= 0) {
        return { estimatedDaysRemaining: 0, projectedCompletionDate: 'COMPLETE' };
    }

    // Weighted daily names average
    const weightedAvgMaalas =
        input.last7DaysAvgMaalas * PROJECTION_WEIGHTS.LAST_7_DAYS +
        input.last30DaysAvgMaalas * PROJECTION_WEIGHTS.LAST_30_DAYS +
        input.allTimeAvgMaalas * PROJECTION_WEIGHTS.ALL_TIME;

    const weightedAvgNames = weightedAvgMaalas * CHANTING.NAMES_PER_MAALA;

    // Not enough data to project
    if (weightedAvgNames <= 0) {
        return { estimatedDaysRemaining: -1, projectedCompletionDate: 'INSUFFICIENT_DATA' };
    }

    const daysRemaining = Math.ceil(remaining / weightedAvgNames);
    const completionDate = new Date(input.today + 'T00:00:00');
    completionDate.setDate(completionDate.getDate() + daysRemaining);

    return {
        estimatedDaysRemaining: daysRemaining,
        projectedCompletionDate: formatDate(completionDate),
    };
}

/**
 * Compute the full StatsResponse from a list of entries and the user's goal.
 * This is the main stats calculation function called by /api/stats.
 *
 * @param entries - All entries for the user (any order)
 * @param goalTotalNames - The user's sankalpa goal (default: 100,000,000)
 * @param today - Today's date string (YYYY-MM-DD) — injectable for testing
 */
export function computeStats(
    entries: EntryForCalc[],
    goalTotalNames: number = CHANTING.DEFAULT_GOAL_NAMES,
    today: string = formatDate(new Date())
): StatsResponse {
    // Zero-entry base case
    if (entries.length === 0) {
        return {
            totalMaalas: 0,
            totalNames: 0,
            goalTotalNames,
            percentComplete: 0,
            averageMaalasPerDay: 0,
            averageNamesPerDay: 0,
            totalDaysTracked: 0,
            totalDaysWithEntries: 0,
            currentStreak: 0,
            longestStreak: 0,
            remainingNames: goalTotalNames,
            projectedCompletionDate: 'INSUFFICIENT_DATA',
            estimatedDaysRemaining: -1,
            last7DaysAvgMaalas: 0,
            last30DaysAvgMaalas: 0,
            allTimeAvgMaalas: 0,
        };
    }

    // Build a lookup map: date → maalas
    const entriesMap = new Map<string, number>();
    let totalMaalas = 0;
    let totalDaysWithEntries = 0;

    for (const entry of entries) {
        entriesMap.set(entry.date, entry.maalas);
        totalMaalas += entry.maalas;
        if (entry.maalas > 0) totalDaysWithEntries++;
    }

    const totalNames = totalMaalas * CHANTING.NAMES_PER_MAALA;
    const percentComplete = parseFloat(((totalNames / goalTotalNames) * 100).toFixed(2));

    // Calendar days since first entry (sorted ascending)
    const sortedDates = [...entriesMap.keys()].sort();
    const firstDate = sortedDates[0];
    const todayDate = new Date(today + 'T00:00:00');
    const firstDateObj = new Date(firstDate + 'T00:00:00');
    const totalDaysTracked = Math.ceil(
        (todayDate.getTime() - firstDateObj.getTime()) / 86_400_000
    ) + 1;

    // Averages
    const allTimeAvgMaalas = totalMaalas / totalDaysTracked;
    const averageNamesPerDay = allTimeAvgMaalas * CHANTING.NAMES_PER_MAALA;
    const last7DaysAvgMaalas = calcLastNDaysAvg(entriesMap, 7, today);
    const last30DaysAvgMaalas = calcLastNDaysAvg(entriesMap, 30, today);

    // Streaks
    const currentStreak = calcCurrentStreak(entriesMap, today);
    const longestStreak = calcLongestStreak(entriesMap, firstDate, today);

    // Projection
    const { estimatedDaysRemaining, projectedCompletionDate } = calculateProjection({
        totalNames,
        goalTotalNames,
        last7DaysAvgMaalas,
        last30DaysAvgMaalas,
        allTimeAvgMaalas,
        today,
    });

    return {
        totalMaalas,
        totalNames,
        goalTotalNames,
        percentComplete,
        averageMaalasPerDay: parseFloat(allTimeAvgMaalas.toFixed(2)),
        averageNamesPerDay: parseFloat(averageNamesPerDay.toFixed(2)),
        totalDaysTracked,
        totalDaysWithEntries,
        currentStreak,
        longestStreak,
        remainingNames: Math.max(0, goalTotalNames - totalNames),
        projectedCompletionDate,
        estimatedDaysRemaining,
        last7DaysAvgMaalas: parseFloat(last7DaysAvgMaalas.toFixed(2)),
        last30DaysAvgMaalas: parseFloat(last30DaysAvgMaalas.toFixed(2)),
        allTimeAvgMaalas: parseFloat(allTimeAvgMaalas.toFixed(2)),
    };
}
