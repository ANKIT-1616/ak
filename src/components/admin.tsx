import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, LogOut, RefreshCw, Trash2 } from 'lucide-react';
import {
  AdminEnquiry,
  AdminSession,
  EnquiryList,
  EnquiryStatus,
  deleteEnquiry,
  getEnquiries,
  signInAdmin,
  updateEnquiryStatus,
} from '../lib/admin-api';

const pageSize = 50;

const statusNames: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  discussion: 'Active discussion',
  completed: 'Completed',
};

export function AdminDashboard() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState<EnquiryList | null>(null);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyEnquiry, setBusyEnquiry] = useState<string | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Admin — A_KON Digital Studio';
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robots = existingRobots ?? document.createElement('meta');
    const originalRobots = existingRobots?.content;
    if (!existingRobots) {
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = 'noindex, nofollow';

    return () => {
      document.title = previousTitle;
      if (existingRobots && originalRobots !== undefined) robots.content = originalRobots;
      else robots.remove();
    };
  }, []);

  const loadPage = useCallback(async (accessToken: string, pageOffset: number) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getEnquiries(accessToken, pageOffset, pageSize);
      setData(result);
      setOffset(pageOffset);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Enquiries could not be loaded.';
      setError(message);
      if (message.includes('sign in again')) setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSigningIn(true);
    setError('');
    try {
      const nextSession = await signInAdmin(email, password);
      setPassword('');
      setSession(nextSession);
      await loadPage(nextSession.accessToken, 0);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleStatusChange = async (enquiry: AdminEnquiry, nextStatus: EnquiryStatus) => {
    if (!session || enquiry.status === nextStatus) return;
    setBusyEnquiry(enquiry.id);
    setError('');
    setNotice('');
    try {
      await updateEnquiryStatus(session.accessToken, enquiry.id, nextStatus);
      setNotice('Enquiry status updated.');
      await loadPage(session.accessToken, offset);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Status could not be updated.');
    } finally {
      setBusyEnquiry(null);
    }
  };

  const handleDelete = async (enquiry: AdminEnquiry) => {
    if (!session || !window.confirm(`Permanently delete the enquiry from ${enquiry.name}? This cannot be undone.`)) return;
    setBusyEnquiry(enquiry.id);
    setError('');
    setNotice('');
    try {
      await deleteEnquiry(session.accessToken, enquiry.id);
      setNotice('Enquiry deleted.');
      const nextOffset = data && data.enquiries.length === 1 && offset > 0 ? Math.max(0, offset - pageSize) : offset;
      await loadPage(session.accessToken, nextOffset);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Enquiry could not be deleted.');
    } finally {
      setBusyEnquiry(null);
    }
  };

  const handleSignOut = () => {
    setSession(null);
    setData(null);
    setPassword('');
    setError('');
    setNotice('');
  };

  if (!session) {
    return (
      <main className="admin-page">
        <a className="admin-back-link" href="/">
          <ArrowLeft size={15} aria-hidden="true" /> Back to A_KON
        </a>
        <section className="admin-login" aria-labelledby="admin-title">
          <span className="admin-eyebrow">A_KON® / PRIVATE AREA</span>
          <h1 id="admin-title">Enquiry dashboard</h1>
          <p>Sign in with the studio admin account to view project enquiries.</p>
          <form onSubmit={handleSignIn} className="admin-login-form">
            <label>
              <span>Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className="admin-alert" role="alert">{error}</p>}
            <button type="submit" className="button button-solid" disabled={isSigningIn}>
              {isSigningIn ? 'Signing in…' : 'Sign in'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          <p className="admin-login-note">
            Admin access is provisioned in Supabase. Public sign-up is not available.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="admin-brand" href="/" aria-label="A_KON home">A_KON<span>®</span></a>
        <div className="admin-header-actions">
          <span>{session.email}</span>
          <button type="button" className="admin-quiet-button" onClick={handleSignOut}>
            <LogOut size={15} aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>

      <section className="admin-content" aria-labelledby="admin-title">
        <div className="admin-title-row">
          <div>
            <span className="admin-eyebrow">STUDIO / ENQUIRIES</span>
            <h1 id="admin-title">Project enquiries</h1>
          </div>
          <button
            type="button"
            className="admin-quiet-button"
            onClick={() => void loadPage(session.accessToken, offset)}
            disabled={isLoading}
          >
            <RefreshCw size={15} aria-hidden="true" /> Refresh
          </button>
        </div>

        <div className="admin-stats" aria-label="Enquiry totals">
          <Stat label="Total enquiries" value={data?.counts.all ?? 0} />
          <Stat label="New" value={data?.counts.new ?? 0} />
          <Stat label="Contacted" value={data?.counts.contacted ?? 0} />
          <Stat label="Active discussions" value={data?.counts.discussion ?? 0} />
          <Stat label="Completed" value={data?.counts.completed ?? 0} />
        </div>

        {error && <p className="admin-alert" role="alert">{error}</p>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}

        {isLoading && !data ? (
          <p className="admin-empty">Loading enquiries…</p>
        ) : data?.enquiries.length ? (
          <div className="admin-enquiry-list">
            {data.enquiries.map((enquiry) => (
              <article className="admin-enquiry" key={enquiry.id}>
                <div className="admin-enquiry-head">
                  <div className="admin-person">
                    <h2>{enquiry.name}</h2>
                    <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                    <p>{enquiry.business_name || 'Independent enquiry'} · {formatDate(enquiry.created_at)}</p>
                  </div>
                  <label className="admin-status-control">
                    <span>Status</span>
                    <select
                      value={enquiry.status}
                      disabled={busyEnquiry === enquiry.id}
                      onChange={(event) => void handleStatusChange(enquiry, event.target.value as EnquiryStatus)}
                      aria-label={`Status for enquiry from ${enquiry.name}`}
                    >
                      {Object.entries(statusNames).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <dl className="admin-enquiry-meta">
                  <div><dt>Project</dt><dd>{enquiry.project_type}</dd></div>
                  <div><dt>Budget</dt><dd>{enquiry.budget}</dd></div>
                  <div><dt>Preferred contact</dt><dd>{enquiry.contact_preference}</dd></div>
                </dl>
                <p className="admin-description">{enquiry.description}</p>
                <div className="admin-enquiry-actions">
                  <a href={`mailto:${enquiry.email}`} className="admin-quiet-button">Reply by email</a>
                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => void handleDelete(enquiry)}
                    disabled={busyEnquiry === enquiry.id}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">{isLoading ? 'Loading enquiries…' : 'No enquiries yet.'}</p>
        )}

        {data && data.total > pageSize && (
          <nav className="admin-pagination" aria-label="Enquiry pages">
            <button
              type="button"
              className="admin-quiet-button"
              onClick={() => void loadPage(session.accessToken, Math.max(0, offset - pageSize))}
              disabled={offset === 0 || isLoading}
            >
              <ArrowLeft size={14} aria-hidden="true" /> Previous
            </button>
            <span>{offset + 1}–{Math.min(offset + data.enquiries.length, data.total)} of {data.total}</span>
            <button
              type="button"
              className="admin-quiet-button"
              onClick={() => void loadPage(session.accessToken, offset + pageSize)}
              disabled={offset + pageSize >= data.total || isLoading}
            >
              Next <ArrowRight size={14} aria-hidden="true" />
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(date);
}
