
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, Timestamp, doc, getDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export interface Folder {
  id: string;
  name: string;
  createdAt: Timestamp; // Firestore Timestamp
  formCount: number;
  userId: string;
  trashedAt?: Timestamp | null;
}

export async function createFolder(folderName: string): Promise<{ success: boolean; error?: string; folder?: Folder }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!folderName || folderName.trim() === '') {
    return { success: false, error: 'Folder name cannot be empty.' };
  }
  try {
    const docRef = await addDoc(collection(db, 'folders'), {
      userId: user.uid,
      name: folderName.trim(),
      createdAt: serverTimestamp(),
      formCount: 0,
      trashedAt: null,
    });
    const newFolder: Folder = {
      id: docRef.id,
      name: folderName.trim(),
      userId: user.uid,
      createdAt: Timestamp.now(),
      formCount: 0,
      trashedAt: null,
    };
    return { success: true, folder: newFolder };
  } catch (e: any) {
    console.error("Error creating folder: ", e);
    return { success: false, error: e.message || 'Failed to create folder.' };
  }
}

export async function getFoldersForCurrentUser(): Promise<Folder[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }
  try {
    const foldersCol = collection(db, 'folders');
    const q = query(foldersCol, where('userId', '==', user.uid), where('trashedAt', '==', null), orderBy('name', 'asc'));
    const folderSnapshot = await getDocs(q);
    
    const foldersList = folderSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        createdAt: data.createdAt as Timestamp,
        formCount: data.formCount || 0,
        userId: data.userId,
        trashedAt: data.trashedAt || null,
      } as Folder;
    });
    return foldersList;
  } catch (e: any) {
    console.error("[folderService] Error fetching folders: ", e);
    return [];
  }
}

export async function getFolderById(folderId: string): Promise<Folder | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    const folderRef = doc(db, 'folders', folderId);
    const docSnap = await getDoc(folderRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.userId !== user.uid) {
        return null; 
      }
      if (data.trashedAt) {
        return null; // Don't return trashed folders by ID
      }
      return {
        id: docSnap.id,
        name: data.name,
        createdAt: data.createdAt as Timestamp,
        formCount: data.formCount || 0,
        userId: data.userId,
        trashedAt: data.trashedAt || null,
      } as Folder;
    } else {
      return null;
    }
  } catch (e: any) {
    console.error(`[folderService] Error fetching folder by ID ${folderId}: `, e);
    return null;
  }
}

export async function trashFolder(folderId: string): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }
    try {
        const folderRef = doc(db, 'folders', folderId);
        
        // Find all forms owned by the user within that folder.
        const formsQuery = query(
            collection(db, 'forms'),
            where('userId', '==', user.uid),
            where('folderId', '==', folderId)
        );
        const formsSnapshot = await getDocs(formsQuery);

        const batch = writeBatch(db);
        
        // Mark folder as trashed
        batch.update(folderRef, { trashedAt: serverTimestamp() });

        // Mark all forms within the folder as trashed
        formsSnapshot.forEach(formDoc => {
            batch.update(formDoc.ref, { trashedAt: serverTimestamp() });
        });
        
        await batch.commit();

        return { success: true };
    } catch (e: any) {
        console.error(`[folderService] Error trashing folder ${folderId}:`, e);
        return { success: false, error: e.message || 'Failed to move folder to trash.' };
    }
}

export async function restoreFolder(folderId: string): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }
    try {
        const folderRef = doc(db, 'folders', folderId);

        // Find all forms owned by the user within that folder to restore them.
        const formsQuery = query(
            collection(db, 'forms'), 
            where('userId', '==', user.uid),
            where('folderId', '==', folderId)
        );
        const formsSnapshot = await getDocs(formsQuery);
        
        const batch = writeBatch(db);

        // Mark folder as restored
        batch.update(folderRef, { trashedAt: null });

        // Also restore all forms inside this folder
        formsSnapshot.forEach(doc => {
            batch.update(doc.ref, { trashedAt: null });
        });
        
        await batch.commit();
        
        return { success: true };
    } catch (e: any) {
        console.error(`[folderService] Error restoring folder ${folderId}:`, e);
        return { success: false, error: e.message || 'Failed to restore folder.' };
    }
}

export async function deleteFolderPermanently(folderId: string): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }
    try {
        const folderRef = doc(db, 'folders', folderId);
        
        // Security check: Make sure user owns the folder before deleting
        const folderDoc = await getDoc(folderRef);
        if (!folderDoc.exists() || folderDoc.data().userId !== user.uid) {
            throw new Error('Permission denied or folder not found.');
        }

        // Delete the folder document itself
        await deleteDoc(folderRef);
        
        // Note: Associated forms are NOT deleted here. They become orphaned (folderId no longer points to a valid folder).
        // Handling orphaned forms would require a more complex strategy, possibly involving a Cloud Function
        // or a UI to re-assign them. For now, we just delete the folder container.
        
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Failed to delete folder permanently.' };
    }
}

export async function getTrashedFoldersForCurrentUser(): Promise<Folder[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }
  try {
    const foldersCol = collection(db, 'folders');
    const q = query(foldersCol, where('userId', '==', user.uid), where('trashedAt', '!=', null));
    const folderSnapshot = await getDocs(q);
    return folderSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
    })) as Folder;
  } catch (e: any) {
    console.error("[folderService] Error fetching trashed folders: ", e);
    return [];
  }
}

export async function renameFolder(folderId: string, newName: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!newName || newName.trim() === '') {
    return { success: false, error: 'Folder name cannot be empty.' };
  }
  try {
    const folderRef = doc(db, 'folders', folderId);
    const docSnap = await getDoc(folderRef);
    if (docSnap.exists() && docSnap.data().userId === user.uid) {
        await updateDoc(folderRef, { name: newName.trim() });
        return { success: true };
    } else {
        return { success: false, error: 'Folder not found or permission denied.' };
    }
  } catch (e: any) {
    console.error(`Error renaming folder ${folderId}:`, e);
    return { success: false, error: e.message || 'Failed to rename folder.' };
  }
}
