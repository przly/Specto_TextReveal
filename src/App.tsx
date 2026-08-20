import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { RevealText, easeExpoOut, useRevealTrigger } from './RevealText';

type Column = string[];

type WhyUsCardData = {
  title: string;
  columns: Column[];
  cta?: string;
};

type TextStudyBlockData = {
  text: string;
  className: string;
  scale: 'title' | 'body';
};

type CopyVariant = {
  fontSize: string;
  tracking: string;
  lineHeight: number;
  arrowSize: string;
  introGap: string;
  arrowOffset: number;
  lineDelay: number;
  lineDuration: number;
};

const HERO_HEADLINE_TEXT = 'Specto is a design & developement studio.';
const HERO_BODY_TEXT =
  'We turn your ideas into digital products from zero to launch by combining strategy, design & development all under one roof.';

type LineAnimationConfig = {
  index?: number;
  lineDelay: number;
  lineDuration: number;
  headlineOffset: number;
  lineOffset?: number;
  arrowOffset?: number;
};

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const whyUsCards: WhyUsCardData[] = [
  {
    title: 'We build products that matter.',
    columns: [
      [
        'Curiosity and creativity drive us.',
        'We embrace challenges because they uncover opportunities for innovative solutions that deliver real business impact.',
      ],
      [
        'Our work isn’t just executed. It’s carefully crafted to solve meaningful problems. This approach attracts top talent and forms teams of experts that partner with you to create the digital products of tomorrow.',
      ],
    ],
  },
  {
    title: 'Solutions built for your business',
    columns: [
      [
        'Each partnership begins with listening and ends with measurable business growth. From concept to launch, we work closely with your team to define goals, choose the right technology, and deliver seamless digital experiences.',
      ],
      [
        'Every project is unique, but our focus stays the same: clarity, reliability, and results that make a difference.',
      ],
    ],
  },
  {
    title: 'Honest. Clear. Results.',
    columns: [
      [
        'We believe in long-term partnerships built on trust and transparency. Our no bullshit approach means we communicate clearly and professionally.',
        'No jargon, no fluff.',
      ],
      [
        'Working with us is simple. We stay reliable and committed throughout the entire product lifecycle, delivering tailored solutions with measurable impact, because your KPIs are our KPIs. We provide support and partnership through real people who are fully dedicated to your success.',
      ],
    ],
  },
  {
    title: 'What we deliver?',
    columns: [
      [
        'We deliver strategic product services across product discovery, full build out, and ongoing elevation of your digital assets, turning opportunities into launched products and scaling existing ones into market leaders.',
      ],
    ],
    cta: 'See all out work',
  },
  {
    title: 'Proven since 2014.',
    columns: [
      [
        'Since 2014, we’ve partnered with companies of all shapes & sizes. Building trust, delivering measurable results, and growing together.',
      ],
    ],
    cta: 'See all out work',
  },
];

const whyUsImage =
  'https://www.figma.com/api/mcp/asset/4af3ef81-689c-4636-a37d-4abd522f4201';

const textStudyBlocks: TextStudyBlockData[] = [
  {
    text: 'Sint commodo magna officia sit ea excepteur sint enim incididunt.',
    className: 'text-study-block text-study-block-xl',
    scale: 'title',
  },
  {
    text: 'Sint commodo magna officia sit ea excepteur sint enim. Incididunt anim consectetur nulla sint esse eu consectetur. Nisi enim est consequat eiusmod laboris laborum exercitation pariatur enim sunt eiusmod nostrud incididunt nostrud nisi.',
    className: 'text-study-block text-study-block-lg',
    scale: 'title',
  },
  {
    text: 'Sint commodo magna officia sit ea excepteur sint enim. Incididunt anim consectetur nulla sint esse eu consectetur. Nisi enim est consequat eiusmod laboris laborum exercitation pariatur enim sunt eiusmod nostrud incididunt nostrud nisi. Cupidatat laboris adipisicing quis sunt deserunt adipisicing. Velit ullamco id excepteur consequat consequat. Adipisicing ea cillum cupidatat aliqua tempor esse.',
    className: 'text-study-block text-study-block-md',
    scale: 'body',
  },
  {
    text: 'Sint commodo magna officia sit ea excepteur sint enim. Incididunt anim consectetur nulla sint esse eu consectetur. Nisi enim est consequat eiusmod laboris laborum exercitation pariatur enim sunt eiusmod nostrud incididunt nostrud nisi. Cupidatat laboris adipisicing quis sunt deserunt adipisicing. Velit ullamco id excepteur consequat consequat. Adipisicing ea cillum cupidatat aliqua tempor esse.',
    className: 'text-study-block text-study-block-sm',
    scale: 'body',
  },
];

