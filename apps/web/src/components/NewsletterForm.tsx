'use client';

/**
 * Newsletter signup (footer). Presentational for now — captures the email and
 * shows a thank-you; wire to a real subscribe endpoint / provider later.
 */
import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().length === 0) return;
    // TODO: POST to a subscribe endpoint when available.
    setDone(true);
  }

  if (done) {
    return (
      <p className="text-sm text-ink-soft">
        Thanks for subscribing — keep an eye on your inbox for new arrivals and offers.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        placeholder="Your email address"
        aria-label="Email address"
        className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-faint focus:border-purple focus:outline-none"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-full bg-purple px-6 text-sm font-medium text-white transition-colors hover:bg-purple-dark"
      >
        Subscribe
      </button>
    </form>
  );
}
