# Specto Type Animation

A Vite + React study of the Specto text-reveal effect: text masks in and
slides up into place, either per line or per word, triggered once as it
scrolls into view.

## Setup

```
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build
npm run preview   # serve the production build locally
```

## Implementing the reveal engine in a new project

The engine is one file (`src/RevealText.tsx`) plus a handful of global CSS
rules — there's no build step or package to publish, just copy both over.

1. **Install the animation dependency.**
   ```
   npm install motion
   ```

2. **Copy `src/RevealText.tsx`** into the target project as-is. It exports
   `RevealText` (the component) and `useRevealTrigger` (the trigger hook,
   for cases where a parent needs to drive `isTriggered` itself — see
   [Trigger](#5-trigger-userevealtrigger) below).

3. **Add the required CSS.** Drop this into a global stylesheet (adjust
   `--mask-space` and the font-size/line-height values to taste — the
   exact numbers don't matter, only that every selector below exists):
   ```css
   :root {
     --mask-space: 0.65em; /* clip-box padding; prevents descender clipping */
   }

   .hero-line-mask {
     display: block;
     overflow: clip;
     padding-bottom: var(--mask-space);
     margin-bottom: calc(var(--mask-space) * -1);
   }

   .hero-line {
     display: block;
     font-size: 1em;       /* override per block, see step 4 */
     line-height: 1.2;     /* override per block */
     white-space: nowrap;
     transform-origin: 50% 100%;
     will-change: transform, opacity;
   }

   .specto-paragraph-word-mode {
     line-height: 0; /* word mode only: strip the wrapper's own strut */
   }

   .hero-word-wrap {
     display: inline-block;
     overflow: clip;
     vertical-align: baseline;
     padding-bottom: var(--mask-space);
     margin-bottom: calc(var(--mask-space) * -1);
     padding-right: 0.15em; /* buffer for overhanging glyphs, e.g. "y", "?" */
     margin-right: -0.15em;
   }

   .hero-word {
     display: inline-block;
   }

   .line-measure {
     position: absolute;
     inset: 0;
     width: 100%;
     height: 0;
     overflow: hidden;
     visibility: hidden;
     pointer-events: none;
   }
   ```

4. **Style each block's typography** with a descendant selector scoped to
   the `className` you pass in, targeting `.hero-line` — never the
   `className` alone (see [Required CSS](#required-css) for why):
   ```css
   .my-heading .hero-line {
     font-size: 48px;
     line-height: 1.05;
     letter-spacing: -0.02em;
   }
   ```

5. **Render it:**
   ```tsx
   import { RevealText } from './RevealText';

   <RevealText as="h1" text="Hello world" className="my-heading" />
   ```

No other setup is needed — `RevealText` manages its own line detection,
resize/font-load re-measurement, stagger, trigger, and reduced-motion
fallback internally.

## The reveal animation: `RevealText`

All of the reveal behavior lives in `src/RevealText.tsx` as a single
drop-in component. Style it like normal text — `font-size`, `line-height`,
color, etc. all go on `className`/`style` and cascade down to the text
naturally.

```tsx
<RevealText
  as="h1"
  text="Specto is a design & development studio."
  className="hero-headline"
  by="line"          // 'line' (default) or 'word'
  duration={1.3}
  stagger={0.06}
  triggerMargin={-120}
/>
```

### How it works

**1. Line detection (`useDetectedLines`)**
Before anything is animated, the text is rendered once into an invisible
"measure" twin (`LineMeasureLayer`) at the element's real width. Each word
is measured via `offsetTop`, and words sharing a `top` are grouped into a
detected line. This reads the browser's *actual* wrapping at the current
viewport width instead of relying on hand-authored line breaks, and
re-measures on resize (`ResizeObserver`) and once web fonts finish loading
(`document.fonts.ready`), since font metrics can shift line breaks.

**2. Splitting into lines or words (`by` prop)**
- `by="line"` (default): each detected line is wrapped in a
  `.hero-line-mask` (a fixed-height, `overflow: clip` box) containing a
  `motion.span`. The whole line slides as one unit.
- `by="word"`: each word gets its own `.hero-word-wrap` clip box and
  animates independently, with a real (collapsible) space character
  between words so the browser wraps them exactly like normal text. Word
  mode is what makes a duplicate-block "word cascade" variant possible
  alongside the line-based one.

**3. The motion itself (`lineVariants`)**
Each line/word starts at `y: '200%'` (pushed below its own clip box, so
it's fully hidden) and animates to `y: '-7%'` with a custom expo-out ease
(`easeExpoOut`). The `-7%` (not `0%`) is a slight overshoot that keeps the
settle from reading as abrupt. The clip box (`overflow: clip` +
negative-margin `padding-bottom: var(--mask-space)`) is what actually
masks the motion — the line/word is genuinely off-screen within its own
box, not just faded.

**4. Stagger (`custom` + `Variants`)**
Each line/word is passed `custom={{ index, duration, stagger, delay }}`,
and the variant computes its own `transition.delay` as
`delay + index * stagger`. `index` defaults to the line/word's position,
but can be offset with `startIndex` — this lets two separate `RevealText`
blocks (e.g. a heading followed by a paragraph) read as one continuous
staggered sequence instead of each restarting at index 0. Report the
first block's count via `onCountChange` and feed it into the second
block's `startIndex`:

```tsx
<RevealText text={heading} onCountChange={setHeadlineLineCount} />
<RevealText text={body} startIndex={headlineLineCount} />
```

**5. Trigger (`useRevealTrigger`)**
Visibility is driven by a native `IntersectionObserver` (not a scroll +
`getBoundingClientRect` listener, which would run on every scroll frame).
`triggerMargin` (default `0`, typically negative) shrinks the observed
root the same way a "trigger line" above the true viewport bottom would:
a more negative value makes the reveal fire earlier, before the element
reaches the bottom edge. The observer **disconnects after the first
intersection** — scrolling back up and down again never resets or replays
the animation.

Two or more blocks can also share one trigger instead of each running its
own observer, via `isTriggered`:

```tsx
const [heroRef, isHeroTriggered] = useRevealTrigger<HTMLElement>(-120);
// ...
<RevealText text={headline} isTriggered={isHeroTriggered} />
<RevealText text={body} isTriggered={isHeroTriggered} startIndex={headlineLineCount} />
```

**6. Reduced motion**
`useReducedMotion()` swaps `lineVariants` for `reducedLineVariants`, which
fades opacity in place instead of animating `y`, with a shorter duration
and a capped stagger — so `prefers-reduced-motion` users still get a
sense of sequence without the slide/mask motion.

## Usage: per line vs per word

Both modes go through the same `RevealText` component — only the `by`
prop changes.

**Per line (`by="line"`, the default)** — each detected line slides up as
one unit. Use this for headlines and body copy where the text should read
as whole lines settling into place.
```tsx
<RevealText
  as="h1"
  text="Specto is a design & development studio."
  className="hero-headline"
  duration={1.3}
  stagger={0.06}
/>
```

**Per word (`by="word"`)** — each word slides up independently, staggered
across the whole block regardless of which line it wraps onto. Use this
for a punchier, word-by-word cascade — it reads faster and more granular
than line mode, at the cost of a much longer stagger sequence for long
copy (every word gets its own delay, not just every line).
```tsx
<RevealText
  as="h1"
  text="Specto is a design & development studio."
  className="hero-headline"
  by="word"
  duration={1.3}
  stagger={0.02}   // typically much smaller than line-mode stagger —
                    // a word count is usually 5-10x a line count
/>
```

Rules of thumb:
- **Keep `stagger` small in word mode.** With `stagger={0.06}` (the
  line-mode default) applied per word, a 10-word headline takes 600ms
  just to start its last word. Scale `stagger` down roughly in proportion
  to how many more words than lines the text has.
- **Both modes accept the same layout/typography CSS** — switching `by`
  on an existing block doesn't require different styling, only the same
  `.hero-line` descendant rules from [Required CSS](#required-css) (word
  mode additionally relies on `.hero-word-wrap` / `.specto-paragraph-word-mode`,
  which are global and don't need per-block overrides).
- **Chaining works the same way in both modes** — `onCountChange` reports
  a line count in line mode and a word count in word mode, so pass it
  straight through to the next block's `startIndex` regardless of which
  mode either block uses.
- **Don't mix `by` on visually stacked/shared-trigger blocks** unless the
  stagger difference is intentional — e.g. `src/App.tsx`'s hero block and
  its word-mode duplicate use different `stagger` values on purpose, so
  the two read at deliberately different paces.

### Required CSS

`RevealText` expects a handful of selectors to exist wherever its
`className` is used (see `src/styles.css`):

- `--mask-space` (a CSS var, typically in `em`) — the padding/negative
  margin used by both `.hero-line-mask` and `.hero-word-wrap` to build the
  clip box without clipping descenders.
- `.hero-line` — sets `font-size` / `line-height` / `letter-spacing` for
  the actual text; scope your typography with a descendant selector, e.g.
  `.hero-headline .hero-line { font-size: ...; }`, not on the class
  itself — `RevealText` renders the class on a container, and `.hero-line`
  on genuine descendants (including the invisible measure twin), so a
  compound selector on the class alone won't match either.
- `.hero-line-mask` / `.hero-word-wrap` — the clip boxes (already defined
  globally; you don't need to redeclare these per block).

### Props reference

| Prop | Default | Description |
| --- | --- | --- |
| `text` | — | Text to reveal. |
| `as` | `'p'` | Tag to render the visible text in. |
| `by` | `'line'` | Reveal per detected line, or per word. |
| `className` | `''` | Cascades typography to `.hero-line` descendants. |
| `duration` | `1.3` | Seconds per line/word's own reveal animation. |
| `stagger` | `0.06` | Seconds between each line/word starting. |
| `delay` | `0` | Extra seconds before the first line/word starts. |
| `startIndex` | `0` | Starting stagger index, for chaining two blocks. |
| `triggerMargin` | `0` | Px before entering the viewport to trigger. |
| `onCountChange` | — | Reports detected line/word count, for `startIndex` chaining. |
| `isTriggered` | — | Drives visibility from an external boolean/shared trigger instead of this instance's own observer. |
