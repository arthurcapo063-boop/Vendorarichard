/* Seed script: `npx tsx src/db/seed.ts` (requires DATABASE_URL) */
import "dotenv/config";
import { randomBytes, scryptSync } from "crypto";
import { db } from "./index";
import {
  settings,
  users,
  categories,
  products,
  productAttributes,
  productFees,
  promoCodes,
  notifications,
} from "./schema";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}.${hash}`;
}

const img = (id: number, ext: "jpeg" | "png" = "jpeg") =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200`;

type Attr = { name: string; value: string; priceDelta?: number };
type Fee = { feeName: string; feeAmount: number };
type P = {
  name: string;
  slug: string;
  description: string;
  cat: string;
  images: string[];
  basePrice: number;
  salePrice?: number | null;
  stockQty: number | null;
  isFlashSale?: boolean;
  isFeatured?: boolean;
  attrs?: Attr[];
  fees?: Fee[];
};

const catalog: P[] = [
  /* ---------------- Cars ---------------- */
  {
    name: "Mercedes-Benz GLE 450 (2021)",
    slug: "mercedes-benz-gle-450-2021",
    description:
      "Single-owner GLE 450 with full service history, panoramic roof and the AMG-Line package. Verified title, accident-free, and ready for immediate pickup at our Lekki showroom.",
    cat: "cars",
    images: [img(30795598), img(20695247)],
    basePrice: 42500000,
    stockQty: 2,
    isFeatured: true,
    attrs: [
      { name: "Make", value: "Mercedes-Benz" },
      { name: "Year", value: "2021" },
      { name: "Mileage", value: "18,400 km" },
      { name: "Transmission", value: "Automatic" },
    ],
    fees: [
      { feeName: "Documentation & Title Transfer", feeAmount: 85000 },
      { feeName: "Inspection Certificate", feeAmount: 25000 },
    ],
  },
  {
    name: "BMW 4 Series Coupé (2019)",
    slug: "bmw-4-series-coupe-2019",
    description:
      "Matte-finish 4 Series with M-Sport trim, harman/kardon audio and fresh tyres. Flash-priced this week only.",
    cat: "cars",
    images: [img(9269281)],
    basePrice: 28900000,
    salePrice: 26500000,
    stockQty: 1,
    isFlashSale: true,
    attrs: [
      { name: "Make", value: "BMW" },
      { name: "Year", value: "2019" },
      { name: "Mileage", value: "32,100 km" },
      { name: "Transmission", value: "Automatic" },
    ],
    fees: [{ feeName: "Documentation & Title Transfer", feeAmount: 85000 }],
  },
  {
    name: "Lexus RX 350 (2020)",
    slug: "lexus-rx-350-2020",
    description:
      "Nigerian-used RX 350 in stellar condition. Cold AC, leather interior, 360° camera, and a clean CARFAX report.",
    cat: "cars",
    images: [img(13578691)],
    basePrice: 31200000,
    stockQty: 3,
    isFeatured: true,
    attrs: [
      { name: "Make", value: "Lexus" },
      { name: "Year", value: "2020" },
      { name: "Mileage", value: "24,750 km" },
      { name: "Transmission", value: "Automatic" },
    ],
    fees: [{ feeName: "Documentation & Title Transfer", feeAmount: 85000 }],
  },
  {
    name: "Ford Mustang GT Coupé (2017)",
    slug: "ford-mustang-gt-2017",
    description:
      "5.0L V8 muscle in shadow black. Exhaust notes included at no extra charge. This unit has been snapped up — join the waitlist.",
    cat: "cars",
    images: [img(261985)],
    basePrice: 19800000,
    salePrice: 17900000,
    stockQty: 0,
    isFlashSale: true,
    attrs: [
      { name: "Make", value: "Ford" },
      { name: "Year", value: "2017" },
      { name: "Mileage", value: "41,300 km" },
      { name: "Transmission", value: "Manual" },
    ],
    fees: [{ feeName: "Documentation & Title Transfer", feeAmount: 85000 }],
  },
  {
    name: "Jaguar F-Pace 25t Prestige (2019)",
    slug: "jaguar-f-pace-2019",
    description:
      "British luxury SUV with a cabin that photographs even better than it drives. One owner, dealer serviced.",
    cat: "cars",
    images: [img(20695247), img(30795598)],
    basePrice: 24750000,
    stockQty: 2,
    attrs: [
      { name: "Make", value: "Jaguar" },
      { name: "Year", value: "2019" },
      { name: "Mileage", value: "29,900 km" },
      { name: "Transmission", value: "Automatic" },
    ],
    fees: [{ feeName: "Documentation & Title Transfer", feeAmount: 85000 }],
  },

  /* ---------------- Clothing ---------------- */
  {
    name: "Sunburst Oversized Hoodie",
    slug: "sunburst-oversized-hoodie",
    description:
      "Heavyweight 480gsm fleece in a loud mustard wash. Boxy cut, dropped shoulders, kangaroo pocket. Unisex.",
    cat: "clothing",
    images: [img(5560397)],
    basePrice: 18500,
    salePrice: 14999,
    stockQty: 24,
    isFlashSale: true,
    isFeatured: true,
    attrs: [
      { name: "Size", value: "S" },
      { name: "Size", value: "M" },
      { name: "Size", value: "L" },
      { name: "Size", value: "XL" },
      { name: "Color", value: "Mustard" },
      { name: "Color", value: "Black", priceDelta: 1000 },
    ],
    fees: [{ feeName: "Packaging Fee", feeAmount: 500 }],
  },
  {
    name: "Reflective Night Hoodie",
    slug: "reflective-night-hoodie",
    description:
      "Glow-reactive print hoodie made for after-dark city life. Water-repellent shell with thermal lining.",
    cat: "clothing",
    images: [img(10378629)],
    basePrice: 22000,
    stockQty: 15,
    attrs: [
      { name: "Size", value: "M" },
      { name: "Size", value: "L" },
      { name: "Size", value: "XL" },
      { name: "Color", value: "White" },
      { name: "Color", value: "Black" },
    ],
    fees: [{ feeName: "Packaging Fee", feeAmount: 500 }],
  },
  {
    name: "Crimson Puffer Jacket",
    slug: "crimson-puffer-jacket",
    description:
      "High-collar puffer in crimson with quilted baffles and storm cuffs. Packs into its own pocket.",
    cat: "clothing",
    images: [img(19204945)],
    basePrice: 34500,
    salePrice: 29900,
    stockQty: 9,
    isFlashSale: true,
    attrs: [
      { name: "Size", value: "S" },
      { name: "Size", value: "M" },
      { name: "Size", value: "L" },
      { name: "Color", value: "Crimson" },
    ],
    fees: [{ feeName: "Packaging Fee", feeAmount: 500 }],
  },
  {
    name: "Essential Zip Hoodie",
    slug: "essential-zip-hoodie",
    description:
      "The daily driver. Midweight cotton blend, YKK zip, ribbed hems. Buy two, thank us later.",
    cat: "clothing",
    images: [img(5319520)],
    basePrice: 16800,
    stockQty: 18,
    attrs: [
      { name: "Size", value: "M" },
      { name: "Size", value: "L" },
      { name: "Size", value: "XL" },
      { name: "Color", value: "Graphite" },
      { name: "Color", value: "Olive" },
    ],
  },
  {
    name: "Duo Urban Hoodie Set",
    slug: "duo-urban-hoodie-set",
    description:
      "Two-piece matching set for the coordinated fit. Heavy jersey knit with tonal drawstrings.",
    cat: "clothing",
    images: [img(9552020)],
    basePrice: 39900,
    stockQty: 6,
    isFeatured: true,
    attrs: [
      { name: "Size", value: "M" },
      { name: "Size", value: "L" },
      { name: "Color", value: "Charcoal" },
    ],
    fees: [{ feeName: "Packaging Fee", feeAmount: 800 }],
  },

  /* ---------------- Watches ---------------- */
  {
    name: "Meridian Chronograph 42mm",
    slug: "meridian-chronograph-42mm",
    description:
      "Japanese quartz chronograph, sapphire-coated crystal, 5ATM. The strap is the whole conversation.",
    cat: "watches",
    images: [img(4567357)],
    basePrice: 125000,
    salePrice: 99500,
    stockQty: 7,
    isFlashSale: true,
    isFeatured: true,
    attrs: [
      { name: "Strap", value: "Steel Mesh" },
      { name: "Strap", value: "Tan Leather", priceDelta: -8000 },
    ],
    fees: [{ feeName: "Gift Box & Engraving", feeAmount: 3500 }],
  },
  {
    name: "Noir Automatic 40mm",
    slug: "noir-automatic-40mm",
    description:
      "Self-winding automatic in stealth black with an exhibition caseback. 41-hour power reserve.",
    cat: "watches",
    images: [img(12545929)],
    basePrice: 210000,
    stockQty: 3,
    isFeatured: true,
    attrs: [{ name: "Strap", value: "Black Leather" }],
    fees: [{ feeName: "Gift Box & Engraving", feeAmount: 3500 }],
  },
  {
    name: "Heritage Gold 38mm",
    slug: "heritage-gold-38mm",
    description:
      "Vintage-inspired gold-tone case with a domed crystal. Ages like a rumoured family heirloom.",
    cat: "watches",
    images: [img(14756492)],
    basePrice: 88000,
    stockQty: 5,
    attrs: [{ name: "Strap", value: "Brown Leather" }],
  },
  {
    name: "Verde Minimal 36mm",
    slug: "verde-minimal-36mm",
    description:
      "A quiet dial, a textured strap, zero clutter. The minimalist's daily wear.",
    cat: "watches",
    images: [img(34069467)],
    basePrice: 64500,
    salePrice: 54900,
    stockQty: 12,
    attrs: [{ name: "Strap", value: "Silver Mesh" }],
  },

  /* ---------------- Shoes ---------------- */
  {
    name: "Timber Craft Work Boots",
    slug: "timber-craft-work-boots",
    description:
      "Full-grain leather work boots with lug soles and Goodyear welt construction. Built to be re-soled, not replaced.",
    cat: "shoes",
    images: [img(6316211)],
    basePrice: 52000,
    stockQty: 10,
    attrs: [
      { name: "Size", value: "41" },
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Size", value: "44" },
      { name: "Size", value: "45" },
    ],
    fees: [{ feeName: "Care Kit Bundle", feeAmount: 4500 }],
  },
  {
    name: "Chelsea Night Chukka",
    slug: "chelsea-night-chukka",
    description:
      "Studio-lit chukka boots in oiled calf leather. Slip-on elastic gussets, cushioned insole.",
    cat: "shoes",
    images: [img(9397837)],
    basePrice: 47500,
    salePrice: 39900,
    stockQty: 8,
    isFlashSale: true,
    attrs: [
      { name: "Size", value: "41" },
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Size", value: "44" },
    ],
  },
  {
    name: "Artisan Leather Boot — Shelf Edition",
    slug: "artisan-leather-boot-shelf-edition",
    description:
      "Small-batch boots from a third-generation cobbler. Burnished toe, hand-stitched apron.",
    cat: "shoes",
    images: [img(29090887)],
    basePrice: 58900,
    stockQty: 4,
    isFeatured: true,
    attrs: [
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Size", value: "44" },
    ],
    fees: [{ feeName: "Care Kit Bundle", feeAmount: 4500 }],
  },
  {
    name: "Rancher Heritage Boot",
    slug: "rancher-heritage-boot",
    description:
      "Wrangler-tagged heritage boots on rustic leather. The last pair of the season is gone — restock incoming.",
    cat: "shoes",
    images: [img(10902287)],
    basePrice: 61000,
    stockQty: 0,
    attrs: [
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
    ],
  },

  /* ---------------- Sneakers ---------------- */
  {
    name: "Velocity Knit Runner",
    slug: "velocity-knit-runner",
    description:
      "Breathable knit upper, rubber traction pods, and a midsole tuned for long city miles. Our best-selling runner.",
    cat: "sneakers",
    images: [img(1456740)],
    basePrice: 45500,
    salePrice: 32900,
    stockQty: 20,
    isFlashSale: true,
    isFeatured: true,
    attrs: [
      { name: "Size", value: "40" },
      { name: "Size", value: "41" },
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Size", value: "44" },
      { name: "Color", value: "Red" },
      { name: "Color", value: "White" },
    ],
    fees: [{ feeName: "Authenticity Certificate", feeAmount: 1000 }],
  },
  {
    name: "Blaze Street Sneaker",
    slug: "blaze-street-sneaker",
    description:
      "Loud red streetwear staple with white laces and a gum sole. Pairs with everything you already own.",
    cat: "sneakers",
    images: [img(31688978)],
    basePrice: 38900,
    stockQty: 14,
    attrs: [
      { name: "Size", value: "41" },
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Color", value: "Blaze Red" },
    ],
  },
  {
    name: "Neon Court Low",
    slug: "neon-court-low",
    description:
      "Court silhouette with an electric blue glow under UV light. Limited run, numbered pairs.",
    cat: "sneakers",
    images: [img(6698232)],
    basePrice: 41200,
    stockQty: 11,
    isFeatured: true,
    attrs: [
      { name: "Size", value: "40" },
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Color", value: "Electric Blue" },
    ],
  },
  {
    name: "Ultraviolet High-Top",
    slug: "ultraviolet-high-top",
    description:
      "High-top with reactive ultraviolet panels that shift colour in sunlight. Ankle support with attitude.",
    cat: "sneakers",
    images: [img(4578684, "png")],
    basePrice: 52800,
    salePrice: 44900,
    stockQty: 7,
    isFlashSale: true,
    attrs: [
      { name: "Size", value: "41" },
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Color", value: "Ultraviolet" },
    ],
    fees: [{ feeName: "Authenticity Certificate", feeAmount: 1000 }],
  },
  {
    name: "Cloudstep Court Classic",
    slug: "cloudstep-court-classic",
    description:
      "Clean white court classic floating on an orange cloud. Comfort insole, stitched overlays, zero fuss.",
    cat: "sneakers",
    images: [img(28645957)],
    basePrice: 29900,
    stockQty: 30,
    isFeatured: true,
    attrs: [
      { name: "Size", value: "40" },
      { name: "Size", value: "41" },
      { name: "Size", value: "42" },
      { name: "Size", value: "43" },
      { name: "Color", value: "White / Black" },
    ],
  },

  /* ---------------- Building Materials ---------------- */
  {
    name: "Portland Cement 42.5R (50kg)",
    slug: "portland-cement-42-5r-50kg",
    description:
      "High early-strength Portland cement per 50kg bag. Bulk orders qualify for site delivery pricing.",
    cat: "building-materials",
    images: [img(12845907)],
    basePrice: 9200,
    stockQty: 400,
    isFeatured: true,
    attrs: [{ name: "Grade", value: "42.5R" }],
    fees: [{ feeName: "Pallet & Loading Fee", feeAmount: 1200 }],
  },
  {
    name: "Red Clay Bricks (per 100)",
    slug: "red-clay-bricks-per-100",
    description:
      "Kiln-fired red clay bricks, sold per 100. Uniform sizing, low breakage rate, stacked on request.",
    cat: "building-materials",
    images: [img(17940311)],
    basePrice: 45000,
    stockQty: 120,
    attrs: [{ name: "Unit", value: "100 bricks" }],
    fees: [{ feeName: "Pallet & Loading Fee", feeAmount: 1500 }],
  },
  {
    name: "Concrete Hollow Blocks (per 50)",
    slug: "concrete-hollow-blocks-per-50",
    description:
      "Vibrated 6-inch hollow blocks per 50 units. Consistent compressive strength for load-bearing walls.",
    cat: "building-materials",
    images: [img(14562040)],
    basePrice: 62500,
    salePrice: 57900,
    stockQty: 80,
    isFlashSale: true,
    attrs: [{ name: "Size", value: '6"' }, { name: "Unit", value: "50 blocks" }],
    fees: [{ feeName: "Pallet & Loading Fee", feeAmount: 2000 }],
  },
  {
    name: "Solid Concrete Blocks (per 50)",
    slug: "solid-concrete-blocks-per-50",
    description:
      "Sun-cured solid blocks with sharp edges and high density. Ideal for foundations and fencing.",
    cat: "building-materials",
    images: [img(36386830)],
    basePrice: 71000,
    stockQty: 60,
    attrs: [{ name: "Size", value: '9"' }, { name: "Unit", value: "50 blocks" }],
    fees: [{ feeName: "Pallet & Loading Fee", feeAmount: 2000 }],
  },
  {
    name: "Artisan Clay Bricks (per 100)",
    slug: "artisan-clay-bricks-per-100",
    description:
      "Handmade clay bricks with warm tonal variation — the façade-makers' favourite for feature walls.",
    cat: "building-materials",
    images: [img(33894664)],
    basePrice: 52000,
    stockQty: 90,
    attrs: [{ name: "Unit", value: "100 bricks" }],
  },
];

