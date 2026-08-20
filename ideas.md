# OnePDF by Nivaronix — Design Direction

## Three initial approaches

### 1. Technical Trust Ledger

**Very Brief Intro:** A near-black document workspace with cyan telemetry, built around the clarity and measured confidence of Nivaronix’s security product. It makes local-first processing feel visible, auditable, and reliable.

**Probability:** 0.07

### 2. Paperwork Atelier

**Very Brief Intro:** A warm editorial workspace that treats PDF work as careful craft, using softly textured paper and quiet utility details. It would feel human and premium, but intentionally less adjacent to the Nivaronix parent brand.

**Probability:** 0.04

### 3. Glassline Utility

**Very Brief Intro:** A pale, high-contrast system of translucent panels and blue linework that suggests speed and precision. It is clean and capable, but its brighter tone would not carry the same security gravity as Nivaronix.

**Probability:** 0.09

## Chosen approach: Technical Trust Ledger

**Design Movement:** This direction combines Swiss information design with contemporary cybersecurity product interfaces. The outcome will feel like a trusted operating surface, not a generic document-conversion site.

**Core Principles:** Every meaningful action will have a visible processing state; information will be expressed in compact, legible modules; visual hierarchy will rely on clear type, deliberate negative space, and low-contrast boundaries; and cyan will be reserved for focus, active flow, and verified local processing.

**Color Philosophy:** A near-black foundation lets document previews and white typography remain authoritative. Nivaronix cyan functions as the active signal rather than a decoration. Graphite and slate layer the interface quietly, while the restrained Nivaronix coral red appears only in small brand moments or protective warnings. Green is reserved for successful local processing or completed outputs.

**Layout Paradigm:** The homepage will use a desktop split-rail composition rather than a conventional centered marketing stack. A tall text-and-trust rail anchors the left; a live tool surface forms the right. Lower sections interrupt the rhythm with offset utilities, technical notes, and horizontal process lines. Tool routes will use a command-workbench layout with a persistent contextual rail where useful.

**Signature Elements:** The site will repeatedly use thin cyan processing rails, small uppercase technical labels with double-slash prefixes, and soft graphite cards with an inset panel treatment. File/status lines will use deliberate typography and compact square indicators instead of decorative icon noise.

**Interaction Philosophy:** Interactions should feel like measured document operations. Drop zones acknowledge a file immediately; selected documents reveal structured metadata; processing signals travel along a cyan line; keyboard focus is clear and cyan; no interaction relies on hidden gestures.

**Animation:** Motion stays under 300ms and uses a sharp ease-out. Cards lift only slightly on hover, tool tiles receive a restrained cyan edge shimmer, and result states use a short line-draw/opacity sequence. Document-processing animation must respect `prefers-reduced-motion`; it will reduce to a static status change where requested.

**Typography System:** `Space Grotesk` will carry headlines with distinctive geometry and strong display weight. `IBM Plex Mono` will be used for metadata, tiny labels, file information, and processing states. `Manrope` will support long reading and controls, maintaining accessibility while avoiding a generic UI appearance. Headlines are left-aligned and tight; utility labels are uppercase, tracked, and compact.

**Brand Essence:** OnePDF by Nivaronix is the private, local-first PDF workbench for people who need document control without surrendering their files. Personality: exacting, discreet, capable.

**Brand Voice:** Headline copy is direct and procedural; CTAs use clear verbs; microcopy explains the processing boundary in plain terms. Example lines: “Your files stay in the workbench.” and “Merge locally. Download immediately.” Generic welcome language and vague promises are prohibited.

**Wordmark & Logo:** The header will use the supplied Nivaronix wordmark alongside an original OnePDF folded-document mark. The product name is set as a deliberately weighted wordmark, with the parent attribution in compact technical type rather than default text styling.

**Signature Brand Color:** **Signal Cyan — #05C8F6** is OnePDF’s active, ownable operating color.

## Style Decisions

- Keep Nivaronix’s near-black foundation and cyan signal color intact across all prominent surfaces.
- Use no large purple gradients, no default Inter typography, and no rounded-card overload.
- Visual assets are abstract technical/product editorial pieces only; they should not introduce a second visual brand.
- All pages must make processing mode explicit and must never overstate local privacy claims.
