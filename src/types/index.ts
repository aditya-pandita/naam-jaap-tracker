/**
 * @file src/types/index.ts
 * @description All shared TypeScript interfaces and types for the Naam Jaap Tracker.
 * These types are shared between frontend components and API routes.
 */

import { Timestamp } from 'firebase/firestore';

// ── Firestore Document Types ──

/**
 * User profile document stored at users/{userId}
 * Created on registration; stores chanting configuration.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  goalTotalNames: number;   // default: 100_000_000
  namesPerMantra: number;   // default: 16
  beadsPerMaala: number;    // default: 108
  namesPerMaala: number;    // computed: 16 × 108 = 1,728
}

/**
 * One document per day stored at users/{userId}/entries/{YYYY-MM-DD}.
 * Document ID matches the date string.
 */
export interface DailyEntry {
  date: string;           // "YYYY-MM-DD" — matches document ID
  maalas: number;         // number of maalas chanted
  totalNames: number;     // computed: maalas × namesPerMaala
  note?: string;          // optional annotation e.g. "Ekadashi", "travelled"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Serializable version of DailyEntry (Timestamps replaced with ISO strings).
 * Used in API responses and frontend state.
 */
export interface DailyEntryData {
  date: string;
  maalas: number;
  totalNames: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ── API Response Types ──

/**
 * Computed statistics returned by GET /api/stats.
 * Never persisted — always calculated fresh from all entries.
 */
export interface StatsResponse {
  // Cumulative
  totalMaalas: number;
  totalNames: number;
  goalTotalNames: number;
  percentComplete: number;          // e.g. 8.29 (two decimal places)

  // Averages
  averageMaalasPerDay: number;      // all-time avg over calendar days
  averageNamesPerDay: number;
  totalDaysTracked: number;         // calendar days since first entry
  totalDaysWithEntries: number;     // days where maalas > 0

  // Streaks
  currentStreak: number;            // consecutive days ending today
  longestStreak: number;            // best ever

  // Projection
  remainingNames: number;
  projectedCompletionDate: string;  // ISO date or "COMPLETE" or "INSUFFICIENT_DATA"
  estimatedDaysRemaining: number;   // -1 if insufficient data

  // Rate breakdown
  last7DaysAvgMaalas: number;
  last30DaysAvgMaalas: number;
  allTimeAvgMaalas: number;
}

/**
 * Standard API error response shape.
 */
export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Auth registration request body.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Auth login request body.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Auth response returned after login or register.
 */
export interface AuthResponse {
  uid: string;
  email: string;
  token: string;
}

/**
 * Entry upsert (POST) request body.
 */
export interface EntryUpsertRequest {
  date: string;
  maalas: number;
  note?: string;
}

/**
 * Entry update (PUT) request body.
 * Either set absolute maalas or increment by N.
 */
export interface EntryUpdateRequest {
  maalas?: number;
  incrementMaalas?: number;
}

/**
 * Range query response for entries.
 */
export interface EntriesRangeResponse {
  entries: DailyEntryData[];
  count: number;
}
