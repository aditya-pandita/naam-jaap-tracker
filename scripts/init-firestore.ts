/**
 * @file scripts/init-firestore.ts
 * @description Initialize Firebase Firestore structure with sample data.
 * Run: npx dotenv -e .env.local -- tsx scripts/init-firestore.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const testUid = process.env.TEST_UID || 'test-user-001';
const testDate = process.env.TEST_DATE || new Date().toISOString().split('T')[0];

if (!projectId || !clientEmail || !privateKey) {
  console.error('ERROR: Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

function initApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

async function createUserProfile(db: ReturnType<typeof getFirestore>, uid: string) {
  const userRef = db.doc(`users/${uid}`);
  const existing = await userRef.get();
  
  if (existing.exists) {
    console.log(`User profile already exists: users/${uid}`);
    return;
  }

  await userRef.set({
    uid,
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    goalTotalNames: 100_000_000,
    namesPerMantra: 16,
    beadsPerMaala: 108,
    namesPerMaala: 1728,
  });
  console.log(`Created user profile: users/${uid}`);
}

async function createSampleEntry(db: ReturnType<typeof getFirestore>, uid: string, date: string) {
  const entryRef = db.doc(`users/${uid}/entries/${date}`);
  const existing = await entryRef.get();
  
  if (existing.exists) {
    console.log(`Entry already exists: users/${uid}/entries/${date}`);
    return;
  }

  const maalas = 5;
  const namesPerMaala = 1728;
  
  await entryRef.set({
    date,
    maalas,
    totalNames: maalas * namesPerMaala,
    note: 'Sample entry for testing',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  console.log(`Created sample entry: users/${uid}/entries/${date} (${maalas} maalas)`);
}

async function main() {
  console.log('Initializing Firebase Admin...');
  initApp();
  const db = getFirestore();
  
  console.log(`\nProject ID: ${projectId}`);
  console.log(`Test UID: ${testUid}`);
  console.log(`Test Date: ${testDate}\n`);
  
  await createUserProfile(db, testUid);
  await createSampleEntry(db, testUid, testDate);
  
  console.log('\n✅ Firestore structure initialized!');
  console.log(`   - Collection: users/${testUid}/entries/`);
  console.log(`   - Sample document: ${testDate}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
