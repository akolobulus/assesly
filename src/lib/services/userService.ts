
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp, collection, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  subscriptionPlan?: 'free' | 'pro' | 'enterprise';
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
}

export async function upsertUserInFirestore(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  
  const docSnap = await getDoc(userRef);

  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };

  if (!docSnap.exists()) {
    // Document does not exist, create it with createdAt and default subscription.
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
    });
  } else {
    // Document exists, update it. This will not change createdAt or subscription status.
    await updateDoc(userRef, {
        ...userData,
        // Ensure lastLogin is updated on every upsert for existing users
        lastLogin: serverTimestamp(),
    });
  }
}

export async function listAllUsers(): Promise<AppUser[]> {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const usersList = userSnapshot.docs.map(doc => doc.data() as AppUser);
    return usersList;
}


// Function to fetch all users and return a map keyed by email
export async function getUsersMap(): Promise<Record<string, AppUser>> {
  const usersList = await listAllUsers();
  const usersMap = usersList.reduce((acc, user) => {
    if (user.email) {
      acc[user.email.toLowerCase()] = user;
    }
    return acc;
  }, {} as Record<string, AppUser>);
  return usersMap;
}
