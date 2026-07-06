'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@sajawat/ui';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}

const SLIDES: Slide[] = [
  {
    image: '/demo/hero/hero-bridal.jpg',
    eyebrow: 'The Bridal Edit',
    title: 'Royal Heirlooms',
    subtitle:
      'Bridal sets and statement necklaces crafted to feel precious — for every celebration.',
    ctaHref: '/products',
    ctaLabel: 'Shop the collection',
    secondaryHref: '/wholesale',
    secondaryLabel: 'For businesses',
  },
  {
    image: '/demo/hero/hero-layered.jpg',
    eyebrow: 'Everyday Gold',
    title: 'Effortless Luxe',
    subtitle: 'Lightweight gold-tone chains, hoops, and rings you can wear from desk to dinner.',
    ctaHref: '/products',
    ctaLabel: 'Shop everyday gold',
    secondaryHref: '/products',
    secondaryLabel: 'View all',
  },
  {
    image: '/demo/products/bridal-02.jpg',
    eyebrow: 'Statement Pieces',
    title: 'Bold & Timeless',
    subtitle: 'Sculptural silhouettes and bold stones that lead the look.',
    ctaHref: '/products',
    ctaLabel: 'Explore statement',
    secondaryHref: '/products',
    secondaryLabel: 'New arrivals',
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

  return (
    <section
      className="relative isolate h-[86vh] min-h-[560px] overflow-hidden bg-purple-dark"
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
      {/* Sliding track — all slides side by side, translated to the active one. */}
      <div
        className={`flex h-full ${reducedMotion ? '' : 'transition-transform duration-700 ease-out'}`}
        style={{ transform: `translateX(-${String(index * 100)}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.image}
            className="relative h-full w-full shrink-0"
            aria-hidden={i !== index}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Soft scrim: darker at the bottom-left so the serif copy stays legible. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent"
            />
            <Container className="relative flex h-full flex-col justify-end pb-24 pt-28">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.35em] text-gold">{slide.eyebrow}</p>
                <h1 className="mt-4 font-serif text-5xl font-medium leading-[1.05] text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
                  {slide.title}
                </h1>
                <p className="mt-5 max-w-xl text-base text-white/90 sm:text-lg">{slide.subtitle}</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    href={slide.ctaHref}
                    tabIndex={i === index ? undefined : -1}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-ink transition-colors hover:bg-gold-dark"
                  >
                    {slide.ctaLabel}
                  </Link>
                  <Link
                    href={slide.secondaryHref}
                    tabIndex={i === index ? undefined : -1}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/70 px-8 text-sm font-medium text-white transition-colors hover:bg-white hover:text-purple"
                  >
                    {slide.secondaryLabel}
                  </Link>
                </div>
              </div>
            </Container>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-7 z-10 flex items-center justify-center gap-3">
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

      {/* Prev / next */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => {
          go(index - 1);
        }}
        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/40 p-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:block"
      >
        <ChevronIcon dir="left" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => {
          go(index + 1);
        }}
        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/40 p-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:block"
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
