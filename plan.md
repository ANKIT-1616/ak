# A_KON Digital Studio — Implementation Plan

## Scope

Build a complete, single-page React/TypeScript/Vite portfolio website for A_KON Digital Studio using the supplied brand language and the existing Wix website as the content reference. Preserve the existing information architecture while replacing the generic presentation with a premium, editorial digital studio experience.

The build will remain static-first. No backend, database, customer-email service, or fake submission endpoint will be introduced. The contact form will validate in the browser, provide accessible feedback, and expose a configurable WhatsApp alternative. Missing owner-specific values (founder image, GitHub, LinkedIn, email, phone, WhatsApp number, and form endpoint) will remain explicit placeholders in configuration rather than invented data.

## Design direction

- **Design Movement:** Contemporary editorial brutalism with premium digital-studio restraint.
- **Alternative 1:** Swiss editorial minimalism with 0.06 probability.
- **Alternative 2:** Neo-industrial art direction with 0.04 probability.

### Core Principles

1. Typography carries the brand before decoration does.
2. Asymmetry and negative space create a sense of authorship.
3. Lime is a signal for action, not a surface color.
4. Every interaction should explain or advance the work.

### Color Philosophy

Use #101010 as the working canvas and #171717 as a quiet sectional shift. Use #F3F1EB for confident editorial text and #929292 for supporting information. Reserve #C5FF45 for availability, focus, and action states so it feels ownable and intentional.

### Layout Paradigm

Use a fluid editorial rail with an offset content column, oversized section numerals, wide image-led work moments, and occasional full-bleed breaks. Avoid evenly centered card grids and repeatable marketing blocks.

### Signature Elements

- A lime registration mark / short rule that appears beside active states and section metadata.
- Oversized line-broken headlines with a compact serif italic accent for selected emphasis.
- Thin technical labels and index numbers that make the page feel like a working studio document.

### Interaction Philosophy

Motion should reveal hierarchy rather than decorate it. Buttons get directional feedback, services expand as readable rows, and project imagery responds with subtle crop/scale changes. All animation must degrade cleanly under reduced-motion preferences.

### Animation

Use Framer Motion for hero line reveals, viewport fades, service expansion, and image mask transitions. Use CSS for hover underlines and small transforms. Do not add GSAP unless a specific interaction cannot be implemented cleanly with Framer Motion. Disable nonessential transforms when `prefers-reduced-motion: reduce` is active.

### Typography System

Use Space Grotesk for navigation, labels, body copy, and display sans typography. Pair it with Instrument Serif italic for occasional editorial emphasis in the work and contact sections. Use `clamp()`-based display sizing and generous line-height control so mobile remains intentional.

### Brand Essence

A_KON turns clear thinking into useful digital experiences for ambitious businesses that need design and technology to move together. Personality: precise, curious, direct.

### Brand Voice

Headlines are short and declarative. CTAs are active and human. Supporting copy is calm and specific. Example lines: “Make the next move visible.” and “Bring the rough idea. We’ll give it structure.”

### Wordmark & Logo

Use the supplied A_KON® wordmark as a compact text lockup with a lime slash/registration detail. Keep the mark small and quiet so the hero headline remains the dominant identity signal.

### Signature Brand Color

Electric lime #C5FF45 is the signature color, used only for availability, active navigation, selected rules, and high-intent actions.

## Implementation approach

- Create a Vite React TypeScript app with Tailwind CSS and Framer Motion.
- Organize source into `src/components`, `src/content`, `src/hooks`, `src/lib`, and `src/styles`.
- Keep all editable owner details in `src/content/site.ts` and use explicit placeholder values where the brief does not provide real data.
- Build the main page from semantic sections with stable anchor IDs: `work`, `services`, `about`, `process`, and `contact`.
- Present the Mooch Saloon project using verified live-site details only. Use a CSS-built project visual treatment plus a configurable image slot until owner-approved screenshots are available; do not fabricate metrics, testimonials, or results.
- Add accessible expandable service rows, keyboard-visible focus states, a mobile menu, local form validation, a WhatsApp link assembled from configuration, and a non-deceptive submission state that explains when no endpoint is configured.
- Add initial metadata, Open Graph/Twitter tags, a `public/manus-routes.json` route manifest, and `public/robots.txt` / `public/sitemap.xml` placeholders that can be finalized once the production origin is configured.

## Project structure

```text
akonstudio/
├── public/
│   ├── manus-routes.json
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── site-header.tsx
│   │   ├── hero.tsx
│   │   ├── philosophy.tsx
│   │   ├── selected-work.tsx
│   │   ├── services.tsx
│   │   ├── about.tsx
│   │   ├── process.tsx
│   │   ├── why-akon.tsx
│   │   ├── contact.tsx
│   │   └── site-footer.tsx
│   ├── content/site.ts
│   ├── hooks/use-reduced-motion.ts
│   ├── lib/metadata.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/index.css
├── app.config.ts
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Delivery flow

Implement the page in meaningful batches, start the development server on the configured Preview port, verify `manus-routes.json`, run type diagnostics and the production build, inspect the rendered desktop/mobile page, then commit the completed implementation to the project's canonical main branch. Publication is separate and will not be enabled automatically.
