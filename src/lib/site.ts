export const publicOrigin = '';

export type PreferredContactMethod = 'WhatsApp' | 'Email';

export interface ContactFormData {
  fullName: string;
  email: string;
  business: string;
  projectType: string;
  budget: string;
  details: string;
  preferredContact: PreferredContactMethod | '';
}

export type ValidationErrors = Partial<Record<keyof ContactFormData, string>>;

const projectTypes = [
  'Business Website',
  'Portfolio Website',
  'E-commerce Website',
  'Restaurant / Cafe Website',
  'UI/UX Design',
  'Website Redesign',
  'Other',
];
const budgets = ['Under ₹10,000', '₹10,000–₹20,000', '₹20,000–₹40,000', '₹40,000+'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContactForm(data: Partial<ContactFormData>): ValidationErrors {
  const errors: ValidationErrors = {};
  const fullName = data.fullName?.trim() ?? '';
  const email = data.email?.trim() ?? '';
  const business = data.business?.trim() ?? '';
  const details = data.details?.trim() ?? '';

  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = 'Please enter a name between 2 and 120 characters.';
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (business.length > 120) {
    errors.business = 'Business name must be 120 characters or fewer.';
  }
  if (!projectTypes.includes(data.projectType ?? '')) {
    errors.projectType = 'Please choose a valid project type.';
  }
  if (!budgets.includes(data.budget ?? '')) {
    errors.budget = 'Please choose a valid budget.';
  }
  if (details.length < 10 || details.length > 5000) {
    errors.details = 'Project details must be between 10 and 5,000 characters.';
  }
  if (data.preferredContact !== 'WhatsApp' && data.preferredContact !== 'Email') {
    errors.preferredContact = 'Please choose how you would like us to contact you.';
  }

  return errors;
}

export function buildContactMessage(data: Partial<ContactFormData>): string {
  return [
    'Hello Ankit,',
    '',
    'I would like to discuss a project with A_KON Digital Studio.',
    '',
    `Name: ${data.fullName?.trim() ?? ''}`,
    `Email: ${data.email?.trim() ?? ''}`,
    `Business: ${data.business?.trim() || 'Not provided'}`,
    `Project Type: ${data.projectType?.trim() ?? ''}`,
    `Budget: ${data.budget?.trim() ?? ''}`,
    'Project Details:',
    data.details?.trim() ?? '',
    `Preferred Contact Method: ${data.preferredContact ?? ''}`,
  ].join('\n');
}

export function buildWhatsAppHref(number: string, message: string): string | null {
  const formattedNumber = number.trim();
  if (!/^\+?[\d\s().-]+$/.test(formattedNumber)) return null;

  const cleanNumber = formattedNumber.replace(/\D/g, '');
  if (!/^[1-9]\d{6,14}$/.test(cleanNumber)) return null;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoHref(email: string, data?: Partial<ContactFormData>): string | null {
  const address = email.trim();
  if (!emailPattern.test(address)) return null;

  if (!data) return `mailto:${address}`;

  const subject = `Project enquiry — ${data.fullName?.trim() || 'A_KON Digital Studio'}`;
  return `mailto:${encodeURIComponent(address)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildContactMessage(data))}`;
}

export const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};
