/**
 * Top offer bar — an animated marquee of current promotions (shipping, festival
 * offers, coupons, new arrivals). Static messages for now (settings/CMS-driven
 * later). Pure presentation via the shared <Marquee>; reduced-motion safe.
 */
import { Marquee } from '@/components/Marquee';

const OFFERS = [
  'Free shipping on orders over ₹1,499',
  'Festive Edit — up to 30% off',
  'First order? Use code WELCOME300',
  'New arrivals just dropped',
  'Worldwide shipping available',
];

export function AnnouncementBar() {
  return <Marquee items={OFFERS} variant="dark" ariaLabel="Current offers" />;
}
