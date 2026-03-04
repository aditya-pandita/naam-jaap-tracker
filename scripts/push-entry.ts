/**
 * @file scripts/push-entry.ts
 * @description Push a chanting entry directly to Firestore.
 * Run: npx dotenv -e .env.local -- tsx scripts/push-entry.ts --date 2026-03-02 --maalas 16
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('ERROR: Missing Firebase env vars');
  process.exit(1);
}

function initApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function pushEntry(uid: string, date: string, maalas: number, note?: string) {
  const db = getFirestore();
  
  const userRef = db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    console.log(`Creating user profile: users/${uid}`);
    await userRef.set({
      uid,
      email: 'user@example.com',
      displayName: 'User',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      goalTotalNames: 100_000_000,
      namesPerMantra: 16,
      beadsPerMaala: 108,
      namesPerMaala: 1728,
    });
  }
  
  const entryRef = db.doc(`users/${uid}/entries/${date}`);
  const namesPerMaala = 1728;
  
  await entryRef.set({
    date,
    maalas,
    totalNames: maalas * namesPerMaala,
    note: note || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  console.log(`✅ Pushed entry: ${date} - ${maalas} maalas (${maalas * namesPerMaala} names)`);
}

const args = process.argv.slice(2);
let uid = 'test-user-001';
let date = new Date().toISOString().split('T')[0];
let maalas = 0;
let note = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--uid' && args[i + 1]) uid = args[++i];
  if (args[i] === '--date' && args[i + 1]) date = args[++i];
  if (args[i] === '--maalas' && args[i + 1]) maalas = parseInt(args[++i], 10);
  if (args[i] === '--note' && args[i + 1]) note = args[++i];
}

if (!maalas) {
  console.log('Usage: npx dotenv -e .env.local -- tsx scripts/push-entry.ts --date 2026-03-02 --maalas 16 [--uid user123] [--note "Ekadashi"]');
  process.exit(1);
}

initApp();
pushEntry(uid, date, maalas, note)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
