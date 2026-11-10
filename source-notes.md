# Source notes

## Existing A_KON Wix site

Source: https://solee5298.wixsite.com/my-site-8

The site visually uses a near-black hero with a bright architectural abstract image, centered oversized white headline typography, a lime accent glow, and lime outlined/filled CTA buttons. The header is a dark translucent strip with a small A_KON logo, Founder: Ankit, Home, Location: India, and LET'S TALK ↗. The page content confirms the supplied philosophy, services, About, Process, Why A_KON, and contact copy. The footer includes the supplied tagline, navigation, four service categories, social placeholders, India, and a 2026 copyright line.

The public extraction did not expose a contact form submission endpoint or social URLs.

## Mooch Saloon

Source: https://mooch-saloon.vercel.app/

The live site title is “Mooch Saloon | Premium Barber & Luxury Grooming — Pushkar, Rajasthan”. It uses a dark, premium grooming direction with a restrained gold/cream accent and editorial serif display typography. Visible navigation includes HOME, SERVICES, ABOUT, REVIEWS, CONTACT, plus CONTACT US, CHAT ON WHATSAPP, and VIEW INSTAGRAM actions.

Verified visible details include Pushkar, Rajasthan; premium men's grooming; a WhatsApp desk; service group filters for All Services, Hair & Grooming, Hair Treatments, and Premium Packages; team profiles for Rahul and Manish; Instagram and phone links; Open on Maps; WhatsApp Us; and Call Rahul RR. The A_KON case study will describe only the implementation features supplied in the brief and will not claim performance results or testimonials.

## Contact configuration

Public contact details are configured in `src/content/site.ts`:

- Confirm `site.contact.whatsappNumber` is the studio's current WhatsApp number in international format before publishing.
- `site.contact.email` is set to the professional address supplied by the studio owner.
- Set `site.footer.socials.LinkedIn` and `site.footer.socials.GitHub` to verified profile URLs.

The public contact form submits validated enquiries through the Cloudflare Worker to Supabase, with a unique submission ID and honeypot protection. After a successful save, visitors can continue through their selected email or WhatsApp channel. The Supabase-authenticated `/admin` dashboard manages the private enquiry records; optional Resend sends a studio notification and is not an automatic reply to visitors.

See [`BACKEND_SETUP.md`](./BACKEND_SETUP.md) for the Supabase schema, Worker deployment, environment variables, free-tier constraints, and optional notification setup.

## Implementation limitation

The Wix page and Mooch page were publicly readable, but the external fetch for Mooch returned only a skip link because much of the content is client-rendered. Visual browser inspection was used for both sites. No owner-provided founder photo or social URLs were supplied. The WhatsApp number already present in the working configuration is preserved.
