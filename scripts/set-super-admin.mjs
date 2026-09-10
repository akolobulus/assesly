
// This script sets a custom claim on a Firebase user to grant them super admin privileges.
// It is intended for one-time setup.

// To use this script:
// 1. Install dependencies: `npm install` (this will install firebase-admin).
// 2. Get your Firebase service account key:
//    - Go to your Firebase project settings > Service accounts.
//    - Click "Generate new private key" and save the JSON file inside this `scripts` directory.
// 3. Get the User UID of the user you want to make a super admin:
//    - Go to Firebase console > Authentication > Users.
//    - Copy the UID for the desired user.
// 4. Update the `userUid` and `serviceAccoun

import admin from 'firebase-admin';
// The 'fs' module is used to read the service account file.
import { readFileSync } from 'fs';

// --- UPDATE THESE VALUES ---
const userUid = 'REPLACE_WITH_YOUR_USER_UID';
const serviceAccountPath = './scripts/REPLACE_WITH_YOUR_SERVICE_ACCOUNT_FILE.json';
// -------------------------

// Check if placeholders have been replaced
if (userUid.startsWith('REPLACE_WITH') || serviceAccountPath.includes('REPLACE_WITH')) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Please replace the placeholder values for `userUid` and `serviceAccountPath` in the script.');
  process.exit(1);
}

try {
  // Initialize the Firebase Admin SDK
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  // Set the custom claim on the specified user
  admin.auth().setCustomUserClaims(userUid, { superAdmin: true })
    .then(() => {
      console.log('\x1b[32m%s\x1b[0m', `✅ Success! Custom claim { superAdmin: true } has been set for user: ${userUid}`);
      console.log('The user must log out and log back in for the changes to take effect.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\x1b[31m%s\x1b[0m', 'Error setting custom claims:', error.message);
      process.exit(1);
    });

} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('\x1b[31m%s\x1b[0m', `Error: Service account file not found at path: ${serviceAccountPath}`);
    console.error('Please make sure the file exists and the path is correct.');
  } else {
    console.error('\x1b[31m%s\x1b[0m', 'An unexpected error occurred:', error.message);
  }
  process.exit(1);
}
