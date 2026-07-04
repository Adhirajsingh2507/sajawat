/**
 * Demo catalog seed (showcase support).
 *
 * Populates a realistic, presentable storefront for client demos: categories,
 * collections, ~24 active products with verified jewellery imagery (served from
 * apps/web/public/demo), matching in-stock inventory, and a demo B2C customer to
 * log in with (the storefront stays login-gated).
 *
 * Idempotent: keyed upserts by slug / sku / productId / email, so it is safe to
 * run repeatedly. Images are DEMO-ONLY placeholders under /demo/products — swap
 * the `img()` paths for real product photography before go-live.
 *
 * Run (operator):
 *   pnpm --filter @sajawat/api exec tsx src/scripts/seed-demo.ts
 * Optional overrides: SEED_DEMO_EMAIL, SEED_DEMO_PASSWORD.
 */
import { ROLES } from '@sajawat/shared';
import { connectToDatabase, disconnectFromDatabase } from '../db/index.js';
import { logger } from '../config/logger.js';
import { hashPassword } from '../auth/password.js';
import { Category } from '../modules/category/category.model.js';
import { Collection } from '../modules/collection/collection.model.js';
import { Product } from '../modules/product/product.model.js';
import { Inventory } from '../modules/inventory/inventory.model.js';
import { Promotion } from '../modules/promotion/promotion.model.js';
import { User } from '../modules/user/user.model.js';

const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL?.trim() ?? 'demo@sajawat.example';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'ShowcaseDemo#2026';

const img = (file: string): string => `/demo/products/${file}`;

interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
}

interface CollectionSeed {
  slug: string;
  name: string;
  description: string;
  bannerImage: string;
}

interface ProductSeed {
  slug: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  category: string;
  collections: string[];
  images: string[];
  shortDescription: string;
  description: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'necklaces',
    name: 'Necklaces',
    description: 'Layered chains, pendants, and statement necklaces for every occasion.',
    image: img('necklace-01.jpg'),
    sortOrder: 1,
  },
  {
    slug: 'earrings',
    name: 'Earrings',
    description: 'Hoops, drops, and chandbalis finished to catch the light.',
    image: img('earring-02.jpg'),
    sortOrder: 2,
  },
  {
    slug: 'rings',
    name: 'Rings',
    description: 'Solitaires and cocktail rings set with brilliant stones.',
    image: img('ring-02.jpg'),
    sortOrder: 3,
  },
  {
    slug: 'bangles',
    name: 'Bangles & Bracelets',
    description: 'Pavé bangles, kadas, and delicate chain bracelets.',
    image: img('bangle-02.jpg'),
    sortOrder: 4,
  },
  {
    slug: 'bridal-sets',
    name: 'Bridal Sets',
    description: 'Complete necklace-and-earring sets crafted for the big day.',
    image: img('bridal-02.jpg'),
    sortOrder: 5,
  },
];

const COLLECTIONS: CollectionSeed[] = [
  {
    slug: 'bridal-edit',
    name: 'The Bridal Edit',
    description: 'Heirloom-inspired sets and statement pieces for wedding season.',
    bannerImage: img('bridal-02.jpg'),
    // (banner image reused from bridal set)
  },
  {
    slug: 'everyday-gold',
    name: 'Everyday Gold',
    description: 'Lightweight gold-tone pieces you can wear from desk to dinner.',
    bannerImage: img('necklace-01.jpg'),
  },
  {
    slug: 'statement',
    name: 'Statement Pieces',
    description: 'Bold stones and sculptural silhouettes that lead the look.',
    bannerImage: img('ring-01.jpg'),
  },
];

