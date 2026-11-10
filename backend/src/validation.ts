export const projectTypes = [
  'Business Website',
  'Portfolio Website',
  'E-commerce Website',
  'Restaurant / Cafe Website',
  'UI/UX Design',
  'Website Redesign',
  'Other',
] as const;

export const budgets = ['Under ₹10,000', '₹10,000–₹20,000', '₹20,000–₹40,000', '₹40,000+'] as const;
export const contactMethods = ['WhatsApp', 'Email'] as const;
export const enquiryStatuses = ['new', 'contacted', 'discussion', 'completed'] as const;

export type EnquiryStatus = (typeof enquiryStatuses)[number];

export interface EnquiryInput {
  submissionId: string;
  fullName: string;
  email: string;
  business: string;
  projectType: (typeof projectTypes)[number];
  budget: (typeof budgets)[number];
  details: string;
  preferredContact: (typeof contactMethods)[number];
}

export interface ValidationIssue {
  field: keyof EnquiryInput;
  message: string;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isChoice<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return typeof value === 'string' && choices.includes(value as T);
}

export function validateEnquiry(value: unknown): { data?: EnquiryInput; issues: ValidationIssue[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { issues: [{ field: 'fullName', message: 'Please submit a valid enquiry.' }] };
  }

  const body = value as Record<string, unknown>;
  const issues: ValidationIssue[] = [];
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const business = typeof body.business === 'string' ? body.business.trim() : '';
  const details = typeof body.details === 'string' ? body.details.trim() : '';

  if (typeof body.website === 'string' && body.website.trim()) {
    issues.push({ field: 'fullName', message: 'Please try submitting the form again.' });
  }
  if (typeof body.submissionId !== 'string' || !uuidPattern.test(body.submissionId)) {
    issues.push({ field: 'submissionId', message: 'Please refresh the form and try again.' });
  }
  if (fullName.length < 2 || fullName.length > 120) {
    issues.push({ field: 'fullName', message: 'Name must be between 2 and 120 characters.' });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    issues.push({ field: 'email', message: 'Please enter a valid email address.' });
  }
  if (business.length > 120) {
    issues.push({ field: 'business', message: 'Business name must be 120 characters or fewer.' });
  }
  if (!isChoice(body.projectType, projectTypes)) {
    issues.push({ field: 'projectType', message: 'Please choose a valid project type.' });
  }
  if (!isChoice(body.budget, budgets)) {
    issues.push({ field: 'budget', message: 'Please choose a valid budget.' });
  }
  if (details.length < 10 || details.length > 5000) {
    issues.push({ field: 'details', message: 'Project details must be between 10 and 5,000 characters.' });
  }
  if (!isChoice(body.preferredContact, contactMethods)) {
    issues.push({ field: 'preferredContact', message: 'Please choose a valid contact method.' });
  }

  if (issues.length > 0) return { issues };

  return {
    data: {
      submissionId: body.submissionId as string,
      fullName,
      email,
      business,
      projectType: body.projectType as EnquiryInput['projectType'],
      budget: body.budget as EnquiryInput['budget'],
      details,
      preferredContact: body.preferredContact as EnquiryInput['preferredContact'],
    },
    issues: [],
  };
}

export function isEnquiryStatus(value: unknown): value is EnquiryStatus {
  return isChoice(value, enquiryStatuses);
}

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function safeInteger(value: string | null, fallback: number, maximum: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  return Math.min(Number(value), maximum);
}
