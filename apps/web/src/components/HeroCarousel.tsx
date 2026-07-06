'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container, Eyebrow, Heading } from '@sajawat/ui';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

const SLIDES: Slide[] = [
  {
    image: '/demo/hero/hero-bridal.jpg',
    eyebrow: 'The Bridal Edit',
    title: 'Jewellery made for every celebration',
    subtitle:
      'Necklaces, earrings, and bridal sets crafted to feel precious — without the precious-metal price.',
    ctaHref: '/products',
    ctaLabel: 'Shop the collection',
    secondaryHref: '#categories',
    secondaryLabel: 'Shop by category',
  },
  {
    image: '/demo/hero/hero-layered.jpg',
    eyebrow: 'Everyday Gold',
    title: 'Effortless pieces for every day',
    subtitle: 'Lightweight gold-tone chains, hoops, and rings you can wear from desk to dinner.',
    ctaHref: '/categories/necklaces',
    ctaLabel: 'Shop everyday gold',
  },
  {
    image: '/demo/products/bridal-02.jpg',
    eyebrow: 'Statement Pieces',
    title: 'Be the reason they look twice',
    subtitle: 'Bold stones and sculptural silhouettes that lead the look.',
    ctaHref: '/collections/statement',
    ctaLabel: 'Explore statement',
  },
];

const AUTOPLAY_MS = 6000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    // Pause auto-advance on hover/focus and under prefers-reduced-motion
    // (WCAG 2.2.2). Manual prev/next controls stay available.
    if (paused || reducedMotion) return;
    const id = setInterval(() => {
      setIndex((v) => (v + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      clearInterval(id);
    };
  }, [paused, reducedMotion]);

  const active = SLIDES[index] ?? SLIDES[0];
  if (active === undefined) return null;

  return (
    <section
      className="relative isolate overflow-hidden bg-purple"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      onFocusCapture={() => {
        setPaused(true);
      }}
      onBlurCapture={() => {
        setPaused(false);
      }}
    >
      {/* Slides (crossfade) */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover object-center opacity-60"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-purple-dark via-purple-dark/60 to-purple/30"
          />
        </div>
      ))}

      {/* Copy for the active slide */}
      <Container className="relative flex min-h-[86vh] flex-col justify-end pb-20 pt-28 sm:min-h-[92vh]">
        <div key={index} className="animate-fade-in max-w-2xl">
          <Eyebrow className="text-gold">{active.eyebrow}</Eyebrow>
          <Heading level={1} className="text-white">
            {active.title}
          </Heading>
          <p className="mt-5 max-w-xl text-lg text-white/85">{active.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={active.ctaHref}
              className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-ink transition-colors hover:bg-gold-dark"
            >
              {active.ctaLabel}
            </Link>
            {active.secondaryHref !== undefined && active.secondaryLabel !== undefined && (
              <Link
                href={active.secondaryHref}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/70 px-8 text-sm font-medium text-white transition-colors hover:bg-white hover:text-purple"
              >
                {active.secondaryLabel}
              </Link>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-10 flex items-center gap-3">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.image}
              type="button"
              aria-label={`Go to slide ${String(i + 1)}`}
              aria-current={i === index}
              onClick={() => {
                go(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-8 bg-gold' : 'w-4 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </Container>

      {/* Prev / next */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => {
          go(index - 1);
        }}
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/40 p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:block"
      >
        <ChevronIcon dir="left" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => {
          go(index + 1);
        }}
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/40 p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:block"
      >
        <ChevronIcon dir="right" />
      </button>
    </section>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
