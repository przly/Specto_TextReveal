import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { ElementType, RefObject } from 'react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

export const easeExpoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

type LineCustom = {
  index: number;
  duration: number;
  stagger: number;
  delay: number;
};

const lineVariants: Variants = {
  hidden: { y: '200%' },
  visible: ({ index, duration, stagger, delay }: LineCustom) => ({
    y: '-7%',
    transition: {
      duration,
      delay: delay + index * stagger,
      ease: easeExpoOut,
    },
  }),
};

const reducedLineVariants: Variants = {
  hidden: { opacity: 0 },
  visible: ({ index, stagger, delay }: LineCustom) => ({
    opacity: 1,
    transition: {
      duration: 0.24,
      delay: delay + index * Math.min(stagger, 0.05),
      ease: 'easeOut',
    },
  }),
};

// Fires once, the first time the element crosses `triggerMargin` px before
// entering the viewport, then disconnects — scrolling back up never resets
// or replays it. Backed by IntersectionObserver (native, browser-batched)
// rather than a scroll/resize listener + getBoundingClientRect on every
// frame, so it costs nothing on the main thread between crossings — the
// same triggerMargin values (0 to -400) that used to drive the scroll-based
// trigger line work unchanged here, since a negative bottom rootMargin
// shrinks the intersection root the same way a negative trigger offset
// pushed the old trigger line up.
export function useRevealTrigger<T extends HTMLElement>(
  triggerMargin: number,
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px ${triggerMargin}px 0px` },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [triggerMargin, isVisible]);

  return [ref, isVisible];
}

// Detects the browser's *actual* wrapped lines at the current width (rather
// than relying on hand-authored breakpoints) by measuring an invisible twin
// before the visible text gets masked/split.
function useDetectedLines(text: string) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const container = measureRef.current;
    if (!container) {
      return;
    }

    let frame = 0;

    const measure = () => {
      const wordEls = Array.from(container.querySelectorAll<HTMLSpanElement>('[data-word]'));
      const grouped: string[][] = [];
      let lastTop: number | null = null;

      wordEls.forEach((el) => {
        const top = el.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > 1) {
          grouped.push([]);
          lastTop = top;
        }
        grouped[grouped.length - 1].push(el.textContent ?? '');
      });

      setLines(grouped.map((group) => group.join(' ')));
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    scheduleMeasure();
    document.fonts?.ready?.then(scheduleMeasure);

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [words]);

  return { words, lines, measureRef };
}

// Invisible twin used only to measure where the browser wraps `words`.
// Typography is scoped site-wide as `.context .hero-line{...}` (a
// descendant selector), so `hero-line` must land on a genuine descendant
// here too — putting it on this <p> itself (alongside `className`) would
// never match, since a compound selector isn't a descendant of itself.
function LineMeasureLayer({
  measureRef,
  words,
  className = '',
}: {
  measureRef: RefObject<HTMLParagraphElement>;
  words: string[];
  className?: string;
}) {
  return (
    <p ref={measureRef} className={`line-measure ${className}`.trim()} aria-hidden="true">
      <span className="hero-line">
        {words.map((word, index) => (
          <span data-word className="line-measure-word" key={index}>
            {word}{' '}
          </span>
        ))}
      </span>
    </p>
  );
}

export type RevealTextProps = {
  text: string;
  /** Tag to render the visible text in. Default: 'p'. */
  as?: ElementType;
  /** Reveal per detected line, or per word. Default: 'line'. */
  by?: 'line' | 'word';
  className?: string;
  /** Seconds per line/word's own reveal animation. Default: 1.3. */
  duration?: number;
  /** Seconds between each line/word starting. Default: 0.06. */
  stagger?: number;
  /** Extra seconds before the first line/word starts. Default: 0. */
  delay?: number;
  /**
   * Starting stagger index — lets two separate RevealText blocks (e.g. a
   * heading followed by a paragraph) read as one continuous sequence
   * instead of each restarting its stagger at 0. Pass the previous block's
   * line/word count here via `onCountChange`.
   */
  startIndex?: number;
  /** How many px before entering the viewport to trigger. Default: 0. */
  triggerMargin?: number;
  /** Reports the detected line or word count, for chaining via `startIndex`. */
  onCountChange?: (count: number) => void;
  /**
   * Drives visibility from an external boolean (e.g. a trigger shared by a
   * sibling block) instead of this instance's own IntersectionObserver —
   * lets two visually-separate RevealText blocks (a headline + its body)
   * reveal off one shared crossing rather than each computing its own.
   */
  isTriggered?: boolean;
};

// Drop-in text reveal: masks and slides each line (or word) up into place
// with an expo-out curve, staggered, triggered once when scrolled into view.
// Style it like normal text — font-size, line-height, color, etc. all just
// go on `className`/`style` and cascade down naturally.
export function RevealText({
  text,
  as: Tag = 'p',
  by = 'line',
  className = '',
  duration = 1.3,
  stagger = 0.06,
  delay = 0,
  startIndex = 0,
  triggerMargin = 0,
  onCountChange,
  isTriggered: externalIsTriggered,
}: RevealTextProps) {
  const { words, lines, measureRef } = useDetectedLines(text);
  const [ref, internalIsTriggered] = useRevealTrigger<HTMLElement>(triggerMargin);
  const isTriggered = externalIsTriggered ?? internalIsTriggered;
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? reducedLineVariants : lineVariants;
  const count = by === 'word' ? words.length : lines.length;

  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  // Memoized on `Tag` so this wrapper keeps one stable component identity
  // across re-renders (e.g. when line detection populates `lines` async
  // after mount). Recreating it every render would make React see a "new"
  // component type each time and fully remount the underlying DOM node —
  // silently orphaning the IntersectionObserver that had already attached
  // to the discarded node, leaving the reveal stuck hidden forever.
  const MotionTag = useMemo(() => motion(Tag as ElementType), [Tag]);

  return (
    <div className="specto-paragraph-wrap">
      <LineMeasureLayer measureRef={measureRef} words={words} className={className} />

      <MotionTag
        // Only this instance's own trigger needs a DOM node to observe —
        // when visibility is driven externally, skip attaching the ref so
        // no unused IntersectionObserver gets created for it.
        ref={externalIsTriggered === undefined ? ref : undefined}
        className={`${className}${by === 'word' ? ' specto-paragraph-word-mode' : ''}`.trim()}
        initial="hidden"
        animate={isTriggered ? 'visible' : 'hidden'}
      >
        {by === 'word'
          ? words.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                {/* `hero-line` on the wrap itself (not just the inner span)
                    so its font-size-driven `--mask-space` padding scales
                    with this context's actual type size instead of the
                    inherited ambient default — otherwise descenders clip. */}
                <span className="hero-word-wrap hero-line">
                  <motion.span
                    className="hero-line hero-word"
                    custom={{ index: startIndex + index, duration, stagger, delay }}
                    variants={variants}
                  >
                    {word}
                  </motion.span>
                </span>
                {/* Real, collapsible space (not &nbsp;) sized via the same
                    `.hero-line` typography rules the words use, so the gap
                    matches the font's actual glyph width instead of an
                    approximated margin — and, being collapsible, the
                    browser trims it at a line-wrap exactly like normal
                    text, keeping every wrapped line flush left the same
                    way line-mode's do. */}
                {index < words.length - 1 ? (
                  <span className="hero-line hero-word-space"> </span>
                ) : null}
              </Fragment>
            ))
          : lines.map((line, index) => (
              <span className="hero-line-mask hero-line" key={`${line}-${index}`}>
                <motion.span
                  className="hero-line"
                  custom={{ index: startIndex + index, duration, stagger, delay }}
                  variants={variants}
                >
                  {line}
                </motion.span>
              </span>
            ))}
      </MotionTag>
    </div>
  );
}
