

'use client'; // This file contains client-side logic

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, serverTimestamp, Timestamp, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { format, subDays, startOfDay } from 'date-fns';
import UAParser from 'ua-parser-js';

export interface FormAnalyticsData {
  totalViews: number;
  totalSubmissions: number;
  submissionRate: number;
  dropOffRate: number;
  timeSeriesData: {
    date: string;
    views: number;
    submissions: number;
  }[];
  deviceData: {
    device: 'Desktop' | 'Mobile' | 'Tablet' | 'Others';
    views: number;
    submissions: number;
  }[];
}

// Client-side recording function
export async function recordFormView(formId: string, userAgentString?: string): Promise<void> {
  try {
    const formRef = doc(db, 'forms', formId);
    const formSnap = await getDoc(formRef);

    if (!formSnap.exists()) {
      console.error(`[AnalyticsService] Attempted to record view for non-existent form ${formId}`);
      return;
    }
    
    const formOwnerId = formSnap.data().userId;
    if (!formOwnerId) {
      console.error(`[AnalyticsService] Could not determine owner for form ${formId}`);
      return;
    }

    // Get device type from user agent
    const parser = new UAParser(userAgentString);
    const deviceTypeRaw = parser.getDevice().type;
    let device: 'Desktop' | 'Mobile' | 'Tablet' | 'Others' = 'Desktop'; // Default
    if (deviceTypeRaw === 'mobile') device = 'Mobile';
    else if (deviceTypeRaw === 'tablet') device = 'Tablet';
    else if (deviceTypeRaw) device = 'Others';

    const viewsCollectionRef = collection(db, 'forms', formId, 'views');
    await addDoc(viewsCollectionRef, {
      viewedAt: serverTimestamp(),
      formOwnerId: formOwnerId,
      device: device,
    });
    console.log(`[AnalyticsService] Recorded view for form ${formId} from device: ${device}`);
  } catch (error) {
    console.error(`[AnalyticsService] Failed to record view for form ${formId}:`, error);
  }
}

export async function getFormAnalytics(
    formId: string, 
    userId: string | null,
    dateRange?: { from?: Date; to?: Date }
): Promise<FormAnalyticsData> {
  if (!userId) {
    console.error("[AnalyticsService] User not authenticated.");
    throw new Error("User not authenticated.");
  }
  
  const formRef = doc(db, 'forms', formId);
  const formSnap = await getDoc(formRef);

  if (!formSnap.exists()) {
    throw new Error("Form not found.");
  }

  const formData = formSnap.data();
  const isOwner = formData.userId === userId;
  const isCollaborator = (formData.sharedWithUids || []).includes(userId);

  if (!isOwner && !isCollaborator) {
      throw new Error("Access denied to form analytics.");
  }

  const formOwnerId = formData.userId; // The ID of the user who owns the form

  const endDate = dateRange?.to ? startOfDay(dateRange.to) : new Date();
  const startDate = dateRange?.from ? startOfDay(dateRange.from) : subDays(new Date(), 29);
  
  // Ensure end date includes the full day
  const effectiveEndDate = new Date(endDate);
  effectiveEndDate.setHours(23, 59, 59, 999);

  // Fetch views using the form owner's ID
  const viewsQuery = query(
    collection(db, 'forms', formId, 'views'), 
    where('formOwnerId', '==', formOwnerId),
    where('viewedAt', '>=', startDate),
    where('viewedAt', '<=', effectiveEndDate),
    orderBy('viewedAt', 'desc')
  );
  const viewsSnapshot = await getDocs(viewsQuery);
  const totalViews = viewsSnapshot.size;
  const views = viewsSnapshot.docs.map(doc => ({ 
    viewedAt: (doc.data().viewedAt as Timestamp).toDate(),
    device: doc.data().device || 'Desktop'
  }));
  
  // Fetch submissions using the form owner's ID
  const submissionsQuery = query(
    collection(db, 'forms', formId, 'submissions'),
    where('formOwnerId', '==', formOwnerId),
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', effectiveEndDate),
    orderBy('createdAt', 'desc')
  );
  const submissionsSnapshot = await getDocs(submissionsQuery);
  const totalSubmissions = submissionsSnapshot.size;
  const submissions = submissionsSnapshot.docs.map(doc => ({
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    device: doc.data().device || 'Desktop'
  }));

  // Calculate rates
  const submissionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;
  const dropOffRate = 100 - submissionRate;
  
  // Process time series data for the selected date range
  const timeSeriesMap = new Map<string, { views: number; submissions: number }>();

  // Initialize map for the date range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = format(d, 'yyyy-MM-dd');
    timeSeriesMap.set(dateString, { views: 0, submissions: 0 });
  }

  // Populate views
  views.forEach(view => {
    const dateString = format(view.viewedAt, 'yyyy-MM-dd');
    if (timeSeriesMap.has(dateString)) {
      timeSeriesMap.get(dateString)!.views++;
    }
  });

  // Populate submissions
  submissions.forEach(submission => {
    const dateString = format(submission.createdAt, 'yyyy-MM-dd');
    if (timeSeriesMap.has(dateString)) {
      timeSeriesMap.get(dateString)!.submissions++;
    }
  });
  
  const timeSeriesData = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));
  
  // Process device data
  const deviceMap = new Map<string, { views: number; submissions: number }>();

  views.forEach(view => {
    const device = view.device;
    if (!deviceMap.has(device)) {
      deviceMap.set(device, { views: 0, submissions: 0 });
    }
    deviceMap.get(device)!.views++;
  });

  submissions.forEach(submission => {
    const device = submission.device;
    if (!deviceMap.has(device)) {
      deviceMap.set(device, { views: 0, submissions: 0 });
    }
    deviceMap.get(device)!.submissions++;
  });
  
  let deviceData = Array.from(deviceMap.entries()).map(([device, data]) => ({
    device: device as 'Desktop' | 'Mobile' | 'Tablet' | 'Others',
    ...data,
  }));
  
  // Ensure all standard device types are present, even if with 0 counts
  ['Desktop', 'Mobile', 'Tablet', 'Others'].forEach(d => {
    if (!deviceData.find(item => item.device === d)) {
      deviceData.push({ device: d as any, views: 0, submissions: 0 });
    }
  });

  const analyticsData = {
    totalViews,
    totalSubmissions,
    submissionRate,
    dropOffRate,
    timeSeriesData,
    deviceData,
  };

  console.log('[AnalyticsService] Fetched Analytics Data:', analyticsData);
  
  return analyticsData;
}
