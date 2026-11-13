/* Case study indent — one rule for every block (Section, ImageFull,
   FigmaEmbed, ImageGrid, Quote): a block lines up with the text of the
   section it belongs to. Desktop only; on mobile everything starts at 0 and
   the "A." / "A.1" prefixes sit inline (Section.astro).

     indent 0   0   un-numbered sections ("Kickoff") and their assets
     indent 1   32  the text of "A. …"   = prefix column 24 + gap 8
     indent 2   80  the text of "A.1 …"  = 32 + prefix column 40 + gap 8
     indent 3   136 the text of "A.1.1 …" = 80 + prefix column 48 + gap 8
     "sub"      16  a numbered sub-section under an un-numbered section
                    ("1." under "Exploration & Validation"; Ficho: a
                    smaller step than 32)
     "subText"  48  that sub-section's text and assets = 16 + prefix 24 + gap 8

   80 and 136 are not in tokens; they are the sums above. Keep the class strings literal so
   Tailwind finds them. */
export type Indent = boolean | 1 | 2 | 3 | 'sub' | 'subText'

export const indentPadding = (indent: Indent = false) =>
  indent === 3 ? 'desktop:pl-[136px]'
  : indent === 2 ? 'desktop:pl-[80px]'
  : indent === 'sub' ? 'desktop:pl-(--space-16)'
  : indent === 'subText' ? 'desktop:pl-(--space-48)'
  : indent ? 'desktop:pl-(--space-32)' : ''

export const indentMargin = (indent: Indent = false) =>
  indent === 3 ? 'desktop:ml-[136px]'
  : indent === 2 ? 'desktop:ml-[80px]'
  : indent === 'sub' ? 'desktop:ml-(--space-16)'
  : indent === 'subText' ? 'desktop:ml-(--space-48)'
  : indent ? 'desktop:ml-(--space-32)' : ''
