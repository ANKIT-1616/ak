import {
  isEnquiryStatus,
  isUuid,
  safeInteger,
  validateEnquiry,
} from './validation.ts';
import type { EnquiryInput, EnquiryStatus } from './validation.ts';

interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  ALLOWED_ORIGINS: string;
  ADMIN_USER_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  NOTIFICATION_TO_EMAIL?: string;
  RATE_LIMITER: RateLimitBinding;
}

interface StoredEnquiry {
  id: string;
  status?: EnquiryStatus;
  notification_accepted_at?: string | null;
}

interface EnquiryRecord {
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

const maxRequestBytes = 8192;
const rateLimitRetryAfterSeconds = 60;
const allowedStatuses = ['new', 'contacted', 'discussion', 'completed'] as const;

function jsonResponse(
  request: Request,
  env: Env,
  body: unknown,
  status = 200,
  extraHeaders?: HeadersInit,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Vary', 'Origin');

  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => {
      try {
        const parsed = new URL(origin);
        return (parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
          && parsed.origin === origin;
      } catch {
        return false;
      }
    });
}

function hasRequiredConfig(env: Env): boolean {
  return Boolean(
    env.SUPABASE_URL
    && env.SUPABASE_ANON_KEY
    && env.SUPABASE_SERVICE_ROLE_KEY
    && env.ADMIN_USER_ID
    && env.RATE_LIMITER,
  );
}

function supabaseHeaders(env: Env, key: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('apikey', key);
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${key}`);
  return headers;
}

function supabaseRestUrl(env: Env, path: string): string {
  return `${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${path}`;
}

async function checkRateLimit(request: Request, env: Env): Promise<'allowed' | 'limited' | 'unavailable'> {
  const ipAddress = request.headers.get('CF-Connecting-IP');
  if (!ipAddress) return 'unavailable';

  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ipAddress));
    const key = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const result = await env.RATE_LIMITER.limit({ key });
    return result.success ? 'allowed' : 'limited';
  } catch {
    return 'unavailable';
  }
}

async function requireAdmin(request: Request, env: Env): Promise<'ok' | 'unauthorized' | 'forbidden' | 'unavailable'> {
  const authorization = request.headers.get('Authorization') ?? '';
  const match = /^Bearer ([\w.-]+)$/.exec(authorization);
  if (!match || match[1].length > 8192) return 'unauthorized';

  try {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: supabaseHeaders(env, env.SUPABASE_ANON_KEY, { Authorization: `Bearer ${match[1]}` }),
    });
    if (response.status === 401 || response.status === 403) return 'unauthorized';
    if (!response.ok) return 'unavailable';

    const user = await response.json() as { id?: unknown };
    if (typeof user.id !== 'string') return 'unauthorized';
    return user.id.toLowerCase() === env.ADMIN_USER_ID.toLowerCase() ? 'ok' : 'forbidden';
  } catch {
    return 'unavailable';
  }
}

async function insertEnquiry(env: Env, enquiry: EnquiryInput): Promise<{
  enquiry: StoredEnquiry;
  inserted: boolean;
} | null> {
  const endpoint = new URL(supabaseRestUrl(env, 'enquiries'));
  endpoint.searchParams.set('on_conflict', 'submission_id');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=representation',
    }),
    body: JSON.stringify({
      submission_id: enquiry.submissionId,
      name: enquiry.fullName,
      email: enquiry.email,
      business_name: enquiry.business || null,
      project_type: enquiry.projectType,
      budget: enquiry.budget,
      description: enquiry.details,
      contact_preference: enquiry.preferredContact,
    }),
  });

  if (!response.ok) {
    console.error('Supabase enquiry insert failed:', response.status);
    return null;
  }

  const inserted = await response.json() as StoredEnquiry[];
  if (inserted[0]?.id) return { enquiry: inserted[0], inserted: true };

  const existingUrl = new URL(supabaseRestUrl(env, 'enquiries'));
  existingUrl.searchParams.set('select', 'id,notification_accepted_at');
  existingUrl.searchParams.set('submission_id', `eq.${enquiry.submissionId}`);
  existingUrl.searchParams.set('limit', '1');
  const existingResponse = await fetch(existingUrl, {
    headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY),
  });
  if (!existingResponse.ok) {
    console.error('Supabase idempotency lookup failed:', existingResponse.status);
    return null;
  }

  const existing = await existingResponse.json() as StoredEnquiry[];
  return existing[0]?.id ? { enquiry: existing[0], inserted: false } : null;
}

async function sendAdminNotification(
  env: Env,
  enquiryId: string,
  enquiry: EnquiryInput,
): Promise<'accepted' | 'not_configured' | 'failed'> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.NOTIFICATION_TO_EMAIL) {
    return 'not_configured';
  }

  const text = [
    'A new A_KON project enquiry was received.',
    '',
    `Name: ${enquiry.fullName}`,
    `Email: ${enquiry.email}`,
    `Business: ${enquiry.business || 'Not provided'}`,
    `Project type: ${enquiry.projectType}`,
    `Budget: ${enquiry.budget}`,
    `Preferred contact: ${enquiry.preferredContact}`,
    '',
    'Project details:',
    enquiry.details,
    '',
    `Enquiry ID: ${enquiryId}`,
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [env.NOTIFICATION_TO_EMAIL],
        reply_to: enquiry.email,
        subject: `New project enquiry — ${enquiry.fullName}`,
        text,
      }),
    });
    if (!response.ok) {
      console.error('Resend notification failed:', response.status);
      return 'failed';
    }

    const result = await response.json() as { id?: unknown };
    if (typeof result.id !== 'string' || !result.id) return 'failed';

    const updateUrl = new URL(supabaseRestUrl(env, 'enquiries'));
    updateUrl.searchParams.set('id', `eq.${enquiryId}`);
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY, {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify({ notification_accepted_at: new Date().toISOString() }),
    });
    if (!updateResponse.ok) {
      console.error('Notification status update failed:', updateResponse.status);
      return 'failed';
    }
    return 'accepted';
  } catch {
    console.error('Resend notification request failed.');
    return 'failed';
  }
}

async function handlePublicSubmission(request: Request, env: Env): Promise<Response> {
  if (!hasRequiredConfig(env)) {
    return jsonResponse(request, env, { error: 'The enquiry service is not configured yet.' }, 503);
  }
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return jsonResponse(request, env, { error: 'Please submit a valid enquiry.' }, 415);
  }

  const rateResult = await checkRateLimit(request, env);
  if (rateResult === 'limited') {
    return jsonResponse(request, env, { error: 'Too many enquiries from this network. Please try again later.' }, 429, {
      'Retry-After': String(rateLimitRetryAfterSeconds),
    });
  }
  if (rateResult === 'unavailable') {
    return jsonResponse(request, env, { error: 'The enquiry service is temporarily unavailable. Please try again later.' }, 503);
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength > maxRequestBytes) {
    return jsonResponse(request, env, { error: 'The enquiry is too large.' }, 413);
  }

  let body: unknown;
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > maxRequestBytes) {
      return jsonResponse(request, env, { error: 'The enquiry is too large.' }, 413);
    }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return jsonResponse(request, env, { error: 'Please submit a valid enquiry.' }, 400);
  }

  const result = validateEnquiry(body);
  if (!result.data) {
    return jsonResponse(request, env, { error: 'Please check the enquiry details.', issues: result.issues }, 400);
  }

  const stored = await insertEnquiry(env, result.data);
  if (!stored) {
    return jsonResponse(request, env, { error: 'Your enquiry could not be saved. Please try again.' }, 502);
  }

  let notification: 'accepted' | 'not_configured' | 'failed' = stored.enquiry.notification_accepted_at
    ? 'accepted'
    : 'not_configured';
  if (!stored.enquiry.notification_accepted_at) {
    notification = await sendAdminNotification(env, stored.enquiry.id, result.data);
  }

  return jsonResponse(
    request,
    env,
    { enquiryId: stored.enquiry.id, notification },
    stored.inserted ? 201 : 200,
  );
}

async function handleAdmin(request: Request, env: Env, url: URL): Promise<Response> {
  if (!hasRequiredConfig(env)) {
    return jsonResponse(request, env, { error: 'The admin service is not configured.' }, 503);
  }

  const auth = await requireAdmin(request, env);
  if (auth === 'unauthorized') return jsonResponse(request, env, { error: 'Please sign in again.' }, 401);
  if (auth === 'forbidden') return jsonResponse(request, env, { error: 'This account is not permitted to access enquiries.' }, 403);
  if (auth === 'unavailable') return jsonResponse(request, env, { error: 'Authentication is temporarily unavailable.' }, 503);

  const path = url.pathname;
  if (path === '/api/admin/enquiries' && request.method === 'GET') {
    const offset = safeInteger(url.searchParams.get('offset'), 0, 1000000);
    const limit = safeInteger(url.searchParams.get('limit'), 50, 100);
    return listEnquiries(request, env, offset, limit);
  }

  const match = /^\/api\/admin\/enquiries\/([0-9a-f-]{36})$/i.exec(path);
  if (!match || !isUuid(match[1])) {
    return jsonResponse(request, env, { error: 'This admin route was not found.' }, 404);
  }

  if (request.method === 'PATCH') {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(request, env, { error: 'Please submit a valid status.' }, 400);
    }
    const status = (body as { status?: unknown } | null)?.status;
    if (!isEnquiryStatus(status)) {
      return jsonResponse(request, env, { error: 'Please choose a valid enquiry status.' }, 400);
    }

    const endpoint = new URL(supabaseRestUrl(env, 'enquiries'));
    endpoint.searchParams.set('id', `eq.${match[1]}`);
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return databaseError(request, env, 'update');
    const rows = await response.json() as StoredEnquiry[];
    if (!rows[0]) return jsonResponse(request, env, { error: 'Enquiry not found.' }, 404);
    return jsonResponse(request, env, { id: rows[0].id, status: rows[0].status });
  }

  if (request.method === 'DELETE') {
    const endpoint = new URL(supabaseRestUrl(env, 'enquiries'));
    endpoint.searchParams.set('id', `eq.${match[1]}`);
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY, { Prefer: 'return=representation' }),
    });
    if (!response.ok) return databaseError(request, env, 'delete');
    const rows = await response.json() as StoredEnquiry[];
    if (!rows[0]) return jsonResponse(request, env, { error: 'Enquiry not found.' }, 404);
    return jsonResponse(request, env, { deleted: true });
  }

  return jsonResponse(request, env, { error: 'Method not allowed.' }, 405, { Allow: 'PATCH, DELETE' });
}

async function listEnquiries(request: Request, env: Env, offset: number, limit: number): Promise<Response> {
  const statuses: Array<EnquiryStatus | 'all'> = ['all', ...allowedStatuses];
  try {
    const counts = await Promise.all(statuses.map(async (status) => {
      const endpoint = new URL(supabaseRestUrl(env, 'enquiries'));
      endpoint.searchParams.set('select', 'id');
      if (status !== 'all') endpoint.searchParams.set('status', `eq.${status}`);
      const response = await fetch(endpoint, {
        method: 'HEAD',
        headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY, { Prefer: 'count=exact' }),
      });
      if (!response.ok) throw new Error(`count:${response.status}`);
      const total = response.headers.get('Content-Range')?.match(/\/(\d+)$/)?.[1];
      return [status, total ? Number(total) : 0] as const;
    }));

    const endpoint = new URL(supabaseRestUrl(env, 'enquiries'));
    endpoint.searchParams.set(
      'select',
      'id,name,email,business_name,project_type,budget,description,contact_preference,status,created_at',
    );
    endpoint.searchParams.set('order', 'created_at.desc');
    const response = await fetch(endpoint, {
      headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY, {
        Range: `${offset}-${offset + limit - 1}`,
        'Range-Unit': 'items',
        Prefer: 'count=exact',
      }),
    });
    if (!response.ok) throw new Error(`list:${response.status}`);
    const enquiries = await response.json() as EnquiryRecord[];
    const total = Number(response.headers.get('Content-Range')?.match(/\/(\d+)$/)?.[1] ?? enquiries.length);
    return jsonResponse(request, env, {
      enquiries,
      counts: Object.fromEntries(counts),
      total,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Supabase enquiry list failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonResponse(request, env, { error: 'Enquiries could not be loaded. Please try again.' }, 502);
  }
}

function databaseError(request: Request, env: Env, operation: string): Response {
  console.error(`Supabase enquiry ${operation} failed.`);
  return jsonResponse(request, env, { error: 'The enquiry could not be updated. Please try again.' }, 502);
}

async function healthCheck(request: Request, env: Env): Promise<Response> {
  if (!hasRequiredConfig(env)) {
    return jsonResponse(request, env, { ok: false, configured: false }, 503);
  }

  try {
    const endpoint = new URL(supabaseRestUrl(env, 'enquiries'));
    endpoint.searchParams.set('select', 'id');
    const response = await fetch(endpoint, {
      method: 'HEAD',
      headers: supabaseHeaders(env, env.SUPABASE_SERVICE_ROLE_KEY, { Range: '0-0' }),
    });
    if (!response.ok) {
      console.error('Supabase health check failed:', response.status);
      return jsonResponse(request, env, { ok: false, configured: true }, 503);
    }
    return jsonResponse(request, env, { ok: true, configured: true });
  } catch {
    console.error('Supabase health check request failed.');
    return jsonResponse(request, env, { ok: false, configured: true }, 503);
  }
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  return Boolean(origin && allowedOrigins(env).includes(origin));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!isAllowedOrigin(request, env)) {
      return jsonResponse(request, env, { error: 'This origin is not allowed.' }, 403);
    }

    if (request.method === 'OPTIONS') {
      return jsonResponse(request, env, null, 204, {
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
      });
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return healthCheck(request, env);
    }

    if (url.pathname === '/api/enquiries' && request.method === 'POST') {
      return handlePublicSubmission(request, env);
    }

    if (url.pathname.startsWith('/api/admin/')) {
      return handleAdmin(request, env, url);
    }

    return jsonResponse(request, env, { error: 'API route not found.' }, 404);
  },
};
