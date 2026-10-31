export const publicOrigin = '';

export interface ContactFormData {
  firstName: string;
  lastName?: string;
  business?: string;
  email: string;
  phone?: string;
  service?: string;
  budget?: string;
  description: string;
}

export interface ValidationErrors {
  firstName?: string;
  email?: string;
  description?: string;
  phone?: string;
}

/**
 * Validates the contact form fields.
 */
export function validateContactForm(data: Partial<ContactFormData>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.firstName || !data.firstName.trim()) {
    errors.firstName = 'Please add your first name.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Please add your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.description || !data.description.trim()) {
    errors.description = 'Please tell us a little about your project.';
  } else if (data.description.trim().length < 10) {
    errors.description = 'Please provide a bit more detail (at least 10 characters).';
  }

  if (data.phone && data.phone.trim() && !/^[+0-9\s\-()]{7,20}$/.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.';
  }

  return errors;
}

/**
 * Generates an informative, tailored WhatsApp enquiry message using form input.
 */
export function buildDynamicWhatsAppMessage(data: Partial<ContactFormData>): string {
  const name = [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ');
  const parts: string[] = ['Hello A_KON Digital Studio!'];

  if (name) {
    parts.push(`My name is ${name}${data.business?.trim() ? ` from ${data.business.trim()}` : ''}.`);
  }

  if (data.service?.trim()) {
    parts.push(`Service needed: ${data.service.trim()}`);
  }

  if (data.budget?.trim()) {
    parts.push(`Project budget: ${data.budget.trim()}`);
  }

  if (data.description?.trim()) {
    parts.push(`Project overview: "${data.description.trim()}"`);
  } else {
    parts.push('I would like to discuss a new digital project.');
  }

  return parts.join('\n');
}

/**
 * Builds a direct wa.me link with URL encoded message.
 */
export function buildWhatsAppHref(number: string, message: string): string {
  const cleanNumber = number.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return cleanNumber ? `https://wa.me/${cleanNumber}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

