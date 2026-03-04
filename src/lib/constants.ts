/**
 * @file src/lib/constants.ts
 * @description Sacred chanting math constants for the Naam Jaap Tracker.
 * All values come from the Vaishnava japa tradition and MUST NOT be changed.
 * Reference: Hare Krishna Mahamantra = 16 names × 108 beads per maala = 1,728 names per maala.
 */

/**
 * Core chanting constants — sacred and immutable.
 * Goal: 10 Crore (100,000,000) names of the Lord.
 */
export const CHANTING = {
    /** Each Mahamantra recitation contains 16 divine names */
    NAMES_PER_MAHAMANTRA: 16,

    /** Each maala (rosary) has 108 beads */
    BEADS_PER_MAALA: 108,

    /** 108 beads × 16 names = 1,728 names per maala */
    NAMES_PER_MAALA: 16 * 108, // 1,728

    /** Standard committed daily practice: 16 maalas */
    DEFAULT_DAILY_MAALAS: 16,

    /** The sankalpa (vow): 10 Crore = 100,000,000 total names */
    DEFAULT_GOAL_NAMES: 100_000_000,

    /** ⌈100,000,000 ÷ 1,728⌉ = 57,871 maalas needed to fulfil the sankalpa */
    TOTAL_MAALAS_FOR_GOAL: Math.ceil(100_000_000 / (16 * 108)), // 57,871

    /** Sanity check upper bound — no one can chant more than 200 maalas in a day */
    MAX_MAALAS_PER_DAY: 200,
} as const;

/**
 * Projection weighting — recent behaviour is weighted more heavily
 * to reflect current practice pace (someone who increased from 16 to 24
 * maalas/day should see their projection update quickly).
 */
export const PROJECTION_WEIGHTS = {
    /** Last 7 days contributes 50% of the weighted average */
    LAST_7_DAYS: 0.5,

    /** Last 30 days contributes 30% of the weighted average */
    LAST_30_DAYS: 0.3,

    /** All-time average contributes 20% of the weighted average */
    ALL_TIME: 0.2,
} as const;
