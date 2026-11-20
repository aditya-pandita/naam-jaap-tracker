/**
 * @file src/lib/date-helpers.ts
 * @description Date utility functions for the Naam Jaap Tracker.
 * Provides consistent date formatting, range generation, and calendar helpers.
 * All dates are handled as YYYY-MM-DD strings to avoid timezone issues.
 */

/**
 * Format a Date object to YYYY-MM-DD string (local date, not UTC).
 */
export function formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Return today's date as a YYYY-MM-DD string.
 */
export function getTodayString(): string {
    return formatDate(new Date());
}

/**
 * Latest date any user can be on right now, as YYYY-MM-DD.
 * The server clock (UTC on Vercel) can be up to 14 hours behind the user's local
 * date (UTC+14), so "today" for a user may be tomorrow for the server.
 */
export function latestPossibleToday(): string {
    return formatDate(new Date(Date.now() + 14 * 60 * 60 * 1000));
}

/**
 * Resolve the user's local "today" from a client-supplied YYYY-MM-DD value.
 * Accepts it only if it is within one day of the server's date (any real timezone
 * falls in that window); otherwise falls back to the server's date.
 */
export function resolveClientToday(clientToday: string | null | undefined): string {
    const serverToday = getTodayString();
    if (!clientToday || !/^\d{4}-\d{2}-\d{2}$/.test(clientToday)) return serverToday;
    const diffDays =
        (new Date(clientToday + 'T00:00:00').getTime() - new Date(serverToday + 'T00:00:00').getTime()) /
        86_400_000;
    return Math.abs(diffDays) <= 1 ? clientToday : serverToday;
}

/**
 * Get the number of days in a given month (0-indexed month).
 * @param year - Full 4-digit year
 * @param month - 0-indexed month (0 = January, 11 = December)
 */
export function daysInMonth(year: number, month: number): number {
    // Day 0 of next month = last day of this month
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Generate an array of YYYY-MM-DD date strings between from and to (inclusive).
 * @param from - Start date string YYYY-MM-DD
 * @param to - End date string YYYY-MM-DD
 */
export function getDateRange(from: string, to: string): string[] {
    const result: string[] = [];
    const start = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');

    if (start > end) return result;

    const current = new Date(start);
    while (current <= end) {
        result.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }
    return result;
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local time, not UTC).
 */
export function parseDate(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00');
}

/**
 * Calculate the number of calendar days between two dates (inclusive of both).
 */
export function daysBetween(from: string, to: string): number {
    const start = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    return Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/**
 * Get a date string N days before a given date.
 */
export function subtractDays(dateStr: string, n: number): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - n);
    return formatDate(d);
}

/**
 * Return the YYYY-MM-DD date string for N days ago from today.
 */
export function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return formatDate(d);
}

/**
 * Check if a YYYY-MM-DD string is a valid date (and not in the future).
 * Returns true if date is today or in the past.
 */
export function isValidPastOrPresentDate(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
}

/**
 * Format a date string for display (e.g., "Saturday, March 1, 2026").
 */
export function formatDisplayDate(dateStr: string): string {
    return parseDate(dateStr).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format a number in Indian numeral system shorthand.
 * e.g. 10,000,000 → "1.00 Cr", 100,000 → "1.00 L"
 */
export function formatIndianNumber(n: number): string {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    return n.toLocaleString('en-IN');
}