const COPY_VARIANTS: Record<'desktop' | 'desktopCompact' | 'tablet' | 'mobile', CopyVariant> = {
  desktop: {
    fontSize: '60px',
    tracking: '-0.04em',
    lineHeight: 1.0,
    arrowSize: '30px',
    introGap: '22px',
    arrowOffset: -100,
    lineDelay: 0.08,
    lineDuration: 0.78,
  },
  desktopCompact: {
    fontSize: '50px',
    tracking: '-0.038em',
    lineHeight: 1.02,
    arrowSize: '28px',
    introGap: '20px',
    arrowOffset: -88,
    lineDelay: 0.075,
    lineDuration: 0.75,
  },
  tablet: {
    fontSize: '40px',
    tracking: '-0.03em',
    lineHeight: 1.08,
    arrowSize: '24px',
    introGap: '20px',
    arrowOffset: -76,
    lineDelay: 0.07,
    lineDuration: 0.72,
  },
  mobile: {
    fontSize: '24px',
    tracking: '-0.02em',
    lineHeight: 1.2,
    arrowSize: '24px',
    introGap: '24px',
    arrowOffset: -56,
    lineDelay: 0.06,
    lineDuration: 0.64,
  },
};

const DEFAULT_MASK_SPACE = 0.5;
const DEFAULT_HEADLINE_OFFSET = 0.04;
const SHOW_REFERENCE_BG_STORAGE_KEY = 'specto-show-reference-bg';
const TRIGGER_Y_OFFSET_STORAGE_KEY = 'specto-trigger-y-offset';
const SHOW_TRIGGER_GUIDE_STORAGE_KEY = 'specto-show-trigger-guide';
const CUSTOM_PREVIEW_TEXT_STORAGE_KEY = 'specto-custom-preview-text';
const CUSTOM_PREVIEW_TEXT_PLACEHOLDER =
  'Type something in the control panel to preview it here.';

function getCopyVariantForWidth(width: number): CopyVariant {
  if (width <= 720) {
    return COPY_VARIANTS.mobile;
  }

  if (width <= 1100) {
    return COPY_VARIANTS.tablet;
  }

  if (width <= 1512) {
    return COPY_VARIANTS.desktopCompact;
  }

  return COPY_VARIANTS.desktop;
}

// Two reveal engines depending on scale, both on the same expo-out curve:
//  - body copy (scroll-triggered paragraphs): 1300ms, 60ms fixed per-line stagger
//  - hero/title-scale text: 1600ms, stagger = 6% of duration (so it scales
//    with duration rather than being a flat ms value)
const SPECTO_BODY_DURATION = 1.3;
const SPECTO_BODY_STAGGER = 0.06;
const SPECTO_TITLE_DURATION = 1.6;
const SPECTO_TITLE_STAGGER_FRACTION = 0.06;
// Per-LINE stagger — used by every revealBy="line" (the default) instance
// on the site, including the hero headline/body block above the duplicate.
const SPECTO_TITLE_STAGGER = SPECTO_TITLE_DURATION * SPECTO_TITLE_STAGGER_FRACTION;
// Per-WORD stagger — independent from SPECTO_TITLE_STAGGER above, so line-
// mode and word-mode timing can be tuned separately. Used by the hero
// duplicate block's revealBy="word" headline + body.
const HERO_DUPLICATE_WORD_STAGGER = 0.02;

// The "Why us?" corner arrow starts sliding in before the title's own
// reveal fully settles — expo-out front-loads the motion, so the title
// already reads as "arrived" well before its full duration elapses.
const WHY_US_ARROW_DELAY = SPECTO_TITLE_DURATION * 0.3;

// Tighter than SPECTO_TITLE_STAGGER (which lines elsewhere on the site
// share) so "Why" and "us?" reveal closer together instead of one clearly
// trailing the other.
const WHY_US_WORD_STAGGER = 0.04;

