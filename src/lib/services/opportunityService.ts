
'use server';

import { wixImageToUrl } from "@/lib/utils";

export interface Opportunity {
  _id: string;
  _createdDate: string;
  collection: string;
  title: string;
  description: string;
  link: string;
  image: string;
  applicationStatus: 'Open' | 'Closed';
  applicationType: 'local' | 'foreign';
}

export interface OpportunityData {
  collection: string;
  title: string;
  description: string;
  link: string;
  image: string;
}

const WIX_API_BASE_URL = "https://thefounders.tech/_functions";
const WIX_SECRET = process.env.WIX_SECRET || 'egKBCwaYytelySEEusQFMRpme3g2';

async function makeWixRequest(endpoint: string, method: 'GET' | 'POST' = 'POST', body?: object, isAuthenticated = false) {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (isAuthenticated) {
    if (!WIX_SECRET) {
      throw new Error("WIX_SECRET is not configured in environment variables.");
    }
    headers['auth'] = WIX_SECRET;
  }
   
  const fullUrl = `${WIX_API_BASE_URL}${endpoint}`;
  
  const fetchOptions: RequestInit = {
    method: method,
    headers: headers,
    cache: 'no-store'
  };

  if (method === 'POST' && body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(fullUrl, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Wix API Error (${response.status}) for endpoint ${fullUrl}:`, errorText);
    try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || `API request failed: ${response.statusText}`);
    } catch (e) {
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
    }
  }

  return response.json();
}

export async function getOpportunities(collection: string): Promise<Opportunity[]> {
  try {
    const response = await fetch(`${WIX_API_BASE_URL}/allCollection?collection=${collection}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();

    if (data.items) {
      return data.items as Opportunity[];
    }
    
    // Handle cases where API might return the array directly
    if (Array.isArray(data)) {
        return data as Opportunity[];
    }

    // Handle unexpected but successful response format
    console.warn("Unexpected response format from getOpportunities, but it was successful.", data);
    return [];

  } catch (error: any) {
    console.error('getOpportunities error:', error);
    throw new Error(error.message || 'Error fetching opportunities');
  }
}

export async function createOpportunity(opportunityData: OpportunityData): Promise<any> {
  const body = {
    applicationStatus: 'Open',
    applicationType: 'local',
    ...opportunityData,
  };
  // The create function needs authentication
  return makeWixRequest('/addOpportunity', 'POST', body, true);
}

export async function updateOpportunity(id: string, opportunityData: OpportunityData): Promise<any> {
  const body = {
    id,
    collection: opportunityData.collection, // collection is a top-level property
    data: {
      title: opportunityData.title,
      description: opportunityData.description,
      link: opportunityData.link,
      image: opportunityData.image,
      applicationStatus: 'Open',
      applicationType: 'local',
    },
  };
  return makeWixRequest('/editOpportunity', 'POST', body, true);
}

export async function deleteOpportunity(id: string, collection: string): Promise<any> {
  const body = {
    collection: collection,
    id: id,
  };
  // The delete function needs authentication
  return makeWixRequest('/deleteOpportunity', 'POST', body, true);
}

// Add new service functions for Business Directory
export async function getBusinessDirectoryItems(): Promise<any[]> {
  const response = await fetch(`${WIX_API_BASE_URL}/allCollection?collection=BusinessDirectory`);
  if (!response.ok) throw new Error('Failed to fetch business directory');
  const data = await response.json();
  return data.items || [];
}

// Add new service functions for Investments
export async function getInvestmentItems(): Promise<any[]> {
  const response = await fetch(`${WIX_API_BASE_URL}/allCollection?collection=Investments`);
  if (!response.ok) throw new Error('Failed to fetch investments');
  const data = await response.json();
  return data.items || [];
}
