# SAJAWAT UI/UX SPECIFICATION

## PURPOSE

This document defines the user experience, page layouts, navigation, customer journeys, and interaction patterns for the Sajawat platform.

All UI implementation must follow this document.

Reference:

Illuminate Jewellery

Goal:

Follow the structure and customer journey philosophy while maintaining Sajawat's unique Royal Purple and Luxury Gold identity.

---

# DESIGN GOALS

Every page should optimize for:

1. Trust
2. Product Discovery
3. Conversion
4. Mobile Experience
5. Luxury Feel

---

# GLOBAL NAVIGATION

Header Sections:

Logo

Search

Collections

Categories

New Arrivals

Best Sellers

Blog

Contact

Wishlist

Cart

Account

Sticky Header:

Yes

---

# HOMEPAGE

## Section 1

Offer Banner

Purpose:

Promotions

Configurable by admin

---

## Section 2

Hero Banner / Hero Video

Admin Selectable

Options:

Image Slider

Video Hero

Primary CTA:

Shop Now

Secondary CTA:

View Collections

---

## Section 3

Shop By Category

Grid Layout

Category Cards

Examples:

Necklaces

Earrings

Bracelets

Sets

---

## Section 4

Featured Collections

Visual Collection Cards

Examples:

Wedding Collection

Festive Collection

Best Sellers

---

## Section 5

Best Sellers

Product Grid

Quick Add To Cart

Wishlist Button

---

## Section 6

New Arrivals

Product Grid

---

## Section 7

Brand Story

Luxury Presentation

Minimal Text

Strong Imagery

---

## Section 8

Customer Reviews

Images

Ratings

Testimonials

---

## Section 9

Blog Highlights

Latest Articles

---

## Section 10

B2B Wholesale Section

Wholesale CTA

Inquiry Form CTA

Contact CTA

---

## Section 11

Footer

Location

WhatsApp

Instagram

Facebook

YouTube

Email

Policies

---

# COLLECTION PAGE

Purpose:

Explore collection products.

Layout:

Collection Banner

Collection Description

Product Grid

Filters

Sorting

Pagination

---

# CATEGORY PAGE

Purpose:

Explore category products.

Layout:

Category Banner

Filters

Product Grid

Pagination

---

# PRODUCT LISTING PAGE

Features:

Search

Filters

Sorting

Pagination

Quick View

Wishlist

Product Card

Product Image

Product Name

Price

Badges

---

# PRODUCT DETAIL PAGE

Most Important Sales Page.

Sections:

Product Gallery

Product Video

Product Information

Price

Offers

Add To Cart

Buy Now

Wishlist

Description

Reviews

Related Products

Recently Viewed Products

---

# PRODUCT GALLERY

Supports:

9 Images

1 Video

Features:

Zoom

Thumbnail Navigation

Swipe Support

---

# PRODUCT INFORMATION

Display:

Product Name

Price

Offer Price

Availability

Estimated Delivery

---

# CART PAGE

Display:

Products

Quantities

Price Summary

Coupon Section

Proceed To Checkout

---

# CHECKOUT PAGE

Steps:

Address

Payment

Review

Confirmation

Requirements:

Minimal Friction

Mobile Friendly

Fast Completion

---

# ORDER SUCCESS PAGE

Display:

Order Number

Summary

Tracking Information

Continue Shopping CTA

---

# CUSTOMER DASHBOARD

Sections:

Profile

Orders

Wishlist

Reviews

Logout

---

# ORDER HISTORY

Display:

Order List

Status

Tracking

Return Request

---

# WISHLIST

Private Only

Actions:

Move To Cart

Remove

Buy Now

---

# BLOG LISTING PAGE

Features:

Categories

Tags

Search

Featured Articles

---

# BLOG DETAIL PAGE

Display:

Hero Image

Content

Related Articles

Social Sharing

---

# CONTACT PAGE

Sections:

Contact Form

Business Information

Location

Social Media Links

---

# B2B PAGE

Purpose:

Lead Generation

Sections:

Wholesale Benefits

Business Information

Inquiry Form

Contact Information

---

# B2B INQUIRY FORM

Fields:

Name

Company Name

GST Number

Phone

Email

City

Expected Quantity

