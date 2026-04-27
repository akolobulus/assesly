
'use server';

import { getAuth, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { sendEmailChangeConfirmationEmail } from '@/lib/services/emailService';

// This function re-authenticates the user and initiates the email change verification process.
export async function finalizeEmailChange(
  uid: string,
  currentEmail: string | null,
  newEmail: string,
  password?: string,
): Promise<{ success: boolean; newEmail?: string; error?: string }> {
  
  if (!password) {
      return { success: false, error: 'Password is required to change email.' };
  }
  
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user || user.uid !== uid) {
    return { success: false, error: 'User authentication mismatch.' };
  }

  try {
    // Re-authenticate the user with their current password. This is a required security step.
    if (currentEmail) {
        const credential = EmailAuthProvider.credential(currentEmail, password);
        await reauthenticateWithCredential(user, credential);
    } else {
        return { success: false, error: "Current user's email not found."}
    }

    // If re-authentication is successful, send the verification email to the new address.
    // Firebase handles the token generation and email sending.
    await verifyBeforeUpdateEmail(user, newEmail);
    
    // As a courtesy, we can also send a notification to the OLD email that a change was requested.
    await sendEmailChangeConfirmationEmail(currentEmail);

    return { success: true, newEmail: newEmail };
  } catch (error: any) {
    console.error("[EmailChangeAction] Error:", error.code, error.message);
    
    let errorMessage = "An unknown error occurred. Please try again.";
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = "The password you entered is incorrect. Please try again.";
    } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use by another account.";
    } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "This is a sensitive action. Please sign out and sign in again before changing your email.";
    }

    return { success: false, error: errorMessage };
  }
}
