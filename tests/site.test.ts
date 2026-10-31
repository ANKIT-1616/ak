import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateContactForm,
  buildDynamicWhatsAppMessage,
  buildWhatsAppHref,
} from '../src/lib/site.ts';
import { site } from '../src/content/site.ts';

describe('Contact Form Validation', () => {
  it('should flag errors when required fields are empty', () => {
    const errors = validateContactForm({});
    assert.equal(typeof errors.firstName, 'string');
    assert.equal(typeof errors.email, 'string');
    assert.equal(typeof errors.description, 'string');
  });

  it('should flag invalid email formats', () => {
    const errors = validateContactForm({
      firstName: 'Ankit',
      email: 'not-an-email',
      description: 'Building a new brand platform for luxury fashion.',
    });
    assert.equal(errors.firstName, undefined);
    assert.equal(errors.email, 'Please enter a valid email address.');
  });

  it('should flag descriptions that are too short', () => {
    const errors = validateContactForm({
      firstName: 'Ankit',
      email: 'ankit@example.com',
      description: 'Hi',
    });
    assert.equal(errors.description, 'Please provide a bit more detail (at least 10 characters).');
  });

  it('should pass on valid complete input', () => {
    const errors = validateContactForm({
      firstName: 'Jane',
      lastName: 'Doe',
      business: 'Aura Studio',
      email: 'jane@aura.com',
      phone: '+91 98765 43210',
      description: 'Need a complete brand identity and responsive e-commerce web application.',
    });
    assert.deepEqual(errors, {});
  });

  it('should validate phone format if provided', () => {
    const errors = validateContactForm({
      firstName: 'Jane',
      email: 'jane@aura.com',
      phone: 'invalid-phone-abc',
      description: 'Looking to build a custom responsive platform.',
    });
    assert.equal(errors.phone, 'Please enter a valid phone number.');
  });
});

describe('Dynamic WhatsApp Link Generation', () => {
  it('should generate default message when fields are empty', () => {
    const message = buildDynamicWhatsAppMessage({});
    assert.match(message, /Hello A_KON Digital Studio!/);
    assert.match(message, /I would like to discuss a new digital project/);
  });

  it('should format message with name, business, service, budget, and description', () => {
    const message = buildDynamicWhatsAppMessage({
      firstName: 'Rahul',
      lastName: 'Sharma',
      business: 'Mooch Saloon',
      service: 'Digital Experiences',
      budget: '₹1L — ₹3L',
      description: 'Redesigning our customer grooming platform',
    });

    assert.match(message, /Rahul Sharma from Mooch Saloon/);
    assert.match(message, /Service needed: Digital Experiences/);
    assert.match(message, /Project budget: ₹1L — ₹3L/);
    assert.match(message, /Redesigning our customer grooming platform/);
  });

  it('should build proper WhatsApp href with clean digits', () => {
    const href = buildWhatsAppHref('+91 999-888-7777', 'Hello from test');
    assert.equal(href.startsWith('https://wa.me/919998887777?text=Hello%20from%20test'), true);
  });

  it('should handle empty number gracefully', () => {
    const href = buildWhatsAppHref('', 'Test Message');
    assert.equal(href.startsWith('https://wa.me/?text=Test%20Message'), true);
  });
});

describe('Site Content & Structure Integrity', () => {
  it('should contain verified studio branding and location', () => {
    assert.equal(site.mark, 'A_KON®');
    assert.equal(site.founder, 'Ankit');
    assert.equal(site.location, 'India');
  });

  it('should maintain all 4 core service categories', () => {
    assert.equal(site.services.length, 4);
    const titles = site.services.map((s) => s.title);
    assert.ok(titles.includes('DIGITAL EXPERIENCES'));
    assert.ok(titles.includes('BRAND & CREATIVE'));
    assert.ok(titles.includes('DIGITAL GROWTH'));
    assert.ok(titles.includes('BUSINESS SYSTEMS'));
  });

  it('should maintain all 4 process steps', () => {
    assert.equal(site.process.length, 4);
    assert.equal(site.process[0].title, 'DISCOVER');
    assert.equal(site.process[3].title, 'LAUNCH & EVOLVE');
  });

  it('should include Mooch Saloon with live URL and verified features', () => {
    assert.equal(site.work.project, 'MOOCH SALOON');
    assert.equal(site.work.url, 'https://mooch-saloon.vercel.app/');
    assert.ok(site.work.features.length >= 5);
  });
});
