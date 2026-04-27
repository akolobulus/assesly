
import admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { getApps } from 'firebase-admin/app';
 
function getAdminApp(): admin.app.App {
  if (getApps().length > 0) {
    return admin.app();
  }

  // When deployed to Firebase Hosting with a Cloud Function backend,
  // initializeApp() automatically uses the correct service account credentials
  // provided by the environment. No manual configuration is needed.
  return admin.initializeApp();
}

export const adminApp = (): admin.app.App => getAdminApp();
export const adminAuth = (): Auth => admin.auth(adminApp());
export const adminDb = (): Firestore => admin.firestore(adminApp());

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
 
  if (!sessionCookie) return null;

  try {
    const authInstance = adminAuth();
    const decoded = await authInstance.verifySessionCookie(sessionCookie, true);
    const user = await authInstance.getUser(decoded.uid);
    return user;
  } catch (error) {
    console.error("Failed to verify session cookie:", error);
    // If the cookie is invalid, delete it.
    try {
      const cookieStore = await cookies();
      cookieStore.delete("session");
    } catch (clearError) {
      console.error("Failed to clear session cookie:", clearError);
    }
    return null;
  }
}
