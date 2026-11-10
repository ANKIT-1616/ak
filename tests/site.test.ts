import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildContactMessage,
  buildMailtoHref,
  buildWhatsAppHref,
  validateContactForm,
} from '../src/lib/site.ts';
import { site } from '../src/content/site.ts';

const validEnquiry = {
  fullName: 'Ananya Rao',
  email: 'ananya@example.com',
  business: 'A_KON Studio',
  projectType: 'Business Website',
  budget: '₹20,000–₹40,000',
  details: 'I would like to discuss a refreshed website for my business.',
  preferredContact: 'WhatsApp' as const,
};

describe('Project enquiry form validation', () => {
  it('requires all backend-supported fields', () => {
    const errors = validateContactForm({});
    assert.equal(typeof errors.fullName, 'string');
    assert.equal(typeof errors.email, 'string');
    assert.equal(typeof errors.projectType, 'string');
    assert.equal(typeof errors.budget, 'string');
    assert.equal(typeof errors.details, 'string');
    assert.equal(typeof errors.preferredContact, 'string');
  });

  it('accepts a complete enquiry without a business name', () => {
    assert.deepEqual(validateContactForm({ ...validEnquiry, business: '' }), {});
  });

  it('rejects invalid email addresses and project details outside server limits', () => {
    assert.equal(
      validateContactForm({ ...validEnquiry, email: 'not-an-email' }).email,
      'Please enter a valid email address.',
    );
    assert.equal(
      validateContactForm({ ...validEnquiry, details: 'Hi' }).details,
      'Project details must be between 10 and 5,000 characters.',
    );
  });
});

describe('Direct contact links', () => {
  it('builds a WhatsApp link using the configured international number', () => {
    const href = buildWhatsAppHref('+91 999-888-7777', 'Hello from test');
    assert.equal(href, 'https://wa.me/919998887777?text=Hello%20from%20test');
  });

  it('does not build a WhatsApp link when a number is missing or invalid', () => {
    assert.equal(buildWhatsAppHref('', 'Hello'), null);
    assert.equal(buildWhatsAppHref('0000000', 'Hello'), null);
    assert.equal(buildWhatsAppHref('call +91 999 888 7777', 'Hello'), null);
  });

  it('builds a direct mailto link for the configured studio email', () => {
    assert.equal(buildMailtoHref(site.contact.email), 'mailto:akon25880@gmail.com');
  });

  it('includes all submitted project details in the WhatsApp and email drafts', () => {
    const message = buildContactMessage(validEnquiry);
    assert.match(message, /Name: Ananya Rao/);
    assert.match(message, /Email: ananya@example\.com/);
    assert.match(message, /Project Details:\nI would like to discuss a refreshed website/);
    assert.match(message, /Preferred Contact Method: WhatsApp/);

    const mailto = buildMailtoHref(site.contact.email, validEnquiry);
    assert.ok(mailto);
    assert.match(decodeURIComponent(mailto), /subject=Project enquiry — Ananya Rao/);
    assert.match(decodeURIComponent(mailto), /Project Details:\nI would like to discuss a refreshed website/);
  });

  it('does not build a mailto link without a valid recipient', () => {
    assert.equal(buildMailtoHref(''), null);
    assert.equal(buildMailtoHref('invalid-address'), null);
  });
});

describe('Site content and structure integrity', () => {
  it('contains the studio branding and location', () => {
    assert.equal(site.mark, 'A_KON®');
    assert.equal(site.founder, 'Ankit');
    assert.equal(site.location, 'India');
  });

  it('maintains all four core service categories', () => {
    assert.equal(site.services.length, 4);
    const titles = site.services.map((service) => service.title);
    assert.ok(titles.includes('DIGITAL EXPERIENCES'));
    assert.ok(titles.includes('BRAND & CREATIVE'));
    assert.ok(titles.includes('DIGITAL GROWTH'));
    assert.ok(titles.includes('BUSINESS SYSTEMS'));
  });

  it('maintains all four process steps', () => {
    assert.equal(site.process.length, 4);
    assert.equal(site.process[0].title, 'DISCOVER');
    assert.equal(site.process[3].title, 'LAUNCH & EVOLVE');
  });

  it('includes the verified Mooch Saloon project URL and features', () => {
    assert.equal(site.work.project, 'MOOCH SALOON');
    assert.equal(site.work.url, 'https://mooch-saloon.vercel.app/');
    assert.ok(site.work.features.length >= 5);
  });

  it('contains the configured WhatsApp number and professional email', () => {
    assert.equal(site.contact.whatsappNumber, '+918000406352');
    assert.equal(site.contact.email, 'akon25880@gmail.com');
    assert.equal(
      buildWhatsAppHref(site.contact.whatsappNumber, 'Hello Ankit, I would love to discuss a project.'),
      'https://wa.me/918000406352?text=Hello%20Ankit%2C%20I%20would%20love%20to%20discuss%20a%20project.',
    );
  });
});