const PRODUCTS: ProductSeed[] = [
  // ---- Necklaces ----
  {
    slug: 'noor-layered-gold-necklace',
    name: 'Noor Layered Gold Necklace',
    sku: 'NCK-NOOR-001',
    price: 2499,
    salePrice: 1899,
    category: 'necklaces',
    collections: ['everyday-gold'],
    images: ['necklace-01.jpg', 'necklace-03.jpg'],
    shortDescription: 'A double-layered gold-tone chain that dresses up any neckline.',
    description:
      'Two delicate chains layered into one effortless piece. Finished in a warm gold tone with a secure lobster clasp and an adjustable extender for the perfect drop.',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    slug: 'neelam-sapphire-pendant-necklace',
    name: 'Neelam Sapphire Pendant Necklace',
    sku: 'NCK-NEEL-002',
    price: 1799,
    category: 'necklaces',
    collections: ['everyday-gold', 'statement'],
    images: ['necklace-02.jpg', 'necklace-04.jpg'],
    shortDescription: 'A sapphire-blue solitaire pendant on a fine gold chain.',
    description:
      'A faceted sapphire-blue stone set in a gold-tone bezel, suspended from a fine cable chain. Understated sparkle for everyday elegance.',
    isFeatured: true,
  },
  {
    slug: 'riya-coin-pendant-necklace',
    name: 'Riya Coin Pendant Necklace',
    sku: 'NCK-RIYA-003',
    price: 1299,
    category: 'necklaces',
    collections: ['everyday-gold'],
    images: ['necklace-03.jpg', 'necklace-01.jpg'],
    shortDescription: 'A dainty engraved coin pendant for layering.',
    description:
      'A petite engraved coin on a whisper-thin chain — designed to layer with your favourites or stand alone as a quiet everyday staple.',
    isBestSeller: true,
  },
  {
    slug: 'gulmohar-leaf-pendant-necklace',
    name: 'Gulmohar Leaf Pendant Necklace',
    sku: 'NCK-GULM-004',
    price: 1599,
    category: 'necklaces',
    collections: ['statement'],
    images: ['necklace-04.jpg', 'necklace-02.jpg'],
    shortDescription: 'A sculptural leaf pendant with pavé detailing.',
    description:
      'Inspired by the gulmohar in bloom, this sculptural leaf pendant is scattered with tiny crystals that shimmer as you move.',
  },
  {
    slug: 'aisha-pearl-strand-necklace',
    name: 'Aisha Pearl Strand Necklace',
    sku: 'NCK-AISH-005',
    price: 2199,
    salePrice: 1799,
    category: 'necklaces',
    collections: ['bridal-edit'],
    images: ['bridal-01.jpg', 'necklace-01.jpg'],
    shortDescription: 'A graduated faux-pearl strand with a crystal clasp.',
    description:
      'Lustrous graduated faux pearls finished with a sparkling crystal clasp. A timeless piece that bridges everyday polish and occasion glamour.',
  },

  // ---- Earrings ----
  {
    slug: 'meenakshi-blue-drop-earrings',
    name: 'Meenakshi Blue Drop Earrings',
    sku: 'EAR-MEEN-001',
    price: 1499,
    category: 'earrings',
    collections: ['statement'],
    images: ['earring-01.jpg', 'earring-02.jpg'],
    shortDescription: 'Statement drops with sapphire-blue centre stones.',
    description:
      'Bold teardrop earrings framed in crystals around a deep sapphire-blue centre. Lightweight to wear, impossible to ignore.',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    slug: 'zoya-gold-hoops',
    name: 'Zoya Gold Hoops',
    sku: 'EAR-ZOYA-002',
    price: 899,
    category: 'earrings',
    collections: ['everyday-gold'],
    images: ['earring-02.jpg', 'earring-01.jpg'],
    shortDescription: 'Chunky twisted gold-tone hoops.',
    description:
      'A chunky twisted hoop in a warm gold tone — the everyday earring that finishes every outfit. Secure snap closure.',
    isBestSeller: true,
  },
  {
    slug: 'saanvi-chandbali-earrings',
    name: 'Saanvi Chandbali Earrings',
    sku: 'EAR-SAAN-003',
    price: 1899,
    salePrice: 1499,
    category: 'earrings',
    collections: ['bridal-edit', 'statement'],
    images: ['earring-01.jpg'],
    shortDescription: 'Traditional crescent chandbalis with pearl drops.',
    description:
      'A modern take on the classic chandbali — crescent silhouette, crystal detailing, and delicate pearl drops for festive and bridal wear.',
    isFeatured: true,
  },
  {
    slug: 'ira-huggie-hoops',
    name: 'Ira Huggie Hoops',
    sku: 'EAR-IRA-004',
    price: 799,
    category: 'earrings',
    collections: ['everyday-gold'],
    images: ['earring-02.jpg'],
    shortDescription: 'Petite pavé huggie hoops for a subtle sparkle.',
    description:
      'Snug pavé-set huggie hoops that sit close to the lobe — perfect on their own or stacked up a curated ear.',
  },

  // ---- Rings ----
  {
    slug: 'bahaar-floral-cocktail-ring',
    name: 'Bahaar Floral Cocktail Ring',
    sku: 'RNG-BAHA-001',
    price: 1699,
    category: 'rings',
    collections: ['statement'],
    images: ['ring-01.jpg', 'ring-04.jpg'],
    shortDescription: 'A floral cocktail ring in amethyst and citrine tones.',
    description:
      'Petals of amethyst-purple and citrine-yellow stones bloom around a crystal centre. A show-stopping cocktail ring for celebrations.',
    isFeatured: true,
  },
  {
    slug: 'solitaire-radiance-ring',
    name: 'Solitaire Radiance Ring',
    sku: 'RNG-SOLI-002',
    price: 1999,
    salePrice: 1599,
    category: 'rings',
    collections: ['bridal-edit'],
    images: ['ring-02.jpg', 'ring-03.jpg'],
    shortDescription: 'A halo solitaire that reads like the real thing.',
    description:
      'A brilliant-cut centre stone wrapped in a crystal halo on a split shank. All the sparkle of a solitaire, none of the price.',
    isBestSeller: true,
  },
  {
    slug: 'rani-pink-sapphire-ring',
    name: 'Rani Pink Sapphire Ring',
    sku: 'RNG-RANI-003',
    price: 1799,
    category: 'rings',
    collections: ['statement'],
    images: ['ring-03.jpg', 'ring-02.jpg'],
    shortDescription: 'A cushion-cut pink stone in a rose gold-tone halo.',
    description:
      'A romantic cushion-cut pink centre stone haloed in crystals and set on a rose gold-tone band. Made to be noticed.',
    isFeatured: true,
  },
  {
    slug: 'pebble-gemstone-ring',
    name: 'Pebble Gemstone Ring',
    sku: 'RNG-PEBB-004',
    price: 1099,
    category: 'rings',
    collections: ['everyday-gold'],
    images: ['ring-04.jpg', 'ring-01.jpg'],
    shortDescription: 'Smooth cabochon stones on slim gold-tone bands.',
    description:
      'Smooth cabochon stones in warm earthy tones set on slim gold-tone bands — designed to stack or wear solo.',
  },
  {
    slug: 'anaya-statement-ring',
    name: 'Anaya Statement Ring',
    sku: 'RNG-ANAY-005',
    price: 1399,
    salePrice: 1099,
    category: 'rings',
    collections: ['statement'],
    images: ['ring-01.jpg'],
    shortDescription: 'An oversized floral statement ring.',
    description:
      'An oversized floral cluster that commands attention. Adjustable band for a comfortable fit across sizes.',
  },

  // ---- Bangles & Bracelets ----
  {
    slug: 'sitara-diamond-bangle',
    name: 'Sitara Crystal Bangle',
    sku: 'BNG-SITA-001',
    price: 2299,
    category: 'bangles',
    collections: ['bridal-edit', 'statement'],
    images: ['bangle-01.jpg', 'bangle-02.jpg'],
    shortDescription: 'A brilliant crystal-lined bangle that catches every light.',
    description:
      'A continuous line of brilliant crystals set in a rhodium-finish bangle. Timeless sparkle for weddings and evenings out.',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    slug: 'rose-pave-bangle',
    name: 'Rosé Pavé Bangle',
    sku: 'BNG-ROSE-002',
    price: 1899,
    salePrice: 1499,
    category: 'bangles',
    collections: ['statement'],
    images: ['bangle-02.jpg', 'bangle-01.jpg'],
    shortDescription: 'A rose gold-tone bangle in swirling pavé crystals.',
    description:
      'Swirls of pavé-set crystals in a warm rose gold tone. A soft, romantic bangle that layers beautifully with a watch or stack.',
    isFeatured: true,
  },
  {
    slug: 'kiara-chain-bracelet',
    name: 'Kiara Chain Bracelet',
    sku: 'BNG-KIAR-003',
    price: 999,
    category: 'bangles',
    collections: ['everyday-gold'],
    images: ['bangle-03.jpg'],
    shortDescription: 'A delicate gold-tone link bracelet for daily wear.',
    description:
      'A fine interlocking-link bracelet in a warm gold tone with a secure clasp — the everyday piece you never take off.',
    isBestSeller: true,
  },
  {
    slug: 'heritage-kada',
    name: 'Heritage Kada',
    sku: 'BNG-HERI-004',
    price: 1799,
    category: 'bangles',
    collections: ['bridal-edit'],
    images: ['bangle-01.jpg'],
    shortDescription: 'A broad crystal-set kada with an antique finish.',
    description:
      'A broad statement kada lined with crystals — inspired by heritage bridal jewellery and finished for modern wear.',
  },
  {
    slug: 'aabha-tennis-bracelet',
    name: 'Aabha Tennis Bracelet',
    sku: 'BNG-AABH-005',
    price: 1599,
    salePrice: 1249,
    category: 'bangles',
    collections: ['everyday-gold', 'statement'],
    images: ['bangle-02.jpg'],
    shortDescription: 'A classic crystal tennis bracelet.',
    description:
      'A flexible line of prong-set crystals that moves with your wrist. The classic tennis bracelet, reimagined at an everyday price.',
  },

  // ---- Bridal Sets ----
  {
    slug: 'vivaah-temple-jewellery-set',
    name: 'Vivaah Temple Jewellery Set',
    sku: 'BRD-VIVA-001',
    price: 6999,
    salePrice: 5499,
    category: 'bridal-sets',
    collections: ['bridal-edit', 'statement'],
    images: ['bridal-02.jpg', 'bridal-01.jpg'],
    shortDescription: 'A traditional temple necklace-and-earring set in antique gold.',
    description:
      'An antique gold-tone temple set with ruby-red accents and matching jhumka earrings. The centrepiece of a bridal trousseau, crafted to feel like an heirloom.',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    slug: 'moti-pearl-bridal-set',
    name: 'Moti Pearl Bridal Set',
    sku: 'BRD-MOTI-002',
    price: 4499,
    category: 'bridal-sets',
    collections: ['bridal-edit'],
    images: ['bridal-01.jpg', 'bridal-02.jpg'],
    shortDescription: 'A graduated pearl necklace set with a crystal clasp.',
    description:
      'A lustrous graduated pearl necklace with matching earrings and a sparkling crystal clasp. Soft, romantic, and endlessly wearable beyond the wedding day.',
    isFeatured: true,
  },
  {
    slug: 'lakshmi-antique-gold-set',
    name: 'Lakshmi Antique Gold Set',
    sku: 'BRD-LAKS-003',
    price: 5999,
    salePrice: 4999,
    category: 'bridal-sets',
    collections: ['bridal-edit'],
    images: ['bridal-02.jpg'],
    shortDescription: 'An ornate antique-gold bridal necklace set.',
    description:
      'An ornate antique gold-tone set with intricate detailing and coloured stone accents — regal enough for the mandap, treasured long after.',
    isBestSeller: true,
  },
  {
    slug: 'shubh-pearl-choker-set',
    name: 'Shubh Pearl Choker Set',
    sku: 'BRD-SHUB-004',
    price: 3999,
    category: 'bridal-sets',
    collections: ['bridal-edit'],
    images: ['bridal-01.jpg'],
    shortDescription: 'A close-fitting pearl choker set for engagements.',
    description:
      'A close-fitting pearl choker with coordinating earrings — an elegant choice for engagements, receptions, and festive evenings.',
  },
  {
    slug: 'maharani-bridal-necklace-set',
    name: 'Maharani Bridal Necklace Set',
    sku: 'BRD-MAHA-005',
    price: 8499,
    salePrice: 6999,
    category: 'bridal-sets',
    collections: ['bridal-edit', 'statement'],
    images: ['bridal-02.jpg'],
    shortDescription: 'A grand statement bridal set for the main event.',
    description:
      'The grandest piece in the edit — a layered statement necklace with matching earrings, built to be the focal point of the bridal look.',
    isFeatured: true,
  },
];

