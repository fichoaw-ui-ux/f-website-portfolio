export type Lang = 'id' | 'en'

// English is the default language (astro.config: defaultLocale 'en', served at /);
// Indonesian lives under /id. Anything that is not explicitly 'id' renders English.
export function resolveLocale(currentLocale: string | undefined): Lang {
  return currentLocale === 'id' ? 'id' : 'en'
}

const dictionary = {
  id: {
    header: { backToHome: 'Kembali ke Beranda', contactMe: 'Hubungi Saya', menu: 'Menu' },
    footer: { rights: 'Hak cipta dilindungi.' },
    hero: { greeting: 'Halo!', intro: "Saya Ficho.", roleLine: 'product designer' },
    tabs: {
      label: 'Navigasi section',
      experience: 'Pengalaman',
      skills: 'Skill & Tools',
      studyCase: 'Studi Kasus',
      exploration: 'Eksplorasi',
    },
    skillsTools: { skills: 'Skill', tools: 'Tools' },
    compactHeader: { contact: 'Kontak' },
    languageSwitch: { label: 'Bahasa' },
    contact: {
      heading: 'Terbuka untuk peluang kerja dan freelance',
      bodyBefore: 'Terbuka untuk kerja product design dan kolaborasi. Bisa hubungi saya di ',
      bodyAfter: ', atau say hi lewat LinkedIn atau WhatsApp di bawah.',
    },
    experience: { heading: 'Pengalaman Kerja' },
    common: { viewDetails: 'Lihat Detail' },
    selectedWork: {
      heading: 'Studi Kasus',
      noProjects: 'Belum ada proyek.',
    },
    caseStudy: { titleSuffix: ' — Studi Kasus', nextProject: 'Proyek selanjutnya', partsLabel: 'Bagian studi kasus' },
    exploration: {
      heading: 'Eksplorasi',
      backToExplorations: '← Kembali ke eksplorasi',
      titleSuffix: ' — Eksplorasi',
      noExplorations: 'Belum ada eksplorasi.',
      openPrototype: (title: string) => `Buka prototipe ${title}`,
      openDetails: (title: string) => `Buka detail ${title}`,
      seePrototype: 'Lihat Prototipe',
      visitLiveSite: 'Kunjungi Situs Live',
      closePrototype: 'Tutup prototipe',
      closeLabel: 'Tutup ✕',
    },
    figmaEmbed: { prototypeLabel: 'Prototipe', openInFigma: 'Buka di Figma ↗', defaultTitle: 'Prototipe Figma' },
    imageFull: { imageLabel: 'Gambar', placeholderLabel: 'Placeholder', viewFull: 'Lihat penuh ↗' },
    lightbox: { close: 'Tutup' },
  },
  en: {
    header: { backToHome: 'Back to Home', contactMe: 'Contact Me', menu: 'Menu' },
    footer: { rights: 'All rights reserved.' },
    hero: { greeting: 'Hello!', intro: "I'm Ficho.", roleLine: 'a product designer' },
    tabs: {
      label: 'Section navigation',
      experience: 'Experience',
      skills: 'Skills & Tools',
      studyCase: 'Study Case',
      exploration: 'Exploration',
    },
    skillsTools: { skills: 'Skills', tools: 'Tools' },
    compactHeader: { contact: 'Contact' },
    languageSwitch: { label: 'Language' },
    contact: {
      heading: "Let's build something together",
      bodyBefore: 'Open to product design work and collaborations. You can reach me at ',
      bodyAfter: ', or say hi on LinkedIn or WhatsApp below.',
    },
    experience: { heading: "Where I've worked" },
    common: { viewDetails: 'View Details' },
    selectedWork: {
      heading: 'My selected works',
      noProjects: 'No projects yet.',
    },
    caseStudy: { titleSuffix: ' — Case Study', nextProject: 'Next project', partsLabel: 'Case study sections' },
    exploration: {
      heading: 'Explorations',
      backToExplorations: '← Back to explorations',
      titleSuffix: ' — Exploration',
      noExplorations: 'No explorations yet.',
      openPrototype: (title: string) => `Open ${title} prototype`,
      openDetails: (title: string) => `Open ${title} details`,
      seePrototype: 'See Prototype',
      visitLiveSite: 'Visit Live Site',
      closePrototype: 'Close prototype',
      closeLabel: 'Close ✕',
    },
    figmaEmbed: { prototypeLabel: 'Prototype', openInFigma: 'Open in Figma ↗', defaultTitle: 'Figma prototype' },
    imageFull: { imageLabel: 'Image', placeholderLabel: 'Placeholder', viewFull: 'View full ↗' },
    lightbox: { close: 'Close' },
  },
} as const

export function useTranslations(lang: Lang) {
  return dictionary[lang]
}
