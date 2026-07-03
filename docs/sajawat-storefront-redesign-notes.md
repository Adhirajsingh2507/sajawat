# Sajawat Storefront Redesign — Resume Notes

> Working notes for the client-showcase UI/UX upgrade. Pick this up next session.
> Status: **planning saved, implementation pending** (paused to conserve tokens).

## Goal (as agreed with client)

Client likes the **look, feel, and page/interaction patterns of premium jewellery
e-commerce sites** — reference given: `https://www.illuminatejewellery.in/`.

**Important boundary:** we are NOT cloning that site 1:1 (their exact layout,
imagery, and copy are their IP). We are building an **original storefront in the
same genre** — the same _kinds_ of sections and behaviours, executed in Sajawat's
own brand (Royal Purple `#4b206b` + Luxury Gold `#c9a227`, Playfair + Inter) with
our own imagery and copy. Match the _class and feel_, not the literal design.

## What already exists (done this session, merged to develop + main)

- Demo catalog seed (`services/api/src/scripts/seed-demo.ts`): 5 categories,
  3 collections, 24 products + inventory, demo login `demo@sajawat.example`.
- Editorial homepage v1: image hero, trust bar, category tiles, featured,
  collections, best sellers, craft story, wholesale band.
- PDP v1: thumbnail rail, sticky buy box, discount badge, trust row.
- Header mobile menu; footer with real links.
- Demo imagery under `apps/web/public/demo/` (DEMO-ONLY stock — swap for real).

## Reference-genre patterns to add / upgrade next (original implementations)

These are common conventions across premium jewellery storefronts. Build our own
version of each — do not copy the reference's specific markup/styles/assets.

### Homepage
- [x] Full-width **auto-advancing hero carousel** — `components/HeroCarousel.tsx`.
- [x] **Announcement / offer bar** above header — `components/AnnouncementBar.tsx`.
- [x] **Category tiles** row (image tiles). Optional: rounded "circle" variant later.
- [ ] **"Shop by price / occasion"** entry points (Under ₹999, Bridal, Gifting).
- [x] **New arrivals** carousel + **Best sellers** carousel — `components/ProductCarousel.tsx`.
- [ ] **Featured collection banner(s)** — large lifestyle image + CTA.
- [x] **Testimonials / reviews** strip — `components/Testimonials.tsx` (static demo).
- [ ] **Instagram / lookbook** gallery grid.
- [x] **USP / trust row** (have text version; make it icon-based next).
- [ ] Richer **footer**: newsletter signup, policy links, contact, social.

### Product listing (PLP)
- [ ] **Sidebar / drawer filters** (category, price range, in-stock, best-seller).
- [ ] Sort dropdown (have basic), **grid density toggle**, result count.
- [ ] **Quick-view** modal + hover second-image swap on cards.

### Product detail (PDP)
- [x] Gallery zoom-on-hover — `components/ZoomImage.tsx` (magnifies toward cursor;
      reduced-motion safe). Lightbox still optional/later.
- [ ] **Delivery/returns accordion**, **offers** box, share buttons.
- [x] **Related / "You may also like"** carousel (same-category).
- [ ] Quantity + sticky mobile add-to-cart bar.

### Global / interaction
- [x] **Slide-in cart drawer** — `features/commerce/CartDrawer.tsx` (opens on
      add-to-cart + header bag; `isCartOpen/openCart/closeCart` on CartContext).
- [x] **Mega-menu** category dropdown on desktop header — `components/MegaMenu.tsx`.
- [x] Search with **suggestions/typeahead** — `components/SearchBox.tsx`.
- [x] **Quick-view** modal — `features/quickview/*` (also listed under PLP).
- [~] Subtle motion polish — `fade-in` util added; more on scroll/hover next.
- [x] Wishlist drawer — `features/commerce/WishlistDrawer.tsx` (mirrors CartDrawer;
      header heart opens it; "Move to bag" hands off to the cart drawer).

## Uncommitted work in tree (bank before token reset)

Session 2 additions (NOT yet committed): AnnouncementBar, HeroCarousel,
ProductCarousel, CartDrawer + CartContext drawer state, homepage new-arrivals +
best-seller carousels, PDP related carousel, header bag opens drawer, `fade-in`
CSS util. All typecheck + lint clean; verified via Playwright screenshots.
Next: commit on `feat/storefront-genre-redesign` → PR to develop.

## Approach when resuming

1. (Optional) Review the reference at a high level for **section order & feature
   list only** — capture the _pattern_, then design original components.
2. Build shared UI pieces first (carousel, drawer, accordion, filter panel) in
   `packages/ui` where reusable.
3. Wire to existing public catalog API (no backend model changes needed).
4. Keep everything on Sajawat brand tokens + our `/demo` imagery.
5. Verify with Playwright login-as-demo screenshots (desktop + mobile).
6. Branch `feat/storefront-genre-redesign` → PR to `develop`.

## Housekeeping carried over

- `gh` installed at `~/.local/bin`, authenticated as `Adhirajsingh2507`.
- Dev stack run: `docker start sajawat-mongo`; API `pnpm --filter @sajawat/api dev`;
  web `pnpm --filter @sajawat/web dev`; seed `pnpm --filter @sajawat/api seed:demo`.
- CI "Security scan" fails repo-wide (Dependency Review needs GitHub Advanced
  Security enabled) — unrelated to our diffs; fix separately.
- Real product photography still needed to replace `/demo` stock before go-live.
