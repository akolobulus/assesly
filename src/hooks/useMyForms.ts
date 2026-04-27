
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormDocument } from '@/lib/services/formService';
import type { User } from 'firebase/auth';

export function useMyForms(user: User | null) {
  const [myForms, setMyForms] = useState<FormDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const toMillis = (dateValue: any): number => {
    if (!dateValue) return 0;
    if (dateValue instanceof Timestamp) return dateValue.toMillis();
    if (dateValue instanceof Date) return dateValue.getTime();
    if (typeof dateValue.toDate === 'function') return dateValue.toDate().getTime();
    return 0;
  };

  const fetchMyForms = useCallback(() => {
    if (!user) {
      setMyForms([]);
      setLoading(false);
      return () => {}; // Return a no-op cleanup function
    }

    setLoading(true);
    setError(null);
    
    // This query now ONLY fetches forms created by the current user.
    const formsQuery = query(
      collection(db, 'forms'),
      where('userId', '==', user.uid),
      where('trashedAt', '==', null)
    );

    const unsubscribe = onSnapshot(formsQuery, async (snapshot) => {
      try {
        const formsDataPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const submissionsCol = collection(db, 'forms', doc.id, 'submissions');
            const submissionsSnapshot = await getDocs(query(submissionsCol));
            
            return { 
              id: doc.id, 
              ...data,
              responsesCount: submissionsSnapshot.size
            } as FormDocument;
        });

        let formsData = await Promise.all(formsDataPromises);
        formsData.sort((a, b) => toMillis(b.lastEdited) - toMillis(a.lastEdited));
        
        setMyForms(formsData);
      } catch (err: any) {
        console.error("Error processing user's own forms:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching 'my forms':", err);
      setError(err);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchMyForms();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchMyForms]);

  return { myForms, loading, error };
}
