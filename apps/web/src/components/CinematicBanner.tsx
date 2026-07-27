'use client';

/**
 * Full-width cinematic banner (reference image 7 — the full-bleed video before
 * the footer). Plays a background video when `videoSrc` is provided; until real
 * footage exists (D-SF1) it falls back to the poster with a slow Ken-Burns
 * drift. PR-6 adds a subtle **scroll parallax** on the backdrop (Framer Motion),
 * disabled under reduced-motion.
 */
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export function CinematicBanner({
  videoSrc,
  poster = '/demo/hero/hero-bridal.jpg',
  eyebrow = 'The Sajawat World',
  title = 'Crafted to be remembered',
  ctaHref = '/products',
  ctaLabel = 'Discover the collection',
}: {
  videoSrc?: string;
  poster?: string;
  eyebrow?: string;
  title?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  return (
    <section
      ref={ref}
      className="relative isolate h-[70vh] min-h-[440px] overflow-hidden bg-purple-dark"
    >
      <motion.div
        {...(reduced === true ? {} : { style: { y } })}
        className="absolute inset-x-0 -inset-y-[10%]"
      >
        {videoSrc !== undefined ? (
          <video
            src={videoSrc}
            poster={poster}
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- decorative full-bleed backdrop, animated via CSS
          <img
            src={poster}
            alt=""
            aria-hidden
            className="animate-ken-burns h-full w-full object-cover"
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-black/45" />
      </motion.div>

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        <Link
          href={ctaHref}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gold px-9 text-sm font-medium text-ink transition-transform hover:scale-[1.03] hover:bg-gold-dark active:scale-95"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
