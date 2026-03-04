/**
 * @file src/lib/validators.ts
 * @description Input validation functions for API routes.
 * Centralises all validation logic so rules are consistent across endpoints.
 * Returns typed validation results rather than throwing to keep callers clean.
 */

import { CHANTING } from './constants';

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate the maalas count: must be an integer between 0 and MAX_MAALAS_PER_DAY.
 */
export function validateMaalas(maalas: unknown): ValidationResult {
    if (typeof maalas !== 'number' || !Number.isInteger(maalas)) {
        return { valid: false, error: 'maalas must be an integer' };
    }
    if (maalas < 0) {
        return { valid: false, error: `maalas must be ≥ 0, got ${maalas}` };
    }
    if (maalas > CHANTING.MAX_MAALAS_PER_DAY) {
        return {
            valid: false,
            error: `maalas must be ≤ ${CHANTING.MAX_MAALAS_PER_DAY}, got ${maalas}`,
        };
    }
    return { valid: true };
}

/**
 * Validate a date string: must be YYYY-MM-DD format, a valid calendar date,
 * and must not be in the future.
 */
export function validateDate(dateStr: unknown): ValidationResult {
    if (typeof dateStr !== 'string') {
        return { valid: false, error: 'date must be a string' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return { valid: false, error: `date must be YYYY-MM-DD format, got "${dateStr}"` };
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(dateStr + 'T00:00:00');

    // Verify the parsed date matches the input (catches 2026-02-31, 2026-13-01 etc.)
    if (
        isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() + 1 !== month ||
        date.getDate() !== day
    ) {
        return { valid: false, error: `"${dateStr}" is not a valid calendar date` };
    }

    // Reject future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
        return { valid: false, error: `date "${dateStr}" cannot be in the future` };
    }

    return { valid: true };
}

/**
 * Validate an optional note string: max 500 characters.
 */
export function validateNote(note: unknown): ValidationResult {
    if (note === undefined || note === null || note === '') {
        return { valid: true }; // note is optional
    }
    if (typeof note !== 'string') {
        return { valid: false, error: 'note must be a string' };
    }
    if (note.length > 500) {
        return {
            valid: false,
            error: `note must be ≤ 500 characters, got ${note.length}`,
        };
    }
    return { valid: true };
}

/**
 * Validate an incrementMaalas value: integer, result must keep total ≥ 0.
 * Pass the current maalas to check the result stays in range.
 */
export function validateIncrement(
    increment: unknown,
    currentMaalas: number
): ValidationResult {
    if (typeof increment !== 'number' || !Number.isInteger(increment)) {
        return { valid: false, error: 'incrementMaalas must be an integer' };
    }
    const result = currentMaalas + increment;
    if (result < 0) {
        return {
            valid: false,
            error: `increment would result in negative maalas (${result})`,
        };
    }
    if (result > CHANTING.MAX_MAALAS_PER_DAY) {
        return {
            valid: false,
            error: `increment would exceed max maalas (${result} > ${CHANTING.MAX_MAALAS_PER_DAY})`,
        };
    }
    return { valid: true };
}