async function main() {
  console.log("Seeding Vendora database…");

  const existing = await db.select({ id: settings.id }).from(settings).limit(1);
  if (existing.length > 0) {
    console.log("Settings row already exists — skipping seed.");
    return;
  }

  /* Settings */
  await db.insert(settings).values({
    siteName: "Vendora",
    tagline: "The everything market",
    logoUrl: "",
    primaryColor: "#FF5A1F",
    secondaryColor: "#0E8A76",
    currency: "GHS",
    whatsappNumber: "2348012345678",
    contactEmail: "hello@vendora.shop",
    contactPhone: "+234 801 234 5678",
    contactAddress: "14B Admiralty Way, Lekki Phase 1, Lagos",
    contactHeading: "Talk to the market",
    contactBody:
      "Questions about an order, a bulk quote on building materials, or a vehicle inspection visit? Our crew replies within the hour on WhatsApp and email.",
    supportHours: "Mon – Sat, 8:00 – 20:00 WAT",
    heroHeadline: "Everything you want. One loud market.",
    heroSub:
      "Cars, kicks, couture and cement — shipped to your door with wallet payments, flash drops and zero wahala.",
    footerBlurb:
      "Vendora is a full-service marketplace: verified sellers, tracked delivery, wallet credits and Paystack-secured checkout.",
    facebook: "https://facebook.com/vendora",
    instagram: "https://instagram.com/vendora",
    twitter: "https://x.com/vendora",
    tiktok: "",
    youtube: "",
    linkedin: "",
    showSoldOut: true,
    flashSaleEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 26),
  });

  /* Users */
  await db.insert(users).values([
    {
      name: "Store Admin",
      email: "admin@vendora.shop",
      passwordHash: hashPassword("Admin123!"),
      whatsapp: "2348012345678",
      address: "14B Admiralty Way, Lekki Phase 1, Lagos",
      role: "admin",
      walletBalance: "0",
    },
    {
      name: "Adaeze Okafor",
      email: "demo@vendora.shop",
      passwordHash: hashPassword("Demo123!"),
      whatsapp: "2348098765432",
      address: "22 Adeola Odeku Street, Victoria Island, Lagos",
      role: "customer",
      walletBalance: "25000",
    },
    {
      name: "Tunde Bakare",
      email: "tunde@example.com",
      passwordHash: hashPassword("Tunde123!"),
      whatsapp: "2348055512345",
      address: "5 Sapele Street, Wuse 2, Abuja",
      role: "customer",
      walletBalance: "7500",
    },
  ]);

  /* Categories */
  const catDefs = [
    { name: "Cars", slug: "cars", sortOrder: 0, description: "Verified vehicles with clean papers.", image: img(30795598) },
    { name: "Clothing", slug: "clothing", sortOrder: 1, description: "Heavyweight streetwear and staples.", image: img(5560397) },
    { name: "Watches", slug: "watches", sortOrder: 2, description: "Chronographs, automatics and minimal dials.", image: img(4567357) },
    { name: "Shoes", slug: "shoes", sortOrder: 3, description: "Leather boots and crafted footwear.", image: img(6316211) },
    { name: "Sneakers", slug: "sneakers", sortOrder: 4, description: "Runners, courts and limited heat.", image: img(28645957) },
    { name: "Building Materials", slug: "building-materials", sortOrder: 5, description: "Cement, blocks and bricks by the unit.", image: img(17940311) },
  ];
  const insertedCats = await db.insert(categories).values(catDefs).returning();
  const catId = Object.fromEntries(insertedCats.map((c) => [c.slug, c.id]));

  /* Products + attributes + fees */
  for (const p of catalog) {
    const [prod] = await db
      .insert(products)
      .values({
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: catId[p.cat],
        images: p.images,
        basePrice: String(p.basePrice),
        salePrice: p.salePrice != null ? String(p.salePrice) : null,
        stockQty: p.stockQty,
        isFlashSale: p.isFlashSale ?? false,
        isFeatured: p.isFeatured ?? false,
      })
      .returning();
    if (p.attrs?.length) {
      await db.insert(productAttributes).values(
        p.attrs.map((a) => ({
          productId: prod.id,
          name: a.name,
          value: a.value,
          priceDelta: String(a.priceDelta ?? 0),
        }))
      );
    }
    if (p.fees?.length) {
      await db.insert(productFees).values(
        p.fees.map((f) => ({
          productId: prod.id,
          feeName: f.feeName,
          feeAmount: String(f.feeAmount),
        }))
      );
    }
  }

  /* Promo codes */
  await db.insert(promoCodes).values([
    { code: "WELCOME10", type: "percent", value: "10", minSubtotal: "0", isActive: true },
    { code: "BUILD5000", type: "fixed", value: "5000", minSubtotal: "50000", isActive: true },
    { code: "FLASH25", type: "percent", value: "25", minSubtotal: "100000", isActive: false, usageLimit: 50 },
  ]);

  /* Announcements */
  await db.insert(notifications).values([
    {
      title: "Welcome to Vendora 🎉",
      body: "The market is live! Use code WELCOME10 for 10% off your first order — works on everything, even cars (yes, really).",
      audience: "all",
    },
    {
      title: "Wallet top-ups are live",
      body: "Fund your Vendora wallet with Paystack and check out in one tap. Wallet credit is valid for store purchases and never expires.",
      audience: "users",
    },
    {
      title: "Flash Sale: up to 25% off",
      body: "Sneakers, chronographs, coupés and concrete blocks are all dropped in price. When the timer hits zero, prices snap back.",
      audience: "all",
    },
  ]);

  console.log("Seed complete: settings, 3 users, 6 categories, 28 products, 3 promos, 3 announcements.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
