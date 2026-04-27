
"use client";

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, type User, type Auth } from "firebase/auth";
import { app } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  auth: Auth; // Export the auth instance
}

export function useAuth(): AuthState {
  const auth = getAuth(app);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    auth: auth, // Include auth in the initial state
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ user, loading: false, auth });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  return authState;
}
