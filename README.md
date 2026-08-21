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
