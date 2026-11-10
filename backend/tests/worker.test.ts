import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import type { EnquiryInput } from '../src/validation.ts';

const adminId = 'c17c6876-727e-4e15-8df9-4c28677d2648';
const validSubmission: EnquiryInput & { website: string } = {
  submissionId: '51c5227a-6fd8-4c7f-9f4f-2bd4b0d30a1b',
  fullName: 'Ananya Rao',
  email: 'ananya@example.com',
  business: 'Studio Rao',
  projectType: 'Business Website',
  budget: '₹20,000–₹40,000',
  details: 'We are looking for a new responsive website.',
  preferredContact: 'WhatsApp',
  website: '',
};

const records = new Map<string, Record<string, unknown>>();
const rateCounts = new Map<string, number>();
let resendResponse: Response | null = null;
let fetchCount = 0;
const originalFetch = globalThis.fetch;

function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  fetchCount++;
  const url = new URL(input instanceof Request ? input.url : input.toString());
  const method = init?.method ?? 'GET';

  if (url.pathname === '/auth/v1/user') {
    const token = new Headers(init?.headers).get('Authorization');
    return Promise.resolve(token === 'Bearer valid-admin-token'
      ? Response.json({ id: adminId, email: 'admin@example.com' })
      : Response.json({ message: 'invalid token' }, { status: 401 }));
  }

  if (url.hostname === 'api.resend.com') {
    return Promise.resolve(resendResponse ?? Response.json({ id: 'email-provider-id' }));
  }

  if (url.pathname.endsWith('/rest/v1/enquiries') && method === 'POST') {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const submissionId = String(body.submission_id);
    if (records.has(submissionId)) return Promise.resolve(Response.json([]));
    const row = { ...body, id: crypto.randomUUID(), status: 'new', created_at: new Date().toISOString() };
    records.set(submissionId, row);
    return Promise.resolve(Response.json([row], { status: 201 }));
  }

  if (url.pathname.endsWith('/rest/v1/enquiries') && url.searchParams.has('submission_id')) {
    const submissionId = url.searchParams.get('submission_id')?.replace(/^eq\./, '') ?? '';
    const row = records.get(submissionId);
    return Promise.resolve(Response.json(row ? [{ id: row.id, notification_accepted_at: row.notification_accepted_at ?? null }] : []));
  }

  if (url.pathname.endsWith('/rest/v1/enquiries') && method === 'HEAD') {
    const status = url.searchParams.get('status')?.replace(/^eq\./, '');
    const matched = [...records.values()].filter((row) => !status || row.status === status);
    return Promise.resolve(new Response(null, { headers: { 'Content-Range': `0-0/${matched.length}` } }));
  }

  if (url.pathname.endsWith('/rest/v1/enquiries') && method === 'PATCH') {
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    const row = [...records.values()].find((item) => item.id === id);
    if (row) Object.assign(row, JSON.parse(String(init?.body)));
    return Promise.resolve(Response.json(row ? [{ id: row.id, status: row.status }] : []));
  }

  if (url.pathname.endsWith('/rest/v1/enquiries') && method === 'DELETE') {
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    const entry = [...records.entries()].find(([, row]) => row.id === id);
    if (entry) records.delete(entry[0]);
    return Promise.resolve(Response.json(entry ? [entry[1]] : []));
  }

  if (url.pathname.endsWith('/rest/v1/enquiries')) {
    const rows = [...records.values()];
    return Promise.resolve(Response.json(rows, { headers: { 'Content-Range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` } }));
  }

  return Promise.resolve(new Response('Not found', { status: 404 }));
}

const env = {
  ALLOWED_ORIGINS: 'https://akon.example,http://localhost:3000',
  ADMIN_USER_ID: adminId,
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-key',
  RATE_LIMITER: {
    async limit({ key }: { key: string }) {
      const count = rateCounts.get(key) ?? 0;
      rateCounts.set(key, count + 1);
      return { success: count < 5 };
    },
  },
};

function request(path: string, options: RequestInit = {}, origin = 'https://akon.example'): Request {
  const headers = new Headers(options.headers);
  headers.set('Origin', origin);
  headers.set('CF-Connecting-IP', '203.0.113.24');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (path.startsWith('/api/admin/')) headers.set('Authorization', 'Bearer valid-admin-token');
  return new Request(`https://worker.example${path}`, { ...options, headers });
}

async function call(path: string, options: RequestInit = {}, origin?: string): Promise<Response> {
  return worker.fetch(request(path, options, origin), env);
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  records.clear();
  rateCounts.clear();
  resendResponse = null;
  fetchCount = 0;
});

describe('Worker public enquiry API', () => {
  it('confirms the Supabase table is reachable on the health route', async () => {
    globalThis.fetch = fakeFetch;
    const response = await call('/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, configured: true });
  });

  it('returns a valid preflight response for an allowed origin', async () => {
    const response = await call('/api/enquiries', { method: 'OPTIONS' });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://akon.example');
    assert.match(response.headers.get('Access-Control-Allow-Methods') ?? '', /POST/);
  });

  it('rejects origins not explicitly allowlisted', async () => {
    const response = await call('/api/enquiries', { method: 'POST', body: JSON.stringify(validSubmission) }, 'https://attacker.example');
    assert.equal(response.status, 403);
    assert.equal(fetchCount, 0);
  });

  it('validates and stores a submission without exposing the service key', async () => {
    globalThis.fetch = fakeFetch;
    const response = await call('/api/enquiries', { method: 'POST', body: JSON.stringify(validSubmission) });
    const body = await response.json() as { enquiryId?: string; notification?: string };

    assert.equal(response.status, 201);
    assert.ok(body.enquiryId);
    assert.equal(body.notification, 'not_configured');
    assert.equal(records.size, 1);
    assert.equal([...records.values()][0].email, 'ananya@example.com');
  });

  it('rejects invalid input and honeypot submissions', async () => {
    globalThis.fetch = fakeFetch;
    const invalid = await call('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify({ ...validSubmission, email: 'bad-email' }),
    });
    assert.equal(invalid.status, 400);
    assert.equal(records.size, 0);

    const spam = await call('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify({ ...validSubmission, website: 'bot-filled-this' }),
    });
    assert.equal(spam.status, 400);
    assert.equal(records.size, 0);
  });

  it('is idempotent for a retried submission key', async () => {
    globalThis.fetch = fakeFetch;
    const first = await call('/api/enquiries', { method: 'POST', body: JSON.stringify(validSubmission) });
    const retry = await call('/api/enquiries', { method: 'POST', body: JSON.stringify(validSubmission) });
    assert.equal(first.status, 201);
    assert.equal(retry.status, 200);
    assert.equal(records.size, 1);
  });

  it('enforces the per-IP submission limit', async () => {
    globalThis.fetch = fakeFetch;
    for (let index = 0; index < 5; index++) {
      const body = { ...validSubmission, submissionId: crypto.randomUUID() };
      assert.equal((await call('/api/enquiries', { method: 'POST', body: JSON.stringify(body) })).status, 201);
    }

    const limited = await call('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify({ ...validSubmission, submissionId: crypto.randomUUID() }),
    });
    assert.equal(limited.status, 429);
  });

  it('reports Resend acceptance separately from confirmed email delivery', async () => {
    globalThis.fetch = fakeFetch;
    resendResponse = Response.json({ id: 'email-provider-id' });
    Object.assign(env, {
      RESEND_API_KEY: 'server-only-resend-key',
      RESEND_FROM_EMAIL: 'studio@example.com',
      NOTIFICATION_TO_EMAIL: 'admin@example.com',
    });
    const response = await call('/api/enquiries', { method: 'POST', body: JSON.stringify(validSubmission) });
    const body = await response.json() as { notification?: string };
    assert.equal(response.status, 201);
    assert.equal(body.notification, 'accepted');
    assert.ok([...records.values()][0].notification_accepted_at);
  });
});

