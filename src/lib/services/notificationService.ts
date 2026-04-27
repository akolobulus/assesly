
'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export interface Notification {
  id: string;
  recipientId?: string;
  recipientEmail?: string;
  creatorId: string;
  title: string;
  message: string;
  link?: string;
  formId?: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface SerializableNotification extends Omit<Notification, 'createdAt'> {
  createdAt: string; // ISO string
}

interface CreateNotificationParams {
  recipientId?: string;
  recipientEmail?: string;
  creatorId: string;
  title: string;
  message: string;
  link?: string;
  formId?: string;
}

export async function createNotification({
  recipientId,
  recipientEmail,
  creatorId,
  title,
  message,
  link,
  formId
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  const db = adminDb();
  try {
    if (recipientId === creatorId) {
      return { success: true };
    }

    if (!recipientId && !recipientEmail) {
      return { success: false, error: 'A recipient ID or email must be provided.' };
    }
    
    let targetCollectionPath = '';
    
    if (recipientId) {
      targetCollectionPath = `users/${recipientId}/notifications`;
    } else if (recipientEmail) {
      targetCollectionPath = 'pendingNotifications';
    } else {
        return { success: false, error: 'No recipient specified.' };
    }

    const notificationData = {
      ...(recipientId && { recipientId }),
      ...(recipientEmail && { recipientEmail }),
      creatorId,
      title,
      message,
      link,
      formId,
      createdAt: Timestamp.now(),
      read: false,
    };
    
    await db.collection(targetCollectionPath).add(notificationData);
    return { success: true };

  } catch (e: any) {
    console.error('Error creating notification:', e);
    return { success: false, error: e.message || 'Failed to create notification.' };
  }
}

export async function getNotificationsForUser(
  userId: string,
  userEmail?: string | null
): Promise<SerializableNotification[]> {
  const db = adminDb();
  try {
    const notifications: Notification[] = [];
    const userNotificationsQuery = db.collection('users').doc(userId).collection('notifications').orderBy('createdAt', 'desc');
    const userNotificationsSnapshot = await userNotificationsQuery.get();
    userNotificationsSnapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });

    if (userEmail) {
      const pendingNotificationsQuery = db.collection('pendingNotifications').where('recipientEmail', '==', userEmail).orderBy('createdAt', 'desc');
      const pendingSnapshot = await pendingNotificationsQuery.get();
      pendingSnapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() } as Notification);
      });
    }

    notifications.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toDate().toISOString(),
    }));
  } catch (error) {
    console.error(`[notificationService] Failed to fetch notifications for user ${userId}:`, error);
    return [];
  }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const db = adminDb();
  try {
    const notifRef = db.collection('users').doc(userId).collection('notifications').doc(notificationId);
    await notifRef.update({ read: true });
  } catch (e) {
    console.error('Error marking notification as read:', e);
  }
}
