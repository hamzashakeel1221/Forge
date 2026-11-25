/**
 * ─────────────────────────────────────────────────────────────
 *  FORGE SITE CONFIG
 *  Everything a client cares about lives here: brand, product,
 *  copy, colourways, features, collection and checkout.
 *  Swap this file (and optionally drop a GLB into /public/models)
 *  to turn the template into a new store page.
 * ─────────────────────────────────────────────────────────────
 */

export type Colorway = {
  id: string;
  name: string;
  /** Shell / body colour */
  primary: string;
  /** Glow, LEDs, rings and UI accent */
  accent: string;
  /** Cushions / soft parts */
  soft: string;
  metalness: number;
  roughness: number;
  /** Scene background tint while this colourway is active */
  background: string;
};

export type Feature = {
  /** Name of the product part this label is attached to (see ProductModel parts) */
  part: string;
  title: string;
  body: string;
};

export type CollectionItem = {
  id: string;
  name: string;
  price: number;
  colorway: string; // colorway id
  tag?: string;
};

export type SectionId = "hero" | "explode" | "configure" | "portal" | "collection" | "physics" | "checkout";

export type SectionConfig = {
  id: SectionId;
  /** Section length in viewport heights. More = slower, longer scene. Minimum 2. */
  length: number;
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "right" | "center";
};

export const siteConfig = {
  brand: {
    name: "FORGE",
    tagline: "Sound, engineered in three dimensions.",
    currency: "USD",
  },

  product: {
    name: "Forge One",
    subtitle: "Wireless studio headphones",
    price: 349,
    /**
     * "procedural" renders the built-in headphones model.
     * To use your own model, set e.g. "/models/sneaker.glb". Every mesh in the GLB
     * becomes an explodable part, and meshes whose material name is listed in
     * `glbColorMaterials` are recoloured by the configurator.
     */
    model: "procedural" as "procedural" | `/${string}.glb`,
    glbColorMaterials: ["Body", "Shell"],
    glbAccentMaterials: ["Accent", "Trim"],
  },

  colorways: [
    { id: "obsidian", name: "Obsidian", primary: "#16161c", accent: "#7c5cff", soft: "#2a2a33", metalness: 0.65, roughness: 0.28, background: "#07060d" },
    { id: "solar", name: "Solar Flare", primary: "#ff5a1f", accent: "#ffd166", soft: "#3a1a10", metalness: 0.35, roughness: 0.35, background: "#120604" },
    { id: "glacier", name: "Glacier", primary: "#dfe9f5", accent: "#38bdf8", soft: "#9fb3c8", metalness: 0.2, roughness: 0.18, background: "#040b14" },
    { id: "venom", name: "Venom", primary: "#0f2a1c", accent: "#39ff88", soft: "#123323", metalness: 0.8, roughness: 0.22, background: "#020a06" },
    { id: "rose", name: "Rose Gold", primary: "#e8b4a0", accent: "#ff4d8d", soft: "#5a3a36", metalness: 0.95, roughness: 0.15, background: "#10060a" },
  ] satisfies Colorway[],

  features: [
    { part: "band", title: "Aerospace band", body: "Forged aluminium core, 38% lighter than steel." },
    { part: "driverL", title: "50mm graphene drivers", body: "4 Hz – 40 kHz with zero audible distortion." },
    { part: "cupR", title: "Adaptive ANC", body: "12 mics cancel noise 48,000 times a second." },
    { part: "cushionL", title: "Memory foam", body: "Protein-leather cushions that cool as you wear them." },
    { part: "plateR", title: "Touch surface", body: "Swipe, tap and hold. Glows with your colourway." },
  ] satisfies Feature[],

  collection: [
    { id: "f1-obsidian", name: "Forge One", price: 349, colorway: "obsidian", tag: "Bestseller" },
    { id: "f1-solar", name: "Forge One", price: 349, colorway: "solar", tag: "New" },
    { id: "f1-glacier", name: "Forge One Air", price: 299, colorway: "glacier" },
    { id: "f1-venom", name: "Forge One Pro", price: 449, colorway: "venom", tag: "Limited" },
    { id: "f1-rose", name: "Forge One Lux", price: 529, colorway: "rose" },
    { id: "f1-obsidian-2", name: "Forge Studio", price: 599, colorway: "obsidian", tag: "Pro" },
  ] satisfies CollectionItem[],

  /** Scroll story. Order here is the order on the page; lengths drive timing for the 3D scenes. */
  sections: [
    { id: "hero", length: 3, eyebrow: "Introducing", title: "Forge One", body: "A galaxy of sound collapses into a single object. Scroll to assemble it.", align: "center" },
    { id: "explode", length: 4, eyebrow: "01 / Engineering", title: "Every part, on purpose.", body: "Fifty-two components, pulled apart so you can see what you are paying for.", align: "left" },
    { id: "configure", length: 4, eyebrow: "02 / Make it yours", title: "Pick your colourway.", body: "Keep scrolling to morph through every finish, or tap one below.", align: "right" },
    { id: "portal", length: 3, eyebrow: "03 / Enter", title: "Step through.", body: "The whole range is on the other side.", align: "center" },
    { id: "collection", length: 4, eyebrow: "04 / Collection", title: "The line-up.", body: "Six models, one obsession. Click any to add it to your cart.", align: "left" },
    { id: "physics", length: 3, eyebrow: "05 / Drop", title: "Fresh drops, weekly.", body: "Move your cursor to play with them.", align: "right" },
    { id: "checkout", length: 3, eyebrow: "06 / Yours", title: "Own the forge.", body: "Free shipping, 2-year warranty, 30-day returns.", align: "center" },
  ] satisfies SectionConfig[],
};

export type SiteConfig = typeof siteConfig;