Product Interest

Message

---

# REVIEW EXPERIENCE

Customer Can:

Rate Product

Write Review

Upload Images

Admin Approval Required

---

# OUT OF STOCK EXPERIENCE

Display:

Out Of Stock

Notify Me Button

Notification Request Form

---

# SEARCH EXPERIENCE

Version 1:

Product Name Search

Results:

Instant Suggestions

Product Results

Category Results

---

# MOBILE EXPERIENCE

Priority:

Highest

Requirements:

Responsive Layout

Fast Navigation

Touch Friendly Controls

Optimized Images

Sticky Bottom Actions

---

# ACCESSIBILITY

Requirements:

Keyboard Navigation

Screen Reader Support

Color Contrast Compliance

Accessible Forms

---

# UX RULE

Every page should answer:

1. What am I looking at?
2. Why should I trust it?
3. What should I do next?

If the answer is unclear, redesign the page.

---

# ADDENDUM — Storefront experience (2026-07-04, `apps/web`)

Client-showcase redesign (develop, PRs #3–#10). Original, brand-native components
in the premium-jewellery genre — matching the reference's structure/philosophy,
not its literal design. All live on the existing public catalog + cart/wishlist
APIs. Site width capped at 1600px, still centered.

## Homepage flow (top → bottom)
Announcement bar (rotating) → **auto-advancing hero carousel** (dots + prev/next,
pause on hover) → **icon trust row** → **shop-by-category** (5 image tiles,
full-width) → **featured** grid (4 cards, full-width) → collections strip →
**featured-collection banner** (image + CTA) → **best-sellers carousel** →
**new-arrivals carousel** → craftsmanship story → **testimonials** → **lookbook /
social grid** → wholesale CTA band → **newsletter** signup → footer.

## Global interactions
- **Mega-menu:** desktop "Shop" dropdown — category tiles + collections column.
- **Typeahead search:** debounced product suggestions (header + mobile menu).
- **Cart drawer:** slide-in on add-to-cart and the header bag; coupon apply/remove.
- **Wishlist drawer:** slide-in from the header heart; "Move to bag" hands off to
  the cart drawer.
- **Quick view:** modal from any product card; closes when the cart drawer opens.
- **Mobile menu:** hamburger nav with search + account links.
- Motion: `fade-in` utility with a `prefers-reduced-motion` guard; tasteful only.

## PLP (product listing)
Price-range chip filters + "In stock only" toggle + sort + empty state; grid is
3-up (larger cards). Filters flow through a shared fetcher (all-products,
category, collection).

## PDP (product detail)
Thumbnail rail incl. an optional **video slot** (play badge → inline `<video>`);
**hover-to-zoom** main image; sticky buy box; **"Available offers"** box
(auto-applied promo + coupon codes per `GET /offers`); trust row; details; **"You
may also like"** same-category carousel.

## Still pending client assets
Real product **videos** (feature built; needs clips to seed) and any exact
sizing/copy tweaks from the client's screenshot spec. See
`sajawat-storefront-redesign-notes.md` for the working backlog.

---

# ADDENDUM — Homepage redesign v2 (2026-07-07, `apps/web`)

Luxury homepage redesign to a client 7-image reference set (original brand-native
components — match the feel, not the assets), shipped as six small PRs (#22–#27).
Homepage flow (top → bottom): **offer marquee bar** → **two-tier luxury navbar**
(centered stacked logo + centered collection nav) → **fullscreen sliding hero**
(CTAs, dots/arrows) → **"Sale is live" band** → trust row → shop-by-category →
**tabbed featured grid** (Featured / New In, hover image-swap, red SAVE% badge) →
**"Jewellery that speaks for you" bento** (slow zoom + hover lift) → collections →
**"Shop the look" reel gallery** (autoplays `product.video`, else poster + play
badge) → **full-width cinematic banner** (background video / Ken-Burns + parallax)
→ story → testimonials → lookbook → wholesale → footer. Motion: CSS +
IntersectionObserver, then **Framer Motion** (reveals, parallax) in the polish PR;
all reduced-motion-safe. Full component map in `sajawat-current-architecture.md`
§26. **Video sections are asset-ready** (D-SF1) — they light up on real footage.
