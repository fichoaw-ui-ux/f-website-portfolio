/* Case study indent — one rule for every block (Section, ImageFull,
   FigmaEmbed, ImageGrid, Quote): a block lines up with the text of the
   section it belongs to. Desktop only; on mobile everything starts at 0 and
   the "A." / "A.1" prefixes sit inline (Section.astro).

     indent 0   0   un-numbered sections ("Kickoff") and their assets
     indent 1   32  the text of "A. …"   = prefix column 24 + gap 8
     indent 2   80  the text of "A.1 …"  = 32 + prefix column 40 + gap 8

   80 is not in tokens; it is the sum above. Keep the class strings literal so
   Tailwind finds them. */
export type Indent = boolean | 1 | 2

export const indentPadding = (indent: Indent = false) =>
  indent === 2 ? 'desktop:pl-[80px]' : indent ? 'desktop:pl-(--space-32)' : ''

export const indentMargin = (indent: Indent = false) =>
  indent === 2 ? 'desktop:ml-[80px]' : indent ? 'desktop:ml-(--space-32)' : ''