function ArrowMark({
  shouldReduceMotion,
  animationConfig,
}: {
  shouldReduceMotion: boolean | null;
  animationConfig: LineAnimationConfig;
}) {
  return (
    <motion.div
      className="arrow-mark"
      aria-hidden="true"
      custom={animationConfig}
      variants={{
        hidden: ({ arrowOffset = -100 }: LineAnimationConfig) => ({
          x: shouldReduceMotion ? 0 : arrowOffset,
          opacity: 0,
        }),
        visible: ({ lineDuration, headlineOffset }: LineAnimationConfig) => ({
          x: 0,
          opacity: 1,
          transition: {
            duration: shouldReduceMotion ? 0.2 : lineDuration,
            delay: shouldReduceMotion ? 0 : headlineOffset,
            ease: shouldReduceMotion ? 'easeOut' : easeExpoOut,
          },
        }),
      }}
    >
      <svg viewBox="0 0 30 30" role="presentation">
        <path d="M4 15H25" />
        <path d="M16.5 6.5L25 15L16.5 23.5" />
      </svg>
    </motion.div>
  );
}


// The arrow itself only fades in place — the *movement* it appears to make
// comes from `.why-us-title-wrap`'s own slide (see below), which carries the
// arrow and title together. Its delay is timed to the title's reveal
// duration so it only starts once "Why us?" has finished unmasking.
function CornerArrow({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  return (
    <motion.span
      className="section-corner-arrow"
      aria-hidden="true"
      variants={{
        hidden: {
          opacity: 0,
        },
        visible: {
          opacity: 1,
          transition: {
            duration: shouldReduceMotion ? 0.2 : 0.78,
            delay: shouldReduceMotion ? 0 : WHY_US_ARROW_DELAY,
            ease: shouldReduceMotion ? 'easeOut' : easeExpoOut,
          },
        },
      }}
    >
      <svg viewBox="0 0 30 30" role="presentation">
        <path d="M7 7L23 23" />
        <path d="M14 23H23V14" />
      </svg>
    </motion.span>
  );
}

function SecondaryButton({ children }: { children?: ReactNode }) {
  return (
    <button className="secondary-button" type="button">
      <span>{children}</span>
      <span className="secondary-button-icon" aria-hidden="true">
        <svg viewBox="0 0 14 14" role="presentation">
          <path d="M3 11L11 3" />
          <path d="M5 3H11V9" />
        </svg>
      </span>
    </button>
  );
}

function TextStudyBlock({
  block,
  triggerYOffset,
  showReferenceBackground,
}: {
  block: TextStudyBlockData;
  triggerYOffset: number;
  showReferenceBackground: boolean;
}) {
  return (
    <RevealText
      className={`${block.className}${showReferenceBackground ? ' hero-reference-bg' : ''}`}
      text={block.text}
      triggerMargin={triggerYOffset}
      duration={block.scale === 'title' ? SPECTO_TITLE_DURATION : SPECTO_BODY_DURATION}
      stagger={block.scale === 'title' ? SPECTO_TITLE_STAGGER : SPECTO_BODY_STAGGER}
    />
  );
}

function WhyUsCard({
  card,
  showReferenceBackground,
  triggerYOffset,
}: {
  card: WhyUsCardData;
  showReferenceBackground: boolean;
  triggerYOffset: number;
}) {
  return (
    <div className="why-us-card">
      <div className="why-us-card-image-wrap">
        <img className="why-us-card-image" src={whyUsImage} alt="" />
      </div>

      <div
        className="why-us-card-copy"
      >
        <div
          className={`why-us-text-block why-us-card-title-block${
            showReferenceBackground ? ' hero-reference-bg' : ''
          }`}
        >
          <RevealText
            className="why-us-card-title"
            text={card.title}
            triggerMargin={triggerYOffset}
            duration={SPECTO_TITLE_DURATION}
            stagger={SPECTO_TITLE_STAGGER}
          />
        </div>

        <div
          className={`why-us-card-columns${
            card.columns.length === 1 ? ' why-us-card-columns-single' : ''
          }`}
        >
          {card.columns.map((column, columnIndex) => (
            <div
              key={`${card.title}-${columnIndex}`}
              className={`why-us-text-block why-us-card-column${
                showReferenceBackground ? ' hero-reference-bg' : ''
              }`}
            >
              {column.map((paragraph, paragraphIndex) => (
                <div
                  key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}
                  className="why-us-card-paragraph"
                >
                  <RevealText
                    className="why-us-card-body"
                    text={paragraph}
                    triggerMargin={triggerYOffset}
                    duration={SPECTO_BODY_DURATION}
                    stagger={SPECTO_BODY_STAGGER}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {card.cta ? <SecondaryButton>{card.cta}</SecondaryButton> : null}
      </div>
    </div>
  );
}

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 1440;
    }

    return window.innerWidth;
  });
  const maskSpace = DEFAULT_MASK_SPACE;
  const startDelay = DEFAULT_HEADLINE_OFFSET;
  const [showReferenceBackground, setShowReferenceBackground] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const savedValue = window.localStorage.getItem(SHOW_REFERENCE_BG_STORAGE_KEY);

    if (savedValue === null) {
      return false;
    }

    return savedValue === 'true';
  });
  const [triggerYOffset, setTriggerYOffset] = useState(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    const savedValue = window.localStorage.getItem(TRIGGER_Y_OFFSET_STORAGE_KEY);
    if (savedValue === null) {
      return 0;
    }

    const parsedValue = Number(savedValue);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
  });
  const [showTriggerGuide, setShowTriggerGuide] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const savedValue = window.localStorage.getItem(SHOW_TRIGGER_GUIDE_STORAGE_KEY);

    if (savedValue === null) {
      return false;
    }

    return savedValue === 'true';
  });
  const [customPreviewText, setCustomPreviewText] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.localStorage.getItem(CUSTOM_PREVIEW_TEXT_STORAGE_KEY) ?? '';
  });
  const [heroRef, isHeroTriggered] = useRevealTrigger(triggerYOffset);
  const [heroDuplicateRef, isHeroDuplicateTriggered] = useRevealTrigger<HTMLDivElement>(triggerYOffset);
  const [whyUsHeaderRef, isWhyUsHeaderTriggered] = useRevealTrigger<HTMLDivElement>(triggerYOffset);
  // Lets the hero headline + body copy stagger as one continuous sequence.
  const [heroHeadlineLineCount, setHeroHeadlineLineCount] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const activeCopyVariant = getCopyVariantForWidth(viewportWidth);
  const lineDelay = activeCopyVariant.lineDelay;
  const lineDuration = activeCopyVariant.lineDuration;

  const animationConfig = {
    lineDelay,
    lineDuration,
    headlineOffset: startDelay,
    lineOffset: parseFloat(activeCopyVariant.fontSize),
    arrowOffset: activeCopyVariant.arrowOffset,
  };

  useEffect(() => {
    window.localStorage.setItem(
      SHOW_REFERENCE_BG_STORAGE_KEY,
      String(showReferenceBackground),
    );
  }, [showReferenceBackground]);

  useEffect(() => {
    window.localStorage.setItem(TRIGGER_Y_OFFSET_STORAGE_KEY, String(triggerYOffset));
  }, [triggerYOffset]);

  useEffect(() => {
    window.localStorage.setItem(SHOW_TRIGGER_GUIDE_STORAGE_KEY, String(showTriggerGuide));
  }, [showTriggerGuide]);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_PREVIEW_TEXT_STORAGE_KEY, customPreviewText);
  }, [customPreviewText]);

  const triggerLinePosition = `calc(100vh + ${triggerYOffset}px)`;

  return (
    <main
      className="page-shell"
      style={{ '--mask-space': `${maskSpace}em` } as CSSVars}
    >
      {showTriggerGuide ? (
        <div
          className="trigger-guide"
          aria-hidden="true"
          style={{ top: triggerLinePosition }}
        >
          <span className="trigger-guide-label">Trigger Line</span>
        </div>
      ) : null}

      <div className="tuning-panel">
        <div className="tuning-group">
          <label className="tuning-checkbox">
            <input
              className="tuning-checkbox-input"
              type="checkbox"
              checked={showReferenceBackground}
              onChange={(event) => setShowReferenceBackground(event.target.checked)}
            />
            <span className="tuning-checkbox-label">Show Reference Background</span>
          </label>
        </div>

        <div className="tuning-group">
          <label className="tuning-checkbox">
            <input
              className="tuning-checkbox-input"
              type="checkbox"
              checked={showTriggerGuide}
              onChange={(event) => setShowTriggerGuide(event.target.checked)}
            />
            <span className="tuning-checkbox-label">Show Trigger Line</span>
          </label>
        </div>

        <div className="tuning-group">
          <label className="tuning-label" htmlFor="trigger-y-offset">
            Trigger Y Offset
          </label>
          <div className="tuning-controls">
            <input
              id="trigger-y-offset"
              className="tuning-slider"
              type="range"
              min="-400"
              max="0"
              step="1"
              value={triggerYOffset}
              onChange={(event) => setTriggerYOffset(Number(event.target.value))}
            />
            <output className="tuning-value" htmlFor="trigger-y-offset">
              {triggerYOffset}px
            </output>
          </div>
        </div>

        <div className="tuning-group">
          <label className="tuning-label" htmlFor="custom-preview-text">
            Custom Preview Text
          </label>
          <input
            id="custom-preview-text"
            className="tuning-text-input"
            type="text"
            placeholder="Paste your own text…"
            value={customPreviewText}
            onChange={(event) => setCustomPreviewText(event.target.value)}
          />
        </div>
      </div>

      <section className="intro-marker" aria-label="Scroll reference">
        <p className="intro-marker-text">Scroll down to preview the text reveal</p>
      </section>

      <section className="hero-section">
        <motion.section
          ref={heroRef}
          className={`hero${showReferenceBackground ? ' hero-reference-bg' : ''}`}
          aria-label="Specto introduction"
          initial="hidden"
          animate={isHeroTriggered ? 'visible' : 'hidden'}
          style={{
            '--hero-size': activeCopyVariant.fontSize,
            '--hero-tracking': activeCopyVariant.tracking,
            '--hero-line-height': activeCopyVariant.lineHeight,
            '--arrow-size': activeCopyVariant.arrowSize,
            '--intro-gap': activeCopyVariant.introGap,
          } as CSSVars}
        >
          <div className="hero-intro">
            <ArrowMark
              shouldReduceMotion={shouldReduceMotion}
              animationConfig={animationConfig}
            />
            <RevealText
              className="hero-headline"
              text={HERO_HEADLINE_TEXT}
              triggerMargin={triggerYOffset}
              duration={SPECTO_TITLE_DURATION}
              stagger={SPECTO_TITLE_STAGGER}
              isTriggered={isHeroTriggered}
              onCountChange={setHeroHeadlineLineCount}
            />
          </div>

          <RevealText
            className="hero-copy"
            text={HERO_BODY_TEXT}
            triggerMargin={triggerYOffset}
            duration={SPECTO_TITLE_DURATION}
            stagger={SPECTO_TITLE_STAGGER}
            isTriggered={isHeroTriggered}
            startIndex={heroHeadlineLineCount}
          />

          {/* Duplicate of the whole intro block above (arrow + headline +
              body), revealed per-word instead of per-line, with its own
              independent scroll trigger so it animates in on its own as it
              crosses the trigger line, not in lockstep with the original. */}
          <motion.div
            ref={heroDuplicateRef}
            className="hero-duplicate-block"
            initial="hidden"
            animate={isHeroDuplicateTriggered ? 'visible' : 'hidden'}
          >
            <div className="hero-intro">
              <ArrowMark
                shouldReduceMotion={shouldReduceMotion}
                animationConfig={animationConfig}
              />
              <RevealText
                className="hero-headline"
                text={HERO_HEADLINE_TEXT}
                triggerMargin={triggerYOffset}
                duration={SPECTO_TITLE_DURATION}
                stagger={HERO_DUPLICATE_WORD_STAGGER}
                isTriggered={isHeroDuplicateTriggered}
                by="word"
              />
            </div>

            <RevealText
              className="hero-copy"
              text={HERO_BODY_TEXT}
              triggerMargin={triggerYOffset}
              duration={SPECTO_TITLE_DURATION}
              stagger={HERO_DUPLICATE_WORD_STAGGER}
              isTriggered={isHeroDuplicateTriggered}
              by="word"
            />
          </motion.div>

          {/* Custom preview block, sitting below both "Specto is a
              design..." blocks above — its own independent scroll
              trigger, not chained to either one's stagger sequence. */}
          <div className="hero-custom-preview">
            <RevealText
              className="hero-copy hero-copy-custom"
              text={customPreviewText.trim() ? customPreviewText : CUSTOM_PREVIEW_TEXT_PLACEHOLDER}
              triggerMargin={triggerYOffset}
              duration={SPECTO_TITLE_DURATION}
              stagger={HERO_DUPLICATE_WORD_STAGGER}
              by="word"
            />
          </div>
        </motion.section>
      </section>

      <section className="why-us-section" aria-labelledby="why-us-title">
        <div className="why-us-shell">
          <motion.div
            ref={whyUsHeaderRef}
            className="why-us-header"
            initial="hidden"
            animate={isWhyUsHeaderTriggered ? 'visible' : 'hidden'}
          >
            <motion.div
              className="why-us-title-wrap"
              variants={{
                // Shifted left by the arrow's own reserved space (width +
                // gap), so the title sits flush with the image below while
                // it reveals, as if the arrow weren't there yet.
                hidden: {
                  x: shouldReduceMotion ? 0 : 'calc(-1 * var(--why-us-arrow-space))',
                },
                visible: {
                  x: 0,
                  transition: {
                    duration: shouldReduceMotion ? 0.2 : 0.78,
                    delay: shouldReduceMotion ? 0 : WHY_US_ARROW_DELAY,
                    ease: shouldReduceMotion ? 'easeOut' : easeExpoOut,
                  },
                },
              }}
            >
              <CornerArrow shouldReduceMotion={shouldReduceMotion} />
              <div id="why-us-title">
                <RevealText
                  className="why-us-section-title"
                  text="Why us?"
                  triggerMargin={triggerYOffset}
                  duration={SPECTO_TITLE_DURATION}
                  stagger={WHY_US_WORD_STAGGER}
                  isTriggered={isWhyUsHeaderTriggered}
                  by="word"
                />
              </div>
            </motion.div>
            <SecondaryButton>See our approach</SecondaryButton>
          </motion.div>

          <div className="why-us-grid">
            {whyUsCards.map((card) => (
              <WhyUsCard
                key={card.title}
                card={card}
                showReferenceBackground={showReferenceBackground}
                triggerYOffset={triggerYOffset}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="text-study-section" aria-label="Text study">
        <div className="text-study-shell">
          {textStudyBlocks.map((block) => (
            <TextStudyBlock
              key={block.className}
              block={block}
              triggerYOffset={triggerYOffset}
              showReferenceBackground={showReferenceBackground}
            />
          ))}
        </div>
      </section>

      <section className="specto-reveal-section" aria-label="Specto reveal study">
        <div className="specto-reveal-content">
          <p className="specto-reveal-label">Specto reveal engine</p>

          <div className="specto-reveal-wide">
            <RevealText
              triggerMargin={triggerYOffset}
              className="specto-paragraph-xl"
              text="Sint commodo magna officia sit ea excepteur sint enim incididunt."
              duration={SPECTO_TITLE_DURATION}
              stagger={SPECTO_TITLE_STAGGER}
            />
            <RevealText
              triggerMargin={triggerYOffset}
              className="specto-paragraph-lg"
              text="Sint commodo magna officia sit ea excepteur sint enim. Incididunt anim consectetur nulla sint esse eu consectetur. Nisi enim est consequat eiusmod laboris laborum exercitation pariatur enim sunt eiusmod nostrud incididunt nostrud nisi."
              duration={SPECTO_TITLE_DURATION}
              stagger={SPECTO_TITLE_STAGGER}
            />
          </div>

          <div className="specto-reveal-shell">
            <RevealText
              triggerMargin={triggerYOffset}
              className="specto-paragraph-body"
              text="Each line here masks and slides up from 113% down to a slight -7% overshoot before settling — eased with a pure exponential curve, staggered 60ms apart, and triggered only once it scrolls into view. Every line is detected from the browser's actual word-wrap, so it re-splits correctly at any breakpoint instead of relying on hand-authored line breaks."
            />
          </div>
        </div>
      </section>

      <div className="scroll-spacer scroll-spacer-bottom" aria-hidden="true" />
    </main>
  );
}