async function upsertCategories(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          description: c.description,
          image: c.image,
          status: 'active',
          sortOrder: c.sortOrder,
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    map.set(c.slug, String(doc._id));
  }
  return map;
}

async function upsertCollections(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const c of COLLECTIONS) {
    const doc = await Collection.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          description: c.description,
          bannerImage: c.bannerImage,
          status: 'active',
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    map.set(c.slug, String(doc._id));
  }
  return map;
}

async function upsertProducts(
  categoryIds: Map<string, string>,
  collectionIds: Map<string, string>,
): Promise<void> {
  for (const [index, p] of PRODUCTS.entries()) {
    const categoryId = categoryIds.get(p.category);
    if (categoryId === undefined) {
      throw new Error(`seed-demo: unknown category "${p.category}" for product ${p.slug}`);
    }
    // Deterministic demo barcode (13-digit EAN-like). DEMO-ONLY — replace with the
    // client's real printed barcodes.
    const barcode = `8901${String(index + 1).padStart(9, '0')}`;
    const collections = p.collections.map((slug) => {
      const id = collectionIds.get(slug);
      if (id === undefined) {
        throw new Error(`seed-demo: unknown collection "${slug}" for product ${p.slug}`);
      }
      return id;
    });

    const doc = await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          sku: p.sku,
          barcode,
          shortDescription: p.shortDescription,
          description: p.description,
          price: p.price,
          salePrice: p.salePrice,
          categoryId,
          collectionIds: collections,
          images: p.images.map((file, position) => ({
            url: img(file),
            alt: p.name,
            position,
          })),
          status: 'active',
          isFeatured: p.isFeatured ?? false,
          isBestSeller: p.isBestSeller ?? false,
          seo: {
            title: `${p.name} — Sajawat`,
            description: p.shortDescription,
            keywords: [],
          },
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    const quantity = 25;
    await Inventory.findOneAndUpdate(
      { productId: doc._id },
      {
        $set: {
          quantity,
          reservedQuantity: 0,
          availableQuantity: quantity,
          lowStockThreshold: 5,
          status: 'in_stock',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
}

interface PromotionSeed {
  name: string;
  trigger: 'automatic' | 'coupon';
  code?: string;
  rewardType: 'percentage' | 'fixed';
  value: number;
  minCartValue: number;
  maxDiscount?: number;
}

const PROMOTIONS: PromotionSeed[] = [
  {
    name: '10% off orders over ₹2,999',
    trigger: 'automatic',
    rewardType: 'percentage',
    value: 10,
    minCartValue: 2999,
    maxDiscount: 1500,
  },
  {
    name: 'Festive offer — 15% off with code',
    trigger: 'coupon',
    code: 'FESTIVE15',
    rewardType: 'percentage',
    value: 15,
    minCartValue: 1999,
    maxDiscount: 2000,
  },
  {
    name: '₹300 off your first order',
    trigger: 'coupon',
    code: 'WELCOME300',
    rewardType: 'fixed',
    value: 300,
    minCartValue: 1499,
  },
];

async function upsertPromotions(): Promise<void> {
  for (const promo of PROMOTIONS) {
    // Key coupons by code; key the automatic promo by name (no code).
    const key = promo.code !== undefined ? { code: promo.code } : { name: promo.name };
    await Promotion.findOneAndUpdate(
      key,
      {
        $set: {
          name: promo.name,
          trigger: promo.trigger,
          code: promo.code,
          rewardType: promo.rewardType,
          value: promo.value,
          minCartValue: promo.minCartValue,
          maxDiscount: promo.maxDiscount ?? null,
          status: 'active',
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
}

async function upsertDemoCustomer(): Promise<void> {
  const existing = await User.findOne({ email: DEMO_EMAIL.toLowerCase() });
  if (existing !== null) {
    logger.info({ email: DEMO_EMAIL }, 'seed-demo: demo customer already exists; no-op');
    return;
  }
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await User.create({
    firstName: 'Demo',
    lastName: 'Customer',
    email: DEMO_EMAIL.toLowerCase(),
    passwordHash,
    role: ROLES.CUSTOMER,
    customerType: 'b2c',
    isEmailVerified: true,
    status: 'active',
  });
  logger.info({ email: DEMO_EMAIL }, 'seed-demo: demo customer created');
}

async function seedDemo(): Promise<void> {
  await connectToDatabase();
  try {
    const categoryIds = await upsertCategories();
    const collectionIds = await upsertCollections();
    await upsertProducts(categoryIds, collectionIds);
    await upsertPromotions();
    await upsertDemoCustomer();
    logger.info(
      {
        categories: CATEGORIES.length,
        collections: COLLECTIONS.length,
        products: PRODUCTS.length,
        promotions: PROMOTIONS.length,
        demoLogin: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      },
      'seed-demo: complete',
    );
  } finally {
    await disconnectFromDatabase();
  }
}

seedDemo().catch((err: unknown) => {
  logger.fatal({ err }, 'seed-demo failed');
  process.exit(1);
});