describe('Worker admin API', () => {
  it('requires Supabase authentication and the configured admin user ID', async () => {
    globalThis.fetch = fakeFetch;
    const noToken = new Request('https://worker.example/api/admin/enquiries', {
      headers: { Origin: 'https://akon.example' },
    });
    const unauthorized = await worker.fetch(noToken, env);
    assert.equal(unauthorized.status, 401);

    const forbiddenEnv = { ...env, ADMIN_USER_ID: 'd2bbecad-5b58-49bd-841a-126667d26919' };
    const forbidden = await worker.fetch(request('/api/admin/enquiries'), forbiddenEnv);
    assert.equal(forbidden.status, 403);
  });

  it('returns protected counts and enquiry records', async () => {
    globalThis.fetch = fakeFetch;
    records.set(validSubmission.submissionId, {
      id: '0fe7862c-85a3-4f97-afc8-13b4ae602982',
      name: validSubmission.fullName,
      email: validSubmission.email,
      business_name: validSubmission.business,
      project_type: validSubmission.projectType,
      budget: validSubmission.budget,
      description: validSubmission.details,
      contact_preference: validSubmission.preferredContact,
      status: 'new',
      created_at: new Date().toISOString(),
    });
    const response = await call('/api/admin/enquiries');
    const body = await response.json() as { enquiries: unknown[]; counts: { all: number } };
    assert.equal(response.status, 200);
    assert.equal(body.enquiries.length, 1);
    assert.equal(body.counts.all, 1);
  });

  it('updates and deletes an enquiry after validating the requested status', async () => {
    globalThis.fetch = fakeFetch;
    records.set(validSubmission.submissionId, {
      id: '0fe7862c-85a3-4f97-afc8-13b4ae602982',
      name: validSubmission.fullName,
      status: 'new',
    });
    const id = '0fe7862c-85a3-4f97-afc8-13b4ae602982';
    const invalidStatus = await call(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'administrator' }),
    });
    assert.equal(invalidStatus.status, 400);

    const updated = await call(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'discussion' }),
    });
    assert.equal(updated.status, 200);
    assert.equal([...records.values()][0].status, 'discussion');

    const deleted = await call(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.equal(records.size, 0);
  });
});
