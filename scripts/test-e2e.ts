/**
 * @file scripts/test-e2e.ts
 * @description End-to-end test: creates custom token via Admin SDK,
 * exchanges for ID token, then tests all API endpoints against the
 * running dev server (localhost:3000).
 *
 * Run: npx tsx scripts/test-e2e.ts
 * (with env vars loaded via .env.local)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const API = 'http://localhost:3000';
const TEST_UID = 'e2e-test-user-001';
// Use LOCAL date (not UTC) — matches the app's date logic
const _today = new Date();
const TEST_DATE = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, '0')}-${String(_today.getDate()).padStart(2, '0')}`;

const projectId = process.env.FIREBASE_PROJECT_ID || '';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, '\n');

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

if (!projectId || !clientEmail || !privateKey || !firebaseApiKey) {
  console.error('ERROR: Missing env vars');
  process.exit(1);
}

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function getIdToken(): Promise<string> {
  initAdmin();
  const auth = getAdminAuth();
  const customToken = await auth.createCustomToken(TEST_UID);

  // Exchange custom token for ID token via Firebase REST API
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  return data.idToken;
}

type TestResult = { pass: boolean; name: string; detail?: string };

async function run() {
  const results: TestResult[] = [];

  const pass = (name: string, detail?: string) => {
    results.push({ pass: true, name, detail });
    console.log(`  ✅ ${name}${detail ? ': ' + detail : ''}`);
  };
  const fail = (name: string, detail?: string) => {
    results.push({ pass: false, name, detail });
    console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`);
  };

  // ── 1. Health check ──────────────────────────────────────────────
  console.log('\n[1] Health check');
  try {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'ok') pass('GET /api/health', `status=ok, ts=${data.timestamp}`);
    else fail('GET /api/health', `status=${res.status}`);
  } catch (e) {
    fail('GET /api/health', String(e));
  }

  // ── 2. Get ID token via Admin SDK ────────────────────────────────
  console.log('\n[2] Firebase Admin SDK — create custom token');
  let idToken = '';
  try {
    idToken = await getIdToken();
    pass('createCustomToken + signInWithCustomToken', `token length=${idToken.length}`);
  } catch (e) {
    fail('createCustomToken + signInWithCustomToken', String(e));
    console.log('\nAborting remaining tests (no auth token)\n');
    printSummary(results);
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  };

  // ── 3. POST /api/entries ─────────────────────────────────────────
  console.log('\n[3] POST /api/entries — upsert entry for today');
  try {
    const res = await fetch(`${API}/api/entries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date: TEST_DATE, maalas: 16 }),
    });
    const data = await res.json();
    if (res.status === 201 && data.maalas === 16) {
      pass(`POST /api/entries`, `date=${data.date}, maalas=${data.maalas}, names=${data.totalNames}`);
    } else {
      fail('POST /api/entries', `status=${res.status}, body=${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail('POST /api/entries', String(e));
  }

  // ── 4. GET /api/entries?date=TODAY ───────────────────────────────
  console.log('\n[4] GET /api/entries?date=today');
  try {
    const res = await fetch(`${API}/api/entries?date=${TEST_DATE}`, { headers });
    const data = await res.json();
    if (res.status === 200 && data.maalas === 16) {
      pass('GET /api/entries?date', `maalas=${data.maalas}`);
    } else {
      fail('GET /api/entries?date', `status=${res.status}, body=${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail('GET /api/entries?date', String(e));
  }

  // ── 5. PUT /api/entries/[date] — increment ───────────────────────
  console.log('\n[5] PUT /api/entries/[date] — increment by +4');
  try {
    const res = await fetch(`${API}/api/entries/${TEST_DATE}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ incrementMaalas: 4 }),
    });
    const data = await res.json();
    if (res.status === 200 && data.maalas === 20) {
      pass('PUT /api/entries/[date] increment', `maalas=${data.maalas}`);
    } else {
      fail('PUT /api/entries/[date] increment', `status=${res.status}, body=${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail('PUT /api/entries/[date] increment', String(e));
  }

  // ── 6. GET /api/stats ─────────────────────────────────────────────
  console.log('\n[6] GET /api/stats');
  try {
    const res = await fetch(`${API}/api/stats`, { headers });
    const data = await res.json();
    if (res.status === 200 && typeof data.totalMaalas === 'number') {
      pass('GET /api/stats', `totalMaalas=${data.totalMaalas}, streak=${data.currentStreak}, percent=${data.percentComplete}%`);
    } else {
      fail('GET /api/stats', `status=${res.status}, body=${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail('GET /api/stats', String(e));
  }

  // ── 7. DELETE /api/entries/[date] ─────────────────────────────────
  console.log('\n[7] DELETE /api/entries/[date] — cleanup test entry');
  try {
    const res = await fetch(`${API}/api/entries/${TEST_DATE}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (res.status === 200) {
      pass('DELETE /api/entries/[date]', data.message);
    } else {
      fail('DELETE /api/entries/[date]', `status=${res.status}, body=${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail('DELETE /api/entries/[date]', String(e));
  }

  // ── 8. Confirm deletion ───────────────────────────────────────────
  console.log('\n[8] GET /api/entries/[date] — confirm 404 after delete');
  try {
    const res = await fetch(`${API}/api/entries/${TEST_DATE}`, { headers });
    if (res.status === 404) {
      pass('Confirm entry deleted (404)', `date=${TEST_DATE}`);
    } else {
      fail('Confirm entry deleted', `expected 404, got ${res.status}`);
    }
  } catch (e) {
    fail('Confirm entry deleted', String(e));
  }

  printSummary(results);
  process.exit(results.some(r => !r.pass) ? 1 : 0);
}

function printSummary(results: TestResult[]) {
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed}/${total} passed`);
  if (passed === total) {
    console.log('🎉 All tests passed! Firebase backend is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check output above.');
  }
  console.log('─'.repeat(50));
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
