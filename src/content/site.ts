export const site = {
  name: 'Ficho',
  role: 'UI/UX Designer',
  tagline: 'UI/UX Designer crafting digital products for growing brands.',
  bio: [
    "I'm a product designer focused on turning complex problems into simple, beautiful interfaces.",
    "Currently exploring the intersection of design systems and motion.",
  ],
  available: true,
  email: 'ficho@transfez.com',
  location: 'Jakarta, Indonesia',
  skills: [
    'Product Design',
    'User Research',
    'Design Systems',
    'Interaction Design',
    'Prototyping',
    'Information Architecture',
  ],
  tools: ['Figma', 'Framer', 'Notion', 'Principle', 'Miro', 'Linear'],
  socials: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Dribbble', href: '#' },
    { label: 'Read.cv', href: '#' },
    { label: 'Email', href: 'mailto:ficho@transfez.com' },
  ],
  experience: [
    { year: '2024 — Now', role: 'Senior Product Designer', company: 'Company A', description: 'Leading design for the core platform.' },
    { year: '2022 — 2024', role: 'Product Designer', company: 'Company B', description: 'Shipped design system and onboarding.' },
    { year: '2020 — 2022', role: 'UI Designer', company: 'Company C', description: 'Marketing site and mobile app.' },
    { year: '2019 — 2020', role: 'Junior Designer', company: 'Company D', description: 'First role — visual design and prototyping.' },
  ],
} as const

export type SiteConfig = typeof site
