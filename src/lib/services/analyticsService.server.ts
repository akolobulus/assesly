
'use server'; // This file contains server-side logic

import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import UAParser from 'ua-parser-js';

// Server-side recording function
export async function recordFormView(formId: string, userAgentString?: string): Promise<void> {
  const db = adminDb();
  try {
    const formRef = db.collection('forms').doc(formId);
    const formSnap = await formRef.get();

    if (!formSnap.exists) {
      console.error(`[AnalyticsService.server] Attempted to record view for non-existent form ${formId}`);
      return;
    }
    
    const formOwnerId = formSnap.data()?.userId;
    if (!formOwnerId) {
      console.error(`[AnalyticsService.server] Could not determine owner for form ${formId}`);
      return;
    }

    const parser = new UAParser(userAgentString);
    const deviceTypeRaw = parser.getDevice().type;
    let device: 'Desktop' | 'Mobile' | 'Tablet' | 'Others' = 'Desktop'; // Default
    if (deviceTypeRaw === 'mobile') device = 'Mobile';
    else if (deviceTypeRaw === 'tablet') device = 'Tablet';
    else if (deviceTypeRaw) device = 'Others';

    const viewsCollectionRef = db.collection('forms').doc(formId).collection('views');
    await viewsCollectionRef.add({
      viewedAt: Timestamp.now(),
      formOwnerId: formOwnerId,
      device: device,
    });
    console.log(`[AnalyticsService.server] Recorded view for form ${formId} from device: ${device}`);
  } catch (error) {
    console.error(`[AnalyticsService.server] Failed to record view for form ${formId}:`, error);
  }
}
