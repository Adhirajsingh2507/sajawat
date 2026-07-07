/**
 * Full-width cinematic banner (homepage PR-5, reference image 7 — the full-bleed
 * video before the footer). Plays a background video when `videoSrc` is provided
 * (muted, looped, autoplay); until real footage exists (D-SF1) it falls back to
 * the poster image with a slow Ken-Burns drift, so the section already reads as
 * cinematic and swapping in a video is a one-prop change.
 */
import Link from 'next/link';

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
  return (
    <section className="relative isolate h-[70vh] min-h-[440px] overflow-hidden bg-purple-dark">
      <div className="absolute inset-0">
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
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        <Link
          href={ctaHref}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gold px-9 text-sm font-medium text-ink transition-colors hover:bg-gold-dark"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
