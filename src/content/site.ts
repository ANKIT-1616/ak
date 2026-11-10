export const site = {
  brand: 'A_KON Digital Studio',
  mark: 'A_KON®',
  founder: 'Ankit',
  location: 'India',
  availability: 'Open for a few considered projects',
  hero: {
    headline: ['WE MAKE', 'DIGITAL', 'MATTER.'],
    supporting: 'Creative thinking, thoughtful design and modern technology — building digital experiences for businesses ready to stand out.',
  },
  philosophy: {
    headline: ['GOOD DESIGN', 'SHOULD DO', 'MORE.'],
    supporting: 'We believe digital experiences should be more than visually appealing. They should communicate value, create meaningful connections and help businesses move forward.',
    principles: ['THINK CLEARLY.', 'DESIGN PURPOSEFULLY.', 'BUILD INTELLIGENTLY.'],
  },
  work: {
    eyebrow: '01 / SELECTED WORK',
    title: 'A closer look at ideas turned into digital experiences.',
    project: 'MOOCH SALOON',
    category: 'Website Design & Development',
    location: 'Pushkar, Rajasthan, India',
    description: 'A distinctive digital presence for a modern men’s grooming destination, combining a refined visual identity with a responsive customer-focused website.',
    direction: 'Dark, editorial and quietly luxurious. A charcoal canvas, warm gold cues and strong type give the salon a sense of place without losing clarity.',
    development: 'Responsive front-end development with service presentation, WhatsApp and Instagram touchpoints, location and contact information, and a mobile-first structure.',
    features: ['Charcoal and gold visual identity', 'Responsive website', 'Service presentation', 'WhatsApp integration', 'Instagram integration', 'Location and contact information', 'Mobile-first design'],
    url: 'https://mooch-saloon.vercel.app/',
  },
  services: [
    { number: '01', title: 'DIGITAL EXPERIENCES', description: 'Websites and interfaces that make the next business move easier to see.', items: ['Website Design', 'Website Development', 'E-commerce', 'Landing Pages', 'Website Redesign', 'UI/UX Design', 'Responsive Development', 'Website Optimization'] },
    { number: '02', title: 'BRAND & CREATIVE', description: 'A clear visual language that gives good work a recognisable point of view.', items: ['Brand Identity', 'Visual Direction', 'Graphic Design', 'Promotional Graphics', 'Social Media Creatives', 'Product Presentation', 'Marketing Materials'] },
    { number: '03', title: 'DIGITAL GROWTH', description: 'Useful systems and content that help the right people find and choose you.', items: ['Instagram Management', 'Content Strategy', 'Reels and Video Editing', 'Google Business Optimization', 'Local SEO', 'WhatsApp Business Setup', 'Digital Catalogues', 'Festival Campaigns'] },
    { number: '04', title: 'BUSINESS SYSTEMS', description: 'Thoughtful digital tools for the work that happens behind the brand.', items: ['CRM Development', 'Customer Enquiry Management', 'Appointment Enquiry Systems', 'Business Dashboards', 'Digital Automation', 'Custom Web Applications'] },
  ],
  about: {
    headline: ['DESIGN-DRIVEN.', 'TECHNOLOGY-POWERED.'],
    description: 'Our mission is to bridge the gap between creative design and technical execution, crafting digital experiences that are both visually engaging and genuinely useful for ambitious businesses.',
    skills: ['HTML & CSS', 'JavaScript', 'React & TypeScript', 'UI/UX Design', 'Photoshop', 'Digital Branding'],
    founderImage: '/assets/ankit-founder.jpg',
    social: { github: '', linkedin: '' },
  },
  process: [
    { number: '01', title: 'DISCOVER', description: 'Understanding the business, audience and objectives.' },
    { number: '02', title: 'DEFINE', description: 'Establishing strategy, creative direction and project scope.' },
    { number: '03', title: 'DESIGN & DEVELOP', description: 'Transforming ideas into polished and functional digital experiences.' },
    { number: '04', title: 'LAUNCH & EVOLVE', description: 'Delivering, optimizing and improving the digital product.' },
  ],
  why: {
    headline: ['SMALL STUDIO.', 'PERSONAL APPROACH.', 'THOUGHTFUL WORK.'],
    copy: 'Direct communication and personal attention keep the important things close. We build with business-first thinking, transparent pricing and a long-term view.',
    points: ['Direct communication', 'Personal attention', 'Business-first thinking', 'Transparent pricing', 'Long-term collaboration'],
  },
  contact: {
    supporting: "Whether you're building something new, improving an existing website, or exploring an idea, let's talk about it.",
    availability: 'AVAILABLE FOR SELECT PROJECTS.',
    email: 'akon25880@gmail.com',
    whatsappNumber: '+918000406352',
  },
  footer: {
    tagline: 'Independent by nature. Creative by design.',
    socials: { Instagram: '' as string, LinkedIn: '' as string, GitHub: '' as string },
  },
} as const;

export type Service = (typeof site.services)[number];
