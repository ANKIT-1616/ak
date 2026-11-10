export type EnquiryStatus = 'new' | 'contacted' | 'discussion' | 'completed';

export interface AdminEnquiry {
  id: string;
  name: string;
  email: string;
  business_name: string | null;
  project_type: string;
  budget: string;
  description: string;
  contact_preference: 'WhatsApp' | 'Email';
  status: EnquiryStatus;
  created_at: string;
}

export interface EnquiryList {
  enquiries: AdminEnquiry[];
  counts: Record<'all' | EnquiryStatus, number>;
  total: number;
  offset: number;
  limit: number;
}

export interface AdminSession {
  accessToken: string;
  email: string;
}

const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function responseError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json() as { error?: string; msg?: string; message?: string };
    return new Error(body.error || body.msg || body.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Admin sign-in is not configured. Set the Supabase public URL and publishable key in the frontend environment.');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (!response.ok) throw await responseError(response, 'Sign-in failed. Check your email and password.');
  const result = await response.json() as {
    access_token?: string;
    user?: { email?: string };
  };
  if (!result.access_token || !result.user?.email) {
    throw new Error('Supabase returned an incomplete sign-in response.');
  }

  return { accessToken: result.access_token, email: result.user.email };
}

async function adminFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  if (!apiBase) throw new Error('The admin API URL is not configured.');

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw await responseError(response, 'The admin request failed.');
  return response.json() as Promise<T>;
}

export function getEnquiries(accessToken: string, offset: number, limit = 50): Promise<EnquiryList> {
  const query = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  return adminFetch(`/api/admin/enquiries?${query}`, accessToken);
}

export function updateEnquiryStatus(
  accessToken: string,
  id: string,
  status: EnquiryStatus,
): Promise<{ id: string; status: EnquiryStatus }> {
  return adminFetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteEnquiry(accessToken: string, id: string): Promise<{ deleted: boolean }> {
  return adminFetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, accessToken, {
    method: 'DELETE',
  });
}
