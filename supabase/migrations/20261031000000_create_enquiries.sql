create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  business_name text check (business_name is null or char_length(business_name) <= 120),
  project_type text not null check (project_type in (
    'Business Website',
    'Portfolio Website',
    'E-commerce Website',
    'Restaurant / Cafe Website',
    'UI/UX Design',
    'Website Redesign',
    'Other'
  )),
  budget text not null check (budget in (
    'Under ₹10,000',
    '₹10,000–₹20,000',
    '₹20,000–₹40,000',
    '₹40,000+'
)),
  description text not null check (char_length(description) between 10 and 5000),
  contact_preference text not null check (contact_preference in ('WhatsApp', 'Email')),
  status text not null default 'new' check (status in ('new', 'contacted', 'discussion', 'completed')),
  notification_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_created_at_idx on public.enquiries (status, created_at desc);

alter table public.enquiries enable row level security;

revoke all on table public.enquiries from public, anon, authenticated;
grant select, insert, update, delete on table public.enquiries to service_role;

comment on table public.enquiries is
  'Private website enquiries. Access is mediated by the authenticated Cloudflare Worker; no client RLS policies are intentionally defined.';
