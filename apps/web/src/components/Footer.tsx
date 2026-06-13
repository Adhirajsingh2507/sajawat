/** Storefront footer (trust + contact). Static for 1.4a; CMS-driven later. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <span className="font-serif text-lg font-semibold text-purple">Sajawat</span>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">
              Premium imitation jewellery for celebrations, gifting, and everyday elegance.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
              Company
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>About</li>
              <li>Contact</li>
              <li>Wholesale enquiries</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
              Connect
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>Instagram</li>
              <li>Facebook</li>
              <li>WhatsApp</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-ink-faint">
          © {new Date().getFullYear()} Sajawat Jewellery. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
