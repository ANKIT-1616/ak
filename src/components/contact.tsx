import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import { site } from '../content/site';
import {
  buildContactMessage,
  buildMailtoHref,
  buildWhatsAppHref,
  validateContactForm,
} from '../lib/site';
import type { ContactFormData, ValidationErrors } from '../lib/site';
import { Reveal, SectionIntro } from './reveal';

const emptyForm: ContactFormData = {
  fullName: '',
  email: '',
  business: '',
  projectType: '',
  budget: '',
  details: '',
  preferredContact: '',
};

type Feedback = {
  type: 'error' | 'success';
  message: string;
};

export function Contact() {
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const submissionLocked = useRef(false);

  const message = buildContactMessage(form);
  const whatsappHref = buildWhatsAppHref(site.contact.whatsappNumber, message);
  const emailHref = buildMailtoHref(site.contact.email, form);

  const update = (key: keyof ContactFormData, value: string) => {
    if (submissionLocked.current) return;
    setForm((current) => ({ ...current, [key]: value }));
    setSubmissionId(crypto.randomUUID());
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLocked.current) return;

    const validationErrors = validateContactForm(form);
    setErrors(validationErrors);
    setFeedback(null);

    if (Object.keys(validationErrors).length > 0) {
      setFeedback({
        type: 'error',
        message: 'A few details need your attention. Please check the fields marked below.',
      });
      window.requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
    if (!apiBase) {
      setFeedback({
        type: 'error',
        message: 'The enquiry service is not configured, so your details were not submitted. Please try again later.',
      });
      return;
    }

    submissionLocked.current = true;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          submissionId,
          website: honeypotRef.current?.value ?? '',
        }),
      });

      let result: Record<string, unknown> = {};
      try {
        const body: unknown = await response.json();
        if (body && typeof body === 'object' && !Array.isArray(body)) {
          result = body as Record<string, unknown>;
        }
      } catch {
        throw new Error('The enquiry service returned an unreadable response. Please retry; your details are still here.');
      }

      if (!response.ok) {
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Your enquiry could not be saved. Please try again.',
        );
      }
      if (typeof result.enquiryId !== 'string' || !result.enquiryId) {
        throw new Error('We could not confirm that your enquiry was saved. Please retry; the same submission will be checked.');
      }

      setIsSubmitted(true);
      setFeedback({
        type: 'success',
        message: result.notification === 'accepted'
          ? 'Your enquiry has been saved, and the email alert was accepted by the studio’s email provider. Delivery is not confirmed.'
          : result.notification === 'failed'
            ? 'Your enquiry has been saved, but the studio email alert was not accepted by its provider.'
            : 'Your enquiry has been saved for review. No email notification was sent.',
      });
    } catch (error) {
      submissionLocked.current = false;
      setFeedback({
        type: 'error',
        message: error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : 'We could not confirm that your enquiry was saved. Your details are still here; retrying will safely check the same submission.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAnotherEnquiry = () => {
    setForm(emptyForm);
    setErrors({});
    setFeedback(null);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmissionId(crypto.randomUUID());
    submissionLocked.current = false;
  };

  return (
    <section className="contact section-shell" id="contact" aria-labelledby="contact-title">
      <div className="contact-layout">
        <div className="contact-intro">
          <Reveal>
            <div className="contact-heading-meta">
              <SectionIntro index="06" label="LET'S CONNECT" />
              <p className="contact-availability">
                <span className="availability-dot" aria-hidden="true" />
                {site.contact.availability}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="contact-title" className="contact-title">
              <span>Have a project</span>
              <span>in mind?</span>
              <span className="serif-accent">Let&apos;s make</span>
              <span className="serif-accent">it happen.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="contact-lede">
              Have an idea, a business to grow, or a website that needs a fresh direction? Tell me about it. Let&apos;s
              create something meaningful.
            </p>
          </Reveal>
        </div>

        <Reveal className="contact-form-reveal" delay={0.12}>
          <div className="contact-form-panel">
            {isSubmitted ? (
              <div className="submission-success" role="status" aria-live="polite">
                <span className="success-index">ENQUIRY / SAVED</span>
                <h3>Thank you. I’ll be in touch.</h3>
                <p>{feedback?.message}</p>
                <div className="contact-success-actions">
                  {form.preferredContact === 'Email' && emailHref ? (
                    <a className="button button-solid" href={emailHref}>
                      <span>Open email draft</span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  ) : whatsappHref ? (
                    <a className="button button-solid" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      <span>Continue on WhatsApp</span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
                <button className="contact-reset" type="button" onClick={startAnotherEnquiry}>
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form ref={formRef} className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form-topline">
                  <span className="contact-form-index">A_KON / 06</span>
                  <span className="contact-form-note">A LITTLE ABOUT YOUR PROJECT</span>
                </div>

                <div className="contact-honeytrap" aria-hidden="true">
                  <label htmlFor="contact-website">Leave this field empty</label>
                  <input
                    ref={honeypotRef}
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="contact-fields-grid">
                  <Field
                    label="Full name"
                    name="fullName"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(value) => update('fullName', value)}
                    error={errors.fullName}
                    required
                  />
                  <Field
                    label="Email address"
                    name="email"
                    autoComplete="email"
                    type="email"
                    value={form.email}
                    onChange={(value) => update('email', value)}
                    error={errors.email}
                    required
                  />
                  <Field
                    label="Business / brand"
                    name="business"
                    autoComplete="organization"
                    value={form.business}
                    onChange={(value) => update('business', value)}
                    error={errors.business}
                    optional
                  />
                  <SelectField
                    label="Project type"
                    name="projectType"
                    value={form.projectType}
                    onChange={(value) => update('projectType', value)}
                    error={errors.projectType}
                    options={[
                      'Business Website',
                      'Portfolio Website',
                      'E-commerce Website',
                      'Restaurant / Cafe Website',
                      'UI/UX Design',
                      'Website Redesign',
                      'Other',
                    ]}
                    required
                  />
                  <SelectField
                    label="Approximate budget"
                    name="budget"
                    value={form.budget}
                    onChange={(value) => update('budget', value)}
                    error={errors.budget}
                    options={['Under ₹10,000', '₹10,000–₹20,000', '₹20,000–₹40,000', '₹40,000+']}
                    required
                  />
                  <SelectField
                    label="Preferred contact method"
                    name="preferredContact"
                    value={form.preferredContact}
                    onChange={(value) => update('preferredContact', value)}
                    error={errors.preferredContact}
                    options={['WhatsApp', 'Email']}
                    required
                  />
                  <label className={`contact-field contact-field-full ${errors.details ? 'has-error' : ''}`}>
                    <span>
                      Project description <em>*</em>
                    </span>
                    <textarea
                      id="contact-field-details"
                      name="details"
                      rows={5}
                      value={form.details}
                      onChange={(event) => update('details', event.target.value)}
                      placeholder="What are you building, and what would you like it to do?"
                      aria-invalid={Boolean(errors.details)}
                      aria-describedby={errors.details ? 'contact-details-error' : undefined}
                      required
                    />
                    {errors.details && (
                      <small id="contact-details-error" className="contact-field-error" role="alert">
                        {errors.details}
                      </small>
                    )}
                  </label>
                </div>

                {isSubmitting && (
                  <p className="form-feedback" role="status" aria-live="polite">
                    Saving your enquiry…
                  </p>
                )}
                {feedback && !isSubmitting && (
                  <div
                    className={`form-feedback feedback-${feedback.type}`}
                    role={feedback.type === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                  >
                    <p>{feedback.message}</p>
                  </div>
                )}

                <div className="form-actions">
                  <button className="button button-solid contact-submit" type="submit" disabled={isSubmitting}>
                    <span>{isSubmitting ? 'Saving your enquiry…' : 'Send your enquiry'}</span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                  <p className="form-note">Your details are only shared with the studio.</p>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  required = false,
  optional = false,
}: {
  label: string;
  name: keyof ContactFormData;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  optional?: boolean;
}) {
  const errorId = `contact-${name}-error`;
  return (
    <label className={`contact-field ${error ? 'has-error' : ''}`}>
      <span>
        {label} {required && <em>*</em>} {optional && <small>(optional)</small>}
      </span>
      <input
        id={`contact-field-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={type === 'email' ? 'email' : undefined}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        required={required}
      />
      {error && (
        <small id={errorId} className="contact-field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  error,
  options,
  required = false,
}: {
  label: string;
  name: keyof ContactFormData;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: string[];
  required?: boolean;
}) {
  const errorId = `contact-${name}-error`;
  return (
    <label className={`contact-field ${error ? 'has-error' : ''}`}>
      <span>
        {label} {required && <em>*</em>}
      </span>
      <span className="contact-select-wrap">
        <select
          id={`contact-field-${name}`}
          name={name}
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required={required}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </span>
      {error && (
        <small id={errorId} className="contact-field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
