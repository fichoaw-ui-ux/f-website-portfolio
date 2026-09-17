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
      'Product Designer dengan pengalaman 4+ tahun, sekarang fokus di fintech remittance di Transfez (lewat Jack Finance) — KYC, transaksi cross-border, dan compliance flows.',
      'Background Sistem Informasi, dengan pengalaman langsung di implementasi front-end berbantuan AI.',
    ],
    nav: [
      { label: 'Karya', href: '#work' },
      { label: 'Tentang', href: '#about' },
      { label: 'Pengalaman', href: '#experience' },
      { label: 'Eksplorasi', href: '#explorations' },
    ],
    experience: [
      {
        year: 'Juli 2022 — Sekarang',
        company: 'Transfez & Jack Finance',
        role: 'UI/UX Designer',
        sections: [
          {
            label: 'Tanggung Jawab Umum',
            items: [
              'Kerja bareng tim **Product, Engineering, Compliance, dan Data** buat nerjemahin kebutuhan regulasi dan bisnis jadi solusi desain yang solid dan bisa diuji.',
              'Ngerjain **usability review** dan iterasi desain berdasarkan data (misalnya **analisis transaksi/funnel**) dan feedback kualitatif dari tim Ops dan Compliance.',
            ],
          },
          {
            label: 'Fokus: Transfez (Sekarang)',
            items: [
              'Ikut bangun website Transfez pakai **AI-assisted development (Claude Code)** yang terintegrasi sama **Figma lewat MCP** — jadi proses handoff desain langsung nyambung ke kode, termasuk **git workflow** (commit, push, pull request) bareng tim development.',
              'Nemuin gap UX besar di **fitur voucher Send Money** Transfez — cuma **31.43% dari 6.297 user** yang pakai voucher yang tersedia menurut data Mixpanel — terus mimpin eksekusi desain dari awal sampai handoff ke engineering (analisis, iterasi, restrukturisasi halaman); solusinya **divalidasi tim Growth dan disetujui buat dikembangkan**.',
            ],
          },
          {
            label: 'Fokus Sebelumnya: Jack Finance (Afiliasi Transfez)',
            items: [
              'Megang **desain end-to-end** buat **Send Money (Transfer Internasional & Lokal), Payroll**, dan produk inti lainnya — mulai dari user flow, information architecture, sampai UI high-fidelity.',
              'Ngedesain UI flow, mockup, dan elemen interface buat fitur **transaction recovery**, yang bikin **tiket support turun 70%** dan payment success rate naik dari **80% ke 95%**.',
              'Mimpin desain UI/UX buat **flow Local Transfer yang mobile-native**, yang bikin **56% adopsi mobile** di bulan pertama dan **motong waktu penyelesaian 40%**.',
              'Ngedesain flow **"Quick Transfer"** yang lebih ringkas buat pembayaran satuan/volume kecil, motong waktu mulai transfer **52%** dan berhasil dipakai buat **41% dari semua inisiasi Local Transfer** dalam dua minggu setelah rilis.',
              'Ngedesain pengalaman **Enhanced Due Diligence (EDD)** yang dilihat client — form permintaan dokumen yang dinamis, notifikasi multi-channel, dan alert perubahan kurs — buat sistem **monitoring compliance AML/CFT** otomatis di transfer cross-border.',
            ],
          },
        ],
      },
      {
        year: 'Oktober 2021 — Juni 2022',
        company: 'Transfez',
        role: 'Desainer Grafis (Magang)',
        sections: [
          {
            items: [
              'Bikin materi marketing, aset brand identity, dan grafis media sosial buat dukung kampanye dan publikasi perusahaan.',
              'Kerja bareng tim Marketing, Product, dan Content buat mastiin hasil desain sesuai sama tujuan kampanye.',
            ],
          },
        ],
      },
      {
        year: 'Oktober 2021 — Maret 2022',
        company: 'Great Giant Foods',
        role: 'Corporate Communication (Magang)',
        sections: [
          {
            items: [
              'Bikin dan jalanin konten corporate communication di media sosial dan newsletter buat dukung tujuan perusahaan.',
              'Nulis, ngedit, dan visualisasiin materi komunikasi termasuk press release dan laporan sustainability (ESG/governance).',
            ],
          },
        ],
      },
    ],
  },
  en: {
    tagline: 'Product Designer crafting user-centric digital products from flows to high-fidelity interfaces.',
    bio: [
      "Product Designer with 4+ years of experience, currently focused on fintech remittance at Transfez (via Jack Finance) — KYC, cross-border transactions, and compliance flows.",
      "Background in Information Systems, with hands-on experience in AI-assisted front-end implementation.",
    ],
    nav: [
      { label: 'Work', href: '#work' },
      { label: 'About', href: '#about' },
      { label: 'Experience', href: '#experience' },
      { label: 'Exploration', href: '#explorations' },
    ],
    experience: [
      {
        year: 'July 2022 — Present',
        company: 'Transfez & Jack Finance',
        role: 'UI/UX Designer',
        sections: [
          {
            label: 'General Responsibilities',
            items: [
              'Collaborated closely with **Product, Engineering, Compliance, and Data** teams to translate regulatory and business requirements into cohesive, testable design solutions.',
              'Conducted **usability reviews** and iterated on designs based on data (e.g., **transaction/funnel analysis**) and qualitative feedback from Ops and Compliance stakeholders.',
            ],
          },
          {
            label: 'Focus: Transfez (Current)',
            items: [
              'Collaborated on implementation of the Transfez website using **AI-assisted development (Claude Code)** integrated with **Figma via MCP** — bridging design handoff directly into code, including **git workflows** (commit, push, pull requests) alongside the development team.',
              "Identified a major UX gap in Transfez's **Send Money voucher experience** — only **31.43% of 6,297 users** engaged with available vouchers per Mixpanel data — and led full design execution (analysis, iteration, page restructuring) through engineering handoff; solution **validated by Growth stakeholders and approved for development**.",
            ],
          },
          {
            label: 'Prior Focus: Jack Finance (Transfez Affiliate)',
            items: [
              'Managed **end-to-end design** for **Send Money (International & Local Transfers), Payroll**, and other core products — from user flows and information architecture to high-fidelity UI.',
              'Designed UI flows, mockups, and interface elements for a **transaction recovery** feature, contributing to a **70% drop in support tickets** and lifting payment success rate from **80% to 95%**.',
              'Led UI/UX design for a **mobile-native Local Transfer flow**, driving **56% mobile adoption** within the first month and **cutting time-to-completion by 40%**.',
              'Designed a streamlined **"Quick Transfer" flow** for single/small-volume payments, reducing transfer initiation time by **52%** and capturing **41% of Local Transfer initiations** within two weeks of launch.',
              'Designed the client-facing **Enhanced Due Diligence (EDD)** experience — dynamic document-request forms, multi-channel notifications, and FX-rate change alerts — for an automated **AML/CFT compliance monitoring** system across cross-border transfers.',
            ],
          },
        ],
      },
      {
        year: 'October 2021 — June 2022',
        company: 'Transfez',
        role: 'Graphic Designer (Intern)',
        sections: [
          {
            items: [
              'Produced marketing materials, brand identity assets, and social media graphics supporting company campaigns and publications.',
              'Partnered with Marketing, Product, and Content teams to ensure design output aligned with campaign objectives.',
            ],
          },
        ],
      },
      {
        year: 'October 2021 — March 2022',
        company: 'Great Giant Foods',
        role: 'Corporate Communication (Intern)',
        sections: [
          {
            items: [
              'Developed and executed corporate communication content across social media and newsletters in support of company goals.',
              'Drafted, edited, and visualized communication materials including press releases and sustainability reports (ESG/governance).',
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
