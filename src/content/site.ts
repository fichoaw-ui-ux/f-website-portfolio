import type { Lang } from '../i18n/ui'

const shared = {
  name: 'Ficho',
  fullName: 'Ficho Aji Wibowo',
  handle: '@fichoaw',
  location: 'Jakarta, Indonesia',
  role: 'UI/UX Designer',
  email: 'fichoajiwibowo@gmail.com',
  // International format for wa.me deep links (Indonesia country code 62, leading 0 dropped).
  // Local number is 082111183273.
  whatsapp: '6282111183273',
  whatsappDisplay: '+62 821 1118 3273',
  // Skills & Tools follow the CV (Ficho, 2026-11-07), in its order, on every
  // breakpoint. Earlier lists followed the mobile Figma frame (8:753).
  skills: [
    'Product Design',
    'Usability Testing',
    'Information Architecture',
    'User Flows',
    'Wireframing',
    'Prototyping',
    'Design Systems',
    'UX Writing (EN/ID)',
    'Graphic Design',
    'HTML/CSS',
  ],
  tools: [
    'Figma',
    'Claude',
    'Claude Code',
    'Figma MCP',
    'Mixpanel',
    'GitHub',
    'Bitbucket',
    'Notion',
    'Jira',
    'Google Workspace',
    'Photoshop',
    'Illustrator',
  ],
  socials: [
    { label: 'LinkedIn', href: 'https://linkedin.com/in/fichoajiwibowo' },
    { label: 'WhatsApp', href: 'https://wa.me/6282111183273' },
    { label: 'Email', href: 'mailto:fichoajiwibowo@gmail.com' },
  ],
} as const

