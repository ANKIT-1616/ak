import { ArrowUpRight, CheckCircle2, Loader2, Send } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { site } from '../content/site';
import {
  buildDynamicWhatsAppMessage,
  buildWhatsAppHref,
  ContactFormData,
  validateContactForm,
  ValidationErrors,
} from '../lib/site';
import { Reveal, SectionIntro } from './reveal';

const emptyForm: ContactFormData = {
  firstName: '',
  lastName: '',
  business: '',
  email: '',
  phone: '',
  service: '',
  budget: '',
  description: '',
};

export function Contact() {
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'notice' | 'error' | 'success'; message: string } | null>(null);

  const endpoint = site.contact.formEndpoint;

  // Dynamic WhatsApp link incorporating typed values
  const dynamicMessage = buildDynamicWhatsAppMessage(form);
  const whatsappHref = buildWhatsAppHref(site.contact.whatsappNumber, dynamicMessage);

  const update = (key: keyof ContactFormData, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateContactForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFeedback({
        type: 'error',
        message: 'Please review and correct the highlighted fields above.',
      });
      return;
    }

    if (!endpoint) {
      setFeedback({
        type: 'notice',
        message:
          'Your enquiry is validated and structured! Since a custom backend form endpoint has not been added to site.ts yet, please click "Send via WhatsApp" below to instantly send these exact details to Ankit.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFeedback({
          type: 'success',
          message: 'Thank you! Your enquiry has been sent. We will get back to you within 24 hours.',
        });
        setForm(emptyForm);
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch {
      setFeedback({
        type: 'error',
        message:
          'There was an issue sending your message directly. Please use WhatsApp or email to reach us immediately.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact section-shell section-dark" id="contact" aria-labelledby="contact-title">
      <div className="contact-heading">
        <Reveal>
          <SectionIntro index="06" label="START A CONVERSATION" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 id="contact-title" className="display-stack compact">
            <span>{site.contact.headline[0]}</span>
            <span>
              LET’S <span className="serif-accent">BUILD IT</span><span className="text-lime">.</span>
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="lede">{site.contact.supporting}</p>
        </Reveal>
      </div>

      <div className="contact-layout">
        {isSubmitted ? (
          <div className="submission-success" role="status" aria-live="polite">
            <CheckCircle2 size={42} className="text-lime" aria-hidden="true" />
            <h3>Enquiry Received</h3>
            <p>{feedback?.message}</p>
            <button
              type="button"
              className="button button-outline mt-6"
              onClick={() => {
                setIsSubmitted(false);
                setFeedback(null);
              }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            className="contact-form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Contact studio form"
          >
            <div className="form-row">
              <Field
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={(value) => update('firstName', value)}
                error={errors.firstName}
                required
              />
              <Field
                label="Last name"
                name="lastName"
                value={form.lastName || ''}
                onChange={(value) => update('lastName', value)}
              />
            </div>

            <div className="form-row">
              <Field
                label="Business / Brand"
                name="business"
                value={form.business || ''}
                onChange={(value) => update('business', value)}
              />
              <Field
                label="Email"
                name="email"
                value={form.email}
                onChange={(value) => update('email', value)}
                error={errors.email}
                type="email"
                required
              />
            </div>

            <div className="form-row">
              <Field
                label="Phone (optional)"
                name="phone"
                value={form.phone || ''}
                onChange={(value) => update('phone', value)}
                error={errors.phone}
                type="tel"
              />
              <SelectField
                label="Service required"
                name="service"
                value={form.service || ''}
                onChange={(value) => update('service', value)}
                options={[
                  'Digital Experiences (Web Design & Development)',
                  'Brand & Creative (Identity & Art Direction)',
                  'Digital Growth (SEO, Strategy & Social)',
                  'Business Systems (Custom Web Apps & CRM)',
                ]}
              />
            </div>

            <div className="form-row">
              <SelectField
                label="Project budget"
                name="budget"
                value={form.budget || ''}
                onChange={(value) => update('budget', value)}
                options={['Under ₹50k', '₹50k — ₹1L', '₹1L — ₹3L', '₹3L+ / Ongoing Retainer']}
              />
              <div aria-hidden="true" className="hidden sm:block" />
            </div>

            <label className={`field field-full ${errors.description ? 'has-error' : ''}`}>
              <span>
                Project description <em>*</em>
              </span>
              <textarea
                name="description"
                rows={5}
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Tell us about your brand, goals, timeline, and vision..."
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'description-error' : undefined}
                required
              />
              {errors.description && (
                <small id="description-error" className="field-error" role="alert">
                  {errors.description}
                </small>
              )}
            </label>

            <div className="form-actions">
              <button
                className="button button-solid"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span>Sending...</span>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span>Send enquiry</span>
                    <Send size={16} aria-hidden="true" />
                  </>
                )}
              </button>

              {site.contact.whatsappNumber ? (
                <a
                  className="button button-outline"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Direct WhatsApp chat with prefilled enquiry details"
                >
                  <span>Chat on WhatsApp</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ) : (
                <span className="button button-outline is-disabled" aria-disabled="true" title="WhatsApp number can be set in src/content/site.ts">
                  <span>WhatsApp ready to configure</span>
                </span>
              )}
            </div>

            {feedback && (
              <div
                className={`form-feedback feedback-${feedback.type}`}
                role={feedback.type === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                <p>{feedback.message}</p>
                {feedback.type === 'notice' && site.contact.whatsappNumber && (
                  <a
                    className="button button-solid inline-flex mt-3"
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open WhatsApp with this enquiry <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </form>
        )}

        <aside className="contact-aside" aria-label="Direct studio contact options">
          <span className="detail-label">DIRECT LINE</span>
          <p>Prefer a direct conversation without filling out the form?</p>
          <div className="contact-detail-links">
            {site.contact.email ? (
              <a className="contact-aside-link" href={`mailto:${site.contact.email}`}>
                <span>{site.contact.email}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ) : null}

            {site.contact.phone ? (
              <a className="contact-aside-link" href={`tel:${site.contact.phone}`}>
                <span>{site.contact.phone}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ) : null}

            {!site.contact.email && !site.contact.phone && (
              <span className="contact-placeholder">Direct email & phone to be configured</span>
            )}
          </div>

          <span className="detail-label">STUDIO LOCATION</span>
          <p className="small-note">{site.location} — Operating globally with remote-first collaboration.</p>

          <span className="detail-label">RESPONSE TIME</span>
          <p className="small-note">We typically reply within 24 business hours with initial thoughts and next steps.</p>
        </aside>
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
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  const errorId = `${name}-error`;
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span>
        {label} {required && <em>*</em>}
      </span>
      <input
        id={`field-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        required={required}
      />
      {error && (
        <small id={errorId} className="field-error" role="alert">
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
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="select-wrapper">
        <select
          id={`field-${name}`}
          name={name}
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        >
          <option value="">Select option...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
