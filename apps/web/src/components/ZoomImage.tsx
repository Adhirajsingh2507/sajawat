'use client';

/**
 * Hover-to-zoom product image (desktop). The image magnifies toward the cursor
 * via a CSS transform whose origin tracks the pointer. On touch/no-hover it stays
 * a plain image. `children` renders overlays (e.g. a discount badge) above it.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';

export function ZoomImage({
  src,
  alt,
  className,
  sizes,
  priority,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  const [origin, setOrigin] = useState('50% 50%');

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${String(x)}% ${String(y)}%`);
  }

  return (
    <div
      onMouseMove={onMove}
      className={`group relative cursor-zoom-in overflow-hidden ${className ?? ''}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '100vw'}
        priority={priority ?? false}
        style={{ transformOrigin: origin }}
        className="object-cover transition-transform duration-200 ease-out group-hover:scale-[2] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      {children}
      {/* Hint (hidden while zooming) */}
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink-soft opacity-100 transition-opacity duration-200 group-hover:opacity-0">
        Hover to zoom
      </span>
    </div>
  );
}
