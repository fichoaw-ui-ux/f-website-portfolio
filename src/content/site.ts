import type { Lang } from '../i18n/ui'

const shared = {
  name: 'Ficho',
  role: 'UI/UX Designer',
  email: 'fichoajiwibowo@gmail.com',
  // International format for wa.me deep links (Indonesia country code 62, leading 0 dropped).
  // Local number is 082111183273.
  whatsapp: '6282111183273',
  skills: [
    'Product Design',
    'Usability Testing',
    'Wireframing',
    'Prototyping',
    'User Flows',
    'Information Architecture',
    'Design Systems',
    'Graphic Design',
    'HTML/CSS',
  ],
  tools: [
    'Figma',
    'Claude Code',
    'Notion',
    'Slack',
    'Jira',
    'Mixpanel',
    'Bitbucket',
    'Github',
    'Photoshop',
    'Illustrator',
    'Google Workspace',
  ],
  socials: [
    { label: 'LinkedIn', href: 'https://linkedin.com/in/fichoajiwibowo' },
    { label: 'WhatsApp', href: 'https://wa.me/6282111183273' },
    { label: 'Email', href: 'mailto:fichoajiwibowo@gmail.com' },
  ],
} as const

const perLang = {
  id: {
    tagline: 'Product Designer yang bikin produk digital user-centric, dari flow sampai high-fidelity interface.',
    bio: [
      'Product Designer dengan 4+ tahun pengalaman merancang produk fintech. Memiliki pengalaman menangani produk send money (international & local), payroll, banking product, dan compliance flows (KYC & KYB).',
      'Berlatar belakang Sistem Informasi, dengan dasar technology/product development serta terbuka dan adaptif terhadap perkembangan tools berbasis AI saat ini.',
    ],
    nav: [
      { label: 'Karya', href: '#work' },
      { label: 'Tentang', href: '#about' },
      { label: 'Pengalaman', href: '#experience' },
      { label: 'Eksplorasi', href: '#explorations' },
    ],
    experience: [
      {
        year: 'Oktober 2022 — Sekarang',
        company: 'Transfez & Jack Finance',
        role: 'UI/UX Designer',
        sections: [
          {
            label: 'Tanggung Jawab Umum',
            items: [
              'Berkolaborasi dengan semua tim untuk menerjemahkan kebutuhan regulasi dan bisnis jadi solusi desain yang solid dan bisa diuji.',
              'Membangun sistem dokumentasi copy menggunakan fitur variables di Figma, lalu mengembangkannya jadi AI skill supaya proses dokumentasi dan implementasinya ke desain jadi lebih mudah dan konsisten.',
            ],
          },
          {
            label: 'Transfez (Fokus Saat Ini) | Oktober 2025 - Sekarang',
            items: [
              'Ikut membangun website Transfez pakai **AI-assisted development (Claude Code)** yang terintegrasi dengan **Figma lewat MCP** — jadi proses handoff desain langsung tersambung ke kode, termasuk **git workflow** (commit, push, pull request) bareng tim development.',
              'Menemukan gap UX besar di **fitur voucher Send Money** Transfez — hanya **1.979 dari 6.297 user (31,43%)** yang memakai voucher yang tersedia, menurut data Mixpanel — lalu memimpin eksekusi desain dari awal sampai handoff ke engineering (analisis, iterasi, restrukturisasi halaman); solusinya **divalidasi tim Growth dan disetujui untuk dikembangkan**.',
            ],
          },
          {
            label: 'Jack Finance | Oktober 2022 - September 2025',
            items: [
              'Menangani **desain end-to-end** untuk **Send Money (Transfer Internasional & Lokal), Payroll**, dan produk inti lainnya — mulai dari user flow, information architecture, sampai UI high-fidelity.',
              'Bertanggung jawab membangun flow dan desain product/fitur **KYB** untuk membantu proses onboarding customer, sesuai kebutuhan tim Compliance dan Business Development.',
              'Memimpin desain UI/UX untuk **flow Local Transfer yang mobile-native**, yang bikin **adopsi naik 56%** di bulan pertama dan **mengurangi waktu penyelesaian 40%**.',
              'Merancang flow **"Quick Transfer"** yang lebih ringkas untuk pembayaran satuan/volume kecil — memangkas waktu mulai transfer **52%** dan berhasil dipakai untuk **41% dari semua inisiasi Local Transfer** dalam dua minggu setelah rilis.',
              'Merancang UI flow, mockup, dan elemen interface untuk fitur **transaction recovery**, yang bikin **tiket support turun 70%** dan **payment success rate naik dari 80% ke 95%**.',
            ],
          },
        ],
      },
      {
        year: 'Oktober 2021 — September 2022',
        company: 'Transfez',
        role: 'Desainer Grafis (Magang)',
        sections: [
          {
            items: [
              'Membuat aset brand identity dan grafis media sosial untuk mendukung kampanye dan publikasi perusahaan.',
              'Berkolaborasi dengan tim Marketing, Product, dan Content untuk memastikan hasil desain sesuai dengan tujuan kampanye.',
            ],
          },
        ],
      },
    ],
  },
  en: {
    tagline: 'Product Designer crafting user-centric digital products from flows to high-fidelity interfaces.',
    bio: [
      "Product Designer with 4+ years of experience designing fintech products. Experienced in handling send money products (international & local), payroll, banking products, and compliance flows (KYC & KYB).",
      "Background in Information Systems, with a foundation in technology/product development and openness to adapting to today's AI-based tools.",
    ],
    nav: [
      { label: 'Work', href: '#work' },
      { label: 'About', href: '#about' },
      { label: 'Experience', href: '#experience' },
      { label: 'Exploration', href: '#explorations' },
    ],
    experience: [
      {
        year: 'October 2022 — Present',
        company: 'Transfez & Jack Finance',
        role: 'UI/UX Designer',
        sections: [
          {
            label: 'General Responsibilities',
            items: [
              'Collaborated with all teams to translate regulatory and business needs into solid, testable design solutions.',
              "Built a copy documentation system using Figma's variables feature, then turned it into an AI skill to make documentation and design implementation easier and more consistent.",
            ],
          },
          {
            label: 'Transfez (Focus Now) | October 2025 - Now',
            items: [
              'Helped build the Transfez website using **AI-assisted development (Claude Code)** integrated with **Figma via MCP** — connecting the design handoff process directly to code, including **git workflow** (commit, push, pull request) with the development team.',
              'Found a major UX gap in the **Send Money voucher feature** — only **1,979 out of 6,297 users (31.43%)** used the available voucher, based on Mixpanel data — then led the design work from research to engineering handoff (analysis, iteration, page restructuring); the solution was **validated by the Growth team and approved for development**.',
            ],
          },
          {
            label: 'Jack Finance | October 2022 - September 2025',
            items: [
              'Handled **end-to-end design** for **Send Money (International & Local Transfer), Payroll**, and other core products — from user flow and information architecture to high-fidelity UI.',
              'Responsible for building the flow and design for the **KYB** product/feature to support customer onboarding, based on the needs of the Compliance and Business Development teams.',
              'Led UI/UX design for the **mobile-native Local Transfer flow**, which drove **56% mobile adoption** in the first month and **cut completion time by 40%**.',
              'Designed the **"Quick Transfer"** flow, a simpler option for small or single payments, which cut transfer initiation time by **52%** and was used in **41% of all Local Transfer initiations** within two weeks of launch.',
              'Designed UI flow, mockups, and interface elements for the **transaction recovery** feature, which cut **support tickets by 70%** and raised the **payment success rate from 80% to 95%**.',
            ],
          },
        ],
      },
      {
        year: 'October 2021 — September 2022',
        company: 'Transfez',
        role: 'Graphic Designer (Intern)',
        sections: [
          {
            items: [
              'Created marketing materials, brand identity assets, and social media graphics to support company campaigns and publications.',
              'Worked with the Marketing, Product, and Content teams to make sure designs matched campaign goals.',
            ],
          },
        ],
      },
    ],
  },
} as const

export function getSite(lang: Lang) {
  return { ...shared, ...perLang[lang] }
}

export type SiteConfig = ReturnType<typeof getSite>
