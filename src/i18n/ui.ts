export type Lang = 'id' | 'en'

export function resolveLocale(currentLocale: string | undefined): Lang {
  return currentLocale === 'en' ? 'en' : 'id'
}

const dictionary = {
  id: {
    header: { backToHome: 'Kembali ke Beranda', contactMe: 'Hubungi Saya', menu: 'Menu' },
    footer: { rights: 'Hak cipta dilindungi.' },
    hero: { greeting: 'Halo!', intro: "Ficho.", roleLine: 'product designer' },
    about: {
      heading: 'Profil',
      skills: 'SKILL',
      tools: 'TOOLS',
      portraitAlt: (name: string) => `Potret ${name}`,
    },
    contact: {
      heading: 'Yuk, bikin sesuatu bareng',
      bodyBefore: 'Terbuka untuk kerja product design dan kolaborasi. Bisa hubungi saya di ',
      bodyAfter: ', atau say hi lewat LinkedIn atau WhatsApp di bawah.',
    },
    experience: { heading: 'Pengalaman Kerja' },
    common: { viewDetails: 'Lihat Detail' },
    selectedWork: {
      heading: 'Karya pilihanku',
      subcopy: 'Dengan mata yang detail dan cara berpikir yang kritis, saya fokus bikin website, produk, dan experience yang menarik.',
      noProjects: 'Belum ada proyek.',
    },
    caseStudy: { titleSuffix: ' — Studi Kasus', nextProject: 'Proyek selanjutnya' },
    exploration: {
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
    about: {
      heading: 'About me',
      skills: 'SKILLS',
      tools: 'TOOLS',
      portraitAlt: (name: string) => `Portrait of ${name}`,
    },
    contact: {
      heading: "Let's build something together",
      bodyBefore: 'Open to product design work and collaborations. You can reach me at ',
      bodyAfter: ', or say hi on LinkedIn or WhatsApp below.',
    },
    experience: { heading: "Where I've worked" },
    common: { viewDetails: 'View Details' },
    selectedWork: {
      heading: 'My selected works',
      subcopy: 'With my keen eye for detail and sharp critical thinking skills, I specialize in crafting captivating websites, products, and experiences.',
      noProjects: 'No projects yet.',
    },
    caseStudy: { titleSuffix: ' — Case Study', nextProject: 'Next project' },
    exploration: {
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
