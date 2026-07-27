import { Container, Eyebrow, Heading, Section } from '@sajawat/ui';

/**
 * Customer testimonials strip — static social proof for the storefront (demo
 * content; settings/CMS-driven later). Three short reviews with a star rating.
 */
interface Testimonial {
  quote: string;
  name: string;
  meta: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'The bridal set looked far more expensive than it was. Everyone at the wedding asked where it was from.',
    name: 'Ananya R.',
    meta: 'Verified buyer · Bridal Sets',
  },
  {
    quote:
      'My everyday gold hoops have not left my ears in weeks. Lightweight, and the finish has not faded at all.',
    name: 'Priya M.',
    meta: 'Verified buyer · Earrings',
  },
  {
    quote:
      'Fast delivery, beautiful packaging, and the pieces feel genuinely premium. Already placed a second order.',
    name: 'Sneha K.',
    meta: 'Verified buyer · Necklaces',
  },
];

export function Testimonials() {
  return (
    <Section className="bg-gold-soft/40">
      <Container>
        <div className="text-center">
          <Eyebrow>Loved by customers</Eyebrow>
          <Heading level={2}>What our customers say</Heading>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-2xl border border-line bg-white p-6"
            >
              <Stars />
              <blockquote className="mt-4 flex-1 text-ink-soft">“{t.quote}”</blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-semibold text-ink">{t.name}</p>
                <p className="mt-0.5 text-xs text-ink-faint">{t.meta}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="Rated 5 out of 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-gold"
          aria-hidden="true"
        >
          <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.3l6.5-.9L12 2.5z" />
        </svg>
      ))}
    </div>
  );
}
