export const site = {
  name: 'Ficho',
  role: 'UI/UX Designer',
  tagline: 'UI/UX Designer crafting digital products for growing brands.',
  bio: [
    "I'm a product designer focused on turning complex problems into simple, beautiful interfaces.",
    "Currently exploring the intersection of design systems and motion.",
  ],
  email: 'ficho@transfez.com',
  skills: [
    'Product Design',
    'User Research',
    'Design Systems',
    'Interaction Design',
    'Prototyping',
    'Information Architecture',
  ],
  tools: [
    'Figma',
    'Notion',
    'Mixpanel',
    'Claude Code',
    'Bitbucket',
    'Github',
    'Photoshop',
    'Illustrator',
  ],
  socials: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Dribbble', href: '#' },
    { label: 'Read.cv', href: '#' },
    { label: 'Email', href: 'mailto:ficho@transfez.com' },
  ],
  // TODO: real year ranges. Figma shows "2023 - NOW" on all three roles, which
  // is placeholder text, not three concurrent jobs.
  // TODO: real highlights. The bullets below are the lorem ipsum from Figma and
  // must be replaced before this page is published.
  experience: [
    {
      year: '2023 — NOW',
      company: 'Transfez & Jack',
      role: 'Product Designer',
      highlights: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      ],
    },
    {
      year: '2023 — NOW',
      company: 'Transfez & Jack',
      role: 'Graphic Designer (Intern)',
      highlights: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      ],
    },
    {
      year: '2023 — NOW',
      company: 'Great Giant Pineapple',
      role: 'Corporate Communication',
      highlights: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      ],
    },
  ],
} as const

export type SiteConfig = typeof site
