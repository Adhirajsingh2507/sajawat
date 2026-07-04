import Image from 'next/image';
import { Container, Eyebrow, Heading, Section } from '@sajawat/ui';

/**
 * Lookbook / social gallery — a grid of styled jewellery imagery for the
 * homepage (demo images; connect to a real feed/CMS later).
 */
const SHOTS = [
  'necklace-01.jpg',
  'earring-01.jpg',
  'ring-03.jpg',
  'bangle-02.jpg',
  'bridal-02.jpg',
  'necklace-04.jpg',
];

export function Lookbook() {
  return (
    <Section>
      <Container>
        <div className="text-center">
          <Eyebrow>@sajawat.jewellery</Eyebrow>
          <Heading level={2}>From the lookbook</Heading>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
            Tag us to be featured — see how our pieces are styled for every occasion.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          {SHOTS.map((file) => (
            <div
              key={file}
              className="group relative aspect-square overflow-hidden rounded-lg bg-mist"
            >
              <Image
                src={`/demo/products/${file}`}
                alt=""
                fill
                sizes="(min-width: 1024px) 16vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/30"
              >
                <InstagramIcon />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
