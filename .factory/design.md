# Maintenance Proof Book — visual thesis

## Direction: a working blueprint, not a showroom

The product is a homeowner's evidence ledger, so it borrows the trust cues of a blueprint drafting sheet: an ink-blue field, ruled construction lines, cream paper slips, registration marks, and a single repair-orange pencil accent. The interface should feel annotated and exact without becoming cold. Evidence itself stays visually dominant; decoration explains how a loose receipt, part, repair and future date become one packet.

The direction is intentionally single-mode. Deep blueprint blue is the explicit canvas in every color scheme, while cream sheets supply the bright reading surface. This preserves the identity and avoids an unrelated generic dark-mode treatment.

## Tokens

| Role | Token | Value | Rationale |
| --- | --- | --- | --- |
| Canvas | `--blueprint` | `#092A43` | The working drawing field |
| Canvas raised | `--blueprint-raised` | `#103B59` | Controls and inset panels |
| Paper | `--paper` | `#F4F0E4` | Durable record sheets |
| Paper low | `--paper-low` | `#E4DDCB` | Secondary paper surfaces |
| Ink | `--ink` | `#12222D` | Primary text on paper (≥ 12:1) |
| Chalk | `--chalk` | `#F6F2E8` | Primary text on blue (≥ 12:1) |
| Muted chalk | `--chalk-muted` | `#B9CEDB` | Secondary text on blue (≥ 7:1) |
| Pencil | `--pencil` | `#E9763A` | Main action and due-date mark |
| Pencil dark | `--pencil-dark` | `#9B3D14` | Text/accent on paper (≥ 6:1) |
| Success | `--success` | `#2E7D5B` | Saved/complete, always with words/icon |
| Warning | `--warning` | `#A84B16` | Due soon, always with words/icon |
| Danger | `--danger` | `#A52C38` | Destructive action |
| Focus | `--focus` | `#FFD166` | High-contrast drafting highlight |

Blueprint lines use low-opacity white and never carry meaning. Status uses icon + text as well as color.

## Typography

- Headings and reference numbers: `Arial Narrow`, `Roboto Condensed`, `Aptos Narrow`, sans-serif — a compact technical-lettering stack with no network font dependency.
- Body and forms: `Inter`, `Aptos`, `Segoe UI`, system sans-serif — legible utility copy at a 16px minimum.
- Dates, money and record IDs use tabular figures. The scale is 16 / 18 / 22 / 30 / clamp(40–64) px, with 1.45–1.6 body leading.

## Spacing and shape

An 8px base rhythm (`4, 8, 12, 16, 24, 32, 48, 64`). Reading measure is 68ch. Controls are at least 44px high with 12px corners. Paper cards have a clipped top-right corner and a slight hard-edged shadow, like slips pinned over a drawing. Dotted rules group related evidence; full boxes are reserved for independent repair packets.

## Interaction grammar

- The primary action is the orange “Record a repair” button, repeated where an empty timeline needs it.
- Opening a repair brings a paper-sheet dialog from the originating card. Evidence rows resemble indexed attachments and expose filename, kind, size and capture time.
- Save feedback is immediate in a polite live region. Destructive actions name the repair and require confirmation; deletion offers a 10-second undo.
- Search and filters sit on the blueprint, while editable/readable content sits on paper.
- On phones, the two-column drafting desk becomes one column; summary labels compress, but evidence details and actions do not disappear.

## Motion

Sheet/dialog transitions use 180–240ms opacity + translate/scale and originate from the lower edge. Cards use a short 180ms opacity entrance. No looping motion. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling become effectively instant; state and depth remain clear through borders and layering.

## Original asset plan and provenance

- `public/assets/evidence-exploded.webp`: original generated hero illustration showing a roof repair evidence packet as an exploded, axonometric blueprint assembly—house section, receipt, camera print, replacement part, calendar marker. It explains the central product promise rather than serving as filler.
- `public/assets/sample-roof-repair.webp`: original generated sample evidence image of a completed shingle repair. It appears only inside the isolated demo so a sample packet has realistic visual evidence.
- `public/assets/social-preview.jpg`: a deterministic 1200 × 630 crop of the original hero illustration for link previews.
- App icons are hand-authored SVG drafting marks (house outline + check/tab), exported locally to PNG. Interface icons use inline, hand-authored SVG paths.
- Decorative paper grid and registration marks are CSS, not downloaded assets.

### Prompt sheet

Use case: `stylized-concept`. Asset type: landing/product empty-state hero. Primary request: an exploded axonometric evidence packet for one ordinary home roof repair, connecting a small house roof section, a plain receipt slip, an instant photo of shingles, one simple metal fastener part, and a calendar tab with thin drafting leader lines. Scene: deep navy architectural blueprint sheet. Style: precise cut-paper editorial illustration crossed with technical drafting, tactile cream paper, cyan pencil construction lines, restrained orange pencil marks. Composition: landscape, objects clustered toward the right and center with calm negative space, no UI mockup. Light: soft overhead desk light, modest paper shadows, quiet and trustworthy. Palette: blueprint navy, chalk cream, pale cyan, repair orange, graphite. Avoid: people, hands, brands, logos, legible text, watermarks, gradients, glossy 3D, futuristic devices, legal seals or certificates.

Generated via the factory Azure image endpoint (`/opt/fleet/lib/gen-image.sh`, deployment `factory-image`) on 2026-08-28. Original output is product-specific AI-generated imagery; no third-party copyrighted asset is incorporated. The chosen candidate is reviewed for text artifacts, seams, accidental marks, and palette fit before shipping. Prompt and generation metadata are retained beside the source image in `assets/src/evidence-exploded.json`.

### Sample evidence prompt

Use case: `photorealistic-natural`. Asset type: fictional evidence photo in the demo repair packet. Primary request: a close, ordinary homeowner documentation photo of a small completed asphalt-roof shingle patch around a vent flashing. Scene: overcast daylight on an unbranded suburban roof. Style: honest phone-camera photograph, slightly imperfect framing, clear construction detail. Composition: landscape crop with the repaired shingles centered and enough surrounding roof to show context. Palette: charcoal shingles, muted zinc flashing, cool daylight. Avoid: people, hands, text, logos, watermarks, dramatic damage, unsafe activity, certificates, receipts, addresses, or identifying details. The demo identifies this as sample data.

Generated with the factory `factory-image` deployment on 2026-09-05. The selected output was checked for text, brands, identifying details, unsafe activity, and visual artifacts. Its complete prompt and model metadata are stored in `assets/src/sample-roof-repair.png.json`. The social preview is a centered crop of the existing hero image made without generative changes.
