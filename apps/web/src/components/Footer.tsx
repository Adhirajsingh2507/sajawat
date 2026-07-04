import Link from 'next/link';
import { NewsletterForm } from '@/components/NewsletterForm';

/** Storefront footer (newsletter + navigation). Static for now; CMS-driven later. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      {/* Newsletter band */}
      <div className="border-b border-line bg-mist">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">Join the Sajawat list</h2>
            <p className="mt-1 text-sm text-ink-soft">
              First access to new arrivals, festive offers, and styling tips.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-serif text-lg font-semibold text-purple">Sajawat</span>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">
              Premium imitation jewellery for celebrations, gifting, and everyday elegance.
            </p>
          </div>

          <FooterColumn title="Shop">
            <FooterLink href="/products">Shop all</FooterLink>
            <FooterLink href="/products">Best sellers</FooterLink>
            <FooterLink href="/categories/bridal-sets">Bridal sets</FooterLink>
            <FooterLink href="/wholesale">Wholesale enquiries</FooterLink>
          </FooterColumn>

          <FooterColumn title="Account">
            <FooterLink href="/account">My account</FooterLink>
            <FooterLink href="/account/orders">My orders</FooterLink>
            <FooterLink href="/wishlist">Wishlist</FooterLink>
            <FooterLink href="/cart">Cart</FooterLink>
          </FooterColumn>

          <FooterColumn title="Connect">
            <li className="text-ink-soft">Instagram</li>
            <li className="text-ink-soft">Facebook</li>
            <li className="text-ink-soft">WhatsApp</li>
          </FooterColumn>
        </div>
        <p className="mt-10 text-xs text-ink-faint">
          © {new Date().getFullYear()} Sajawat Jewellery. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-ink-soft">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-purple">
        {children}
      </Link>
    </li>
  );
}
