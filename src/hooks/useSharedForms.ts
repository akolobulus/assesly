
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormDocument } from '@/lib/services/formService';
import type { User } from 'firebase/auth';

export function useSharedForms(user: User | null) {
  const [sharedForms, setSharedForms] = useState<FormDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSharedForms = useCallback(() => {
    if (!user) {
      setSharedForms([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const formsQuery = query(
      collection(db, 'forms'),
      where('sharedWithUids', 'array-contains', user.uid),
      where('trashedAt', '==', null)
    );

    const unsubscribe = onSnapshot(formsQuery, async (snapshot) => {
      try {
        const formsDataPromises = snapshot.docs.map(async (formDoc) => {
            const data = formDoc.data();
            const submissionsCol = collection(db, 'forms', formDoc.id, 'submissions');
            const submissionsSnapshot = await getDocs(query(submissionsCol));

            const ownerRef = doc(db, 'users', data.userId);
            const ownerSnap = await getDoc(ownerRef);
            
            return { 
              id: formDoc.id, 
              ...data,
              responsesCount: submissionsSnapshot.size,
              creatorName: ownerSnap.exists() ? ownerSnap.data().displayName : 'Unknown Owner'
            } as FormDocument;
        });

        let formsData = await Promise.all(formsDataPromises);
        formsData.sort((a, b) => (b.lastEdited as Timestamp)?.toMillis() - (a.lastEdited as Timestamp)?.toMillis());
        
        setSharedForms(formsData);
      } catch (err: any) {
        console.error("Error processing shared forms:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching shared forms:", err);
      setError(err);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchSharedForms();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchSharedForms]);

  return { sharedForms, setSharedForms, loading, error };
}