const perLang = {
  id: {
    tagline: 'UI/UX Designer dengan pengalaman 4+ tahun di fintech, merancang produk remitansi lintas negara dan keuangan B2B.',
    bio: [
      'UI/UX Designer dengan pengalaman 4+ tahun di fintech, merancang produk remitansi lintas negara dan keuangan B2B di Indonesia, Singapura, dan Malaysia — mulai dari send money dan payroll hingga compliance flow KYC/KYB.',
      'Berlatar belakang Sistem Informasi, dengan dasar yang kuat di bidang teknologi dan pengembangan produk. Aktif menggunakan AI di seluruh proses desain agar bekerja lebih efisien, mulai dari ideasi dan pemetaan flow hingga dokumentasi dan copy.',
    ],
    nav: [
      { label: 'Karya', href: '#work' },
      { label: 'Skill', href: '#skills' },
      { label: 'Pengalaman', href: '#experience' },
      { label: 'Eksplorasi', href: '#explorations' },
    ],
    // Experience follows the CV (Ficho, 2026-11-07). **x** = semibold. An item
    // with `link` shows it under its text, as the CV does (external = new tab, ↗).
    jobs: [
      {
        company: 'Transfez',
        logo: '/images/logos/transfez.svg',
        role: 'UI/UX Designer',
        period: 'Oktober 2025 - Sekarang',
        items: [
          'Merancang **flow Send Money untuk dua pasar**: aplikasi Singapura (SGD ke IDR) dan aplikasi Malaysia yang akan segera rilis (MYR ke IDR).',
          { text: 'Memimpin **redesign agar voucher di Send Money (ID & SG) lebih mudah ditemukan**, karena user tidak tahu apakah mereka punya voucher yang bisa dipakai; merancang banner rekomendasi voucher dengan apply sekali tap dan voucher tray, yang **divalidasi tim Growth dan disetujui untuk dikembangkan**.', link: { label: 'Studi kasus', href: '/id/work/voucher-points-banner/' } },
          'Sebagai satu-satunya desainer, memperbarui **seluruh komponen di library Transfez Components** dengan workflow berbantuan AI (Claude + Figma MCP), mengelompokkan ulang komponen dan menetapkan standar dokumentasi yang konsisten untuk semua file produk.',
          'Membangun **AI skill (Claude)** yang mengubah pekerjaan desain berulang, seperti dokumentasi komponen dan copy bilingual (EN/ID), menjadi workflow yang bisa dipakai ulang.',
          { text: 'Membangun **halaman utama website Transfez** untuk Indonesia, Singapura, dan Malaysia, serta web experience **AI chatbot Transfez di Malaysia**, menggunakan **Claude Code yang terhubung ke Figma lewat MCP** — desain langsung menjadi kode dan dikirim melalui git workflow tim (commit, pull request).', link: { label: 'Pratinjau website Transfez', href: 'https://web-transfez-rework-staging.netlify.app/' } },
        ],
      },
      {
        company: 'Jack Finance',
        logo: '/images/logos/jack-finance.svg',
        role: 'UI/UX Designer',
        period: 'Oktober 2022 - September 2025',
        items: [
          { text: 'Memimpin desain UI/UX untuk **flow Local Transfer yang mobile-native**, yang mendorong **adopsi mobile 56%** di bulan pertama dan **memangkas waktu penyelesaian 40%**.', link: { label: 'Studi kasus', href: '/id/work/local-transfer-mobile/' } },
          { text: 'Merancang flow **"Quick Transfer"**, opsi yang lebih ringkas untuk pembayaran kecil atau satuan, yang memangkas waktu mulai transfer **52%** dan dipakai di **41% dari semua inisiasi Local Transfer** dalam dua minggu setelah rilis.', link: { label: 'Studi kasus', href: '/id/work/quick-transfer/' } },
          { text: 'Merancang flow **transaction recovery (retry & resubmit)**, yang **menurunkan tiket support 70%** dan **menaikkan payment success rate dari 80% ke 95%**.', link: { label: 'Studi kasus di Notion', href: 'https://app.notion.com/p/Boosting-Payment-Success-Retry-Resubmit-1e2407ef883f802bbf30c03f569104e8' } },
          'Memegang **desain end-to-end** untuk **Send Money (Transfer Internasional & Lokal), Payroll**, dan produk inti lainnya, mulai dari user flow dan information architecture hingga UI high-fidelity.',
          'Merancang **flow onboarding KYB** untuk customer bisnis, sesuai kebutuhan tim Compliance dan Business Development.',
        ],
      },
    ],
    // Not shown in the redesign (Ficho: follow the design); kept for reference.
    experienceArchive: [
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
    tagline: 'UI/UX Designer with 4+ years in fintech, designing cross-border remittance and B2B finance products.',
    bio: [
      'UI/UX Designer with 4+ years in fintech, designing cross-border remittance and B2B finance products across Indonesia, Singapore, and Malaysia — from send money and payroll to KYC/KYB compliance flows.',
      'Background in Information Systems, with a solid foundation in technology and product development. Actively uses AI throughout the design process to work more efficiently, from ideation and flow mapping to documentation and copy.',
    ],
    nav: [
      { label: 'Work', href: '#work' },
      { label: 'Skills', href: '#skills' },
      { label: 'Experience', href: '#experience' },
      { label: 'Exploration', href: '#explorations' },
    ],
    // Experience follows the CV (Ficho, 2026-11-07). **x** = semibold. An item
    // with `link` shows it under its text, as the CV does (external = new tab, ↗).
    jobs: [
      {
        company: 'Transfez',
        logo: '/images/logos/transfez.svg',
        role: 'UI/UX Designer',
        period: 'October 2025 - Present',
        items: [
          'Designed **Send Money flows for two markets**: the Singapore app (SGD to IDR) and the upcoming Malaysia app (MYR to IDR).',
          { text: 'Led the **redesign of voucher discovery in Send Money for ID and SG** after users couldn\'t tell whether they held an applicable voucher; designed a proactive best-voucher banner with one-tap apply and a voucher tray, **validated by the Growth team and approved for development**.', link: { label: 'Case study', href: '/work/voucher-points-banner/' } },
          'As the sole designer, updated **every component in the Transfez Components library** using an AI-assisted workflow (Claude + Figma MCP), regrouping components and setting a consistent documentation standard for all product files.',
          'Built **custom AI skills (Claude)** that turn repeatable design tasks, such as component documentation and bilingual (EN/ID) copy, into reusable workflows.',
          { text: 'Built the **main website pages** for Indonesia, Singapore, and Malaysia, plus the web experience for **Transfez\'s AI chatbot in Malaysia**, using **Claude Code connected to Figma via MCP**, taking designs straight to code and delivering through the team\'s git workflow (commits, pull requests).', link: { label: 'Preview the Transfez website', href: 'https://web-transfez-rework-staging.netlify.app/' } },
        ],
      },
      {
        company: 'Jack Finance',
        logo: '/images/logos/jack-finance.svg',
        role: 'UI/UX Designer',
        period: 'October 2022 - September 2025',
        items: [
          { text: 'Led UI/UX design for the **mobile-native Local Transfer flow**, which drove **56% mobile adoption** in the first month and **cut completion time by 40%**.', link: { label: 'Case study', href: '/work/local-transfer-mobile/' } },
          { text: 'Designed the **"Quick Transfer"** flow, a simpler option for small or single payments, which cut transfer initiation time by **52%** and was used in **41% of all Local Transfer initiations** within two weeks of launch.', link: { label: 'Case study', href: '/work/quick-transfer/' } },
          { text: 'Designed the **transaction recovery flow (retry & resubmit)**, which **cut support tickets by 70%** and raised the **payment success rate from 80% to 95%**.', link: { label: 'Case study on Notion', href: 'https://app.notion.com/p/Boosting-Payment-Success-Retry-Resubmit-1e2407ef883f802bbf30c03f569104e8' } },
          'Owned **end-to-end design** for **Send Money (International & Local Transfer), Payroll**, and other core products, from user flow and information architecture to high-fidelity UI.',
          'Designed the **KYB onboarding flow** for business customers, based on requirements from the Compliance and Business Development teams.',
        ],
      },
    ],
    // Not shown in the redesign (Ficho: follow the design); kept for reference.
    experienceArchive: [
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
