# DeepStudy design system

## Product intent

DeepStudy is an adaptive learning operating system for university students. The interface should answer one question before anything else: what is the highest-value learning action I can complete now?

The product is calm, exact and academically serious. It should feel like a well-edited study instrument, not a generic analytics dashboard and not a chat product.

## Direction

- Genre: modern minimal
- Theme: Cobalt
- Public-site macrostructure: Narrative Workflow
- Product navigation: edge-aligned five-item navigation
- Footer family: Statement
- Primary use: begin the next learning session
- Tone: restrained, clear, technical without feeling cold

## Visual language

Use cool white paper, deep blue-black text and one cobalt action colour. Graphite sections may be used to explain the learning workflow. Avoid gradients, decorative blobs, floating glass surfaces and excessive card grids.

Layouts are editorial and asymmetric. Use borders, spacing and typographic weight for hierarchy. Cards are reserved for real interactive or grouped content. Corners remain restrained at 6–12px.

## Typography

- Display and Latin headings: Space Grotesk Variable
- Body and CJK: Noto Sans SC Variable
- Data and compact technical labels: the system mono stack exposed by `--font-outlier`
- Display headings use tight tracking and short line lengths.
- Body copy stays between 16px and 20px with generous line height.
- Chinese and English are separate locale variants. Do not mix languages as decoration.

## Colour tokens

All colour values live in `tokens.css` and use OKLCH. Components consume semantic tokens only: paper, card, rule, ink, muted, accent, graphite, success, warning and error.

## Spacing and layout

- Base spacing unit: 4px
- Public content maximum: 1240px
- Reading content maximum: 720px
- App content maximum: 1180px
- Desktop app: fixed left navigation and a fluid content area
- Mobile app: persistent five-item bottom navigation
- Supported viewport gates: 320, 375, 414, 768 and desktop

## Interaction

- One primary action per page or section.
- Hover and press feedback should be subtle and use colour or a 1–2px translation.
- Focus rings are always visible for keyboard users.
- Motion uses the shared short and long durations and respects reduced-motion preferences.
- Loading, empty, success and error states must remain legible without relying on colour alone.

## Public site

The homepage follows a single narrative:

1. State the outcome.
2. Show the semester-to-session trace.
3. Explain the four-stage adaptive workflow.
4. Show how a session becomes mastery evidence.
5. Clarify subject breadth, pricing and academic integrity.

Navigation is deliberately sparse: brand, language switch, sign in and the primary start action. The footer closes with one strong statement and minimal legal links.

## Product shell

The five primary destinations are Today, Courses, Practice, Tools and Progress. Planning, resources, tutor, reminders and settings remain accessible as secondary destinations. The shell never makes the AI chat the centre of every screen.

## Locale behaviour

- First visit: select Chinese for a Chinese system preference; otherwise select English.
- Explicit switch: persist in the `deepstudy_locale` cookie.
- Render one language on the server; never place both translations in the visible page.
- Set the document `lang` attribute to the active locale.
- User account language remains authoritative inside the signed-in application.

## Component rules

- Buttons: solid cobalt primary, quiet text/border secondary, minimum 44px touch target.
- Inputs: paper background, visible label, 1px rule, cobalt focus outline.
- Cards: only for grouped content; no ornamental elevation.
- Labels: sentence case in the current language; do not use English uppercase eyebrows on Chinese pages.
- Icons: one consistent 1.7px outline SVG family, never Unicode glyphs as navigation icons.

## Token exports

### CSS

The canonical runtime export is `tokens.css`.

### Tailwind

Map the semantic tokens through Tailwind theme variables rather than duplicating colour literals:

```css
@theme inline {
  --color-background: var(--color-paper);
  --color-foreground: var(--color-ink);
  --color-primary: var(--color-accent);
  --font-sans: var(--font-body);
}
```

### DTCG

```json
{
  "color": {
    "paper": { "$type": "color", "$value": "oklch(98.5% 0.004 250)" },
    "ink": { "$type": "color", "$value": "oklch(20.5% 0.028 258)" },
    "accent": { "$type": "color", "$value": "oklch(49% 0.22 258)" }
  }
}
```

### shadcn-compatible variables

```css
:root {
  --background: var(--color-paper);
  --foreground: var(--color-ink);
  --primary: var(--color-accent);
  --primary-foreground: var(--color-accent-ink);
  --border: var(--color-rule);
  --ring: var(--color-focus);
}
```

