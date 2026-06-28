// Single source of truth for the "Design your own custom hat" configurator.


export interface HatColorOption {
  id: string;
  name: string;
  color: string; // CSS color for the swatch
  image?: string; // optional product photo of this color option
}


// ── Sizing ─────────────────────────────────────────────────────────────────
export interface SizeOption {
  id: string;
  name: string; // short label shown on the size button (e.g. "S/M", "O/S")
}

// Registry of every selectable size value. Each base lists which ids it offers.
export const SIZE_OPTIONS: Record<string, SizeOption> = {
  os: { id: 'os', name: 'O/S — One Size' },
  'sm-md': { id: 'sm-md', name: 'S/M' },
  'lg-xl': { id: 'lg-xl', name: 'L/XL' },
  s: { id: 's', name: 'S' },
  m: { id: 'm', name: 'M' },
  l: { id: 'l', name: 'L' },
  xl: { id: 'xl', name: 'XL' },
};

// Measurement chart shown alongside the size picker.
export interface SizeChartRow {
  size: string;
  cm: string;
  inches: string;
}

export const SIZE_CHART: SizeChartRow[] = [
  { size: 'SM', cm: '54cm – 55cm', inches: '6 7⁄8 inches' },
  { size: 'MD', cm: '56cm – 57cm', inches: '7 1⁄8 inches' },
  { size: 'LG', cm: '58cm – 59cm', inches: '7 3⁄8 inches' },
  { size: 'XL', cm: '60cm – 61cm', inches: '7 5⁄8 inches' },
];

export interface HatBase {
  id: string;
  name: string;
  tierId: string; // maps to a BUDGET_TIERS entry
  range: string;
  price?: number; // fixed retail price in dollars (parsed from range when omitted)
  image: string;
  description: string;
  colors: HatColorOption[];
  // Ordered list of size option ids (keys of SIZE_OPTIONS) this base is offered in.
  sizes: string[];
}



// Base hat styles for the "Design your own custom hat" configurator.
// These are a distinct retail offering from the hat-bar budget tiers — each has
// a fixed price and its own set of available colors.
export const HAT_BASES: HatBase[] = [
  {
    id: 'western',
    name: 'Western Straw',
    tierId: 'tier-1',
    range: '$35',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782016199195_3f921bf0.jpg',
    description: 'A fun, ready-to-style western straw hat — the perfect blank canvas.',
    colors: [
      { id: 'natural', name: 'Natural', color: '#d9c2a3' },
    ],
    sizes: ['os'],

  },
  {
    id: 'straw',
    name: 'Flatbrim Faux Suede',
    tierId: 'tier-2',
    range: '$35',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782016231669_ad74abeb.JPG',
    description: 'Soft flatbrim faux suede with a refined, lightweight feel.',
    colors: [
      { id: 'ivory', name: 'Ivory', color: '#f5f0e6' },
      { id: 'grey', name: 'Grey', color: '#9c9a96', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782059410009_1ea947ea.jpg' },
      { id: 'black', name: 'Black', color: '#1c1c1c', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782059401624_bed70152.jpg' },
    ],
    sizes: ['os'],


  },
  {
    id: 'premium',
    name: 'Faux Suede Western',
    tierId: 'tier-3',
    range: '$77',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782016252200_dc55aa76.jpg',
    description: 'A western-shaped faux suede hat with elevated shaping and feel.',
    colors: [
      { id: 'tan', name: 'Tan', color: '#c9a87c' },
      { id: 'pink', name: 'Pink', color: '#e8a7b8', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782059637355_16814df6.webp' },
      { id: 'black', name: 'Black', color: '#1c1c1c', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782059638005_250ff90d.webp' },
    ],
    sizes: ['sm-md', 'lg-xl'],


  },

  {
    id: 'wool-felt',
    name: 'Australian Wool Felt Flat Brim',
    tierId: 'tier-4',
    range: '$139',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782191254986_a026dd83.jpg',
    description: 'Premium Western Australian wool felt in a flat-brim shape — a refined canvas for branding, burning & shaping.',
    colors: [
      { id: 'cream', name: 'Cream', color: '#ece2d4', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782191254986_a026dd83.jpg' },
      { id: 'grey', name: 'Grey', color: '#8a8580', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782191255698_dcf9e043.jpg' },
      { id: 'taupe', name: 'Taupe', color: '#8a7d68', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782191256172_d16d32a0.jpg' },
    ],
    sizes: ['s', 'm', 'l', 'xl'],
  },
  {
    id: 'wool-felt-western',
    name: 'Wool Felt Western',
    tierId: 'tier-3',
    range: '$77',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782188969448_645eb195.jpg',
    description: 'Wool felt in a classic western shape — a versatile canvas for branding, burning & shaping.',
    colors: [
      { id: 'grey', name: 'Grey', color: '#8a8580', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782188969448_645eb195.jpg' },
      { id: 'white', name: 'White / Cream', color: '#f0ebe1', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782188970286_8a8738ff.jpg' },
      { id: 'black', name: 'Black', color: '#1c1c1c', image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782188970616_182a5167.jpg' },
    ],
    sizes: ['s', 'm', 'l', 'xl'],
  },

];



export interface SwatchOption {
  id: string;
  name: string;
  color: string; // CSS color for the swatch
}

// ── Hat bands ─────────────────────────────────────────────────────────────
// Legacy single-band options (kept for featured looks, saved designs, summary).
export const BAND_OPTIONS: SwatchOption[] = [
  { id: 'no-band', name: 'No band', color: 'transparent' },
  { id: 'fabric', name: 'Fabric band', color: '#b89b74' },
  { id: 'beaded', name: 'Beaded band', color: '#2f9e9e' },
  { id: 'leather', name: 'Leather band', color: '#6b4423' },
];

// ── Layered band builder ───────────────────────────────────────────────────
// Guests can stack multiple band layers (fabric, leather, suede, beaded). Each
// layer offers its own set of color / print choices. Single layers select one
// option; the beaded layer is multi-select.
export interface BandLayerColor {
  id: string;
  name: string;
  color: string; // CSS color (solid or gradient) for the swatch
}

export interface BandLayerGroup {
  label?: string; // optional sub-heading e.g. "Solids" / "Prints"
  colors: BandLayerColor[];
}

export interface BandLayerType {
  id: string;
  name: string;
  blurb: string;
  multi?: boolean; // true => can pick more than one color (beaded)
  groups: BandLayerGroup[];
}

export const BAND_LAYERS: BandLayerType[] = [
  {
    id: 'fabric',
    name: 'Fabric',
    blurb: 'Soft fabric wrap in a solid color or a printed pattern.',
    groups: [
      {
        label: 'Solids',
        colors: [
          { id: 'black', name: 'Black', color: '#1c1c1c' },
          { id: 'white', name: 'White', color: '#f7f4ee' },
          { id: 'cream', name: 'Cream', color: '#efe6d2' },
          { id: 'tan', name: 'Tan', color: '#c9a87c' },
          { id: 'gold', name: 'Gold', color: '#c9a227' },
        ],
      },
      {
        label: 'Prints — more options available',
        colors: [
          { id: 'floral', name: 'Floral', color: 'linear-gradient(135deg,#d98ca0 0%,#8aa98a 100%)' },
          { id: 'bandana', name: 'Bandana', color: 'linear-gradient(135deg,#b23a3a 0%,#2a2018 100%)' },
          { id: 'western', name: 'Western', color: 'linear-gradient(135deg,#8a5a2b 0%,#d9c2a3 100%)' },
          { id: 'boho', name: 'Boho', color: 'linear-gradient(135deg,#c08552 0%,#5a7d7c 100%)' },
          { id: 'vintage', name: 'Vintage', color: 'linear-gradient(135deg,#9c8c70 0%,#cbbfa9 100%)' },
        ],
      },
    ],
  },
  {
    id: 'leather',
    name: 'Leather',
    blurb: 'Genuine leather band layer.',
    groups: [
      {
        colors: [
          { id: 'black', name: 'Black', color: '#1c1c1c' },
          { id: 'brown', name: 'Brown', color: '#6b4423' },
          { id: 'grey', name: 'Grey', color: '#9c9a96' },
          { id: 'white', name: 'White', color: '#f1ece2' },
        ],
      },
    ],
  },
  {
    id: 'suede',
    name: 'Suede',
    blurb: 'Plush suede band layer in a wide range of colors.',
    groups: [
      {
        colors: [
          { id: 'black', name: 'Black', color: '#1c1c1c' },
          { id: 'brown', name: 'Brown', color: '#6b4423' },
          { id: 'tan', name: 'Tan', color: '#c9a87c' },
          { id: 'blue', name: 'Blue', color: '#3f5f8a' },
          { id: 'teal', name: 'Teal', color: '#2f9e9e' },
          { id: 'pink', name: 'Pink', color: '#e8a7b8' },
          { id: 'green', name: 'Green', color: '#5a7d4f' },
          { id: 'grey', name: 'Grey', color: '#9c9a96' },
          { id: 'yellow', name: 'Yellow', color: '#e3c349' },
          { id: 'orange', name: 'Orange', color: '#d98032' },
          { id: 'white', name: 'White', color: '#f1ece2' },
        ],
      },
    ],
  },
  {
    id: 'beaded',
    name: 'Beaded',
    blurb: 'Hand-beaded band — pick more than one color to mix.',
    multi: true,
    groups: [
      {
        colors: [
          { id: 'turquoise', name: 'Turquoise', color: '#2fb7c0' },
          { id: 'brown', name: 'Brown', color: '#6b4423' },
          { id: 'black', name: 'Black', color: '#1c1c1c' },
          { id: 'white', name: 'White', color: '#f1ece2' },
          { id: 'natural', name: 'Natural', color: '#d9c2a3' },
          { id: 'gold', name: 'Gold', color: '#c9a227' },
          { id: 'silver', name: 'Silver', color: '#c0c0c0' },
          { id: 'red', name: 'Red', color: '#b23a3a' },
          { id: 'green', name: 'Green', color: '#5a7d4f' },
          { id: 'yellow', name: 'Yellow', color: '#e3c349' },
          { id: 'blue', name: 'Blue', color: '#3f5f8a' },
        ],
      },
    ],
  },
];

/** Human-readable lines describing the selected band layers. */
export function summarizeBandLayers(
  bandLayers?: Record<string, string[]>
): string[] {
  if (!bandLayers) return [];
  return BAND_LAYERS.flatMap((layer) => {
    const picked = bandLayers[layer.id];
    if (!picked || picked.length === 0) return [];
    const allColors = layer.groups.flatMap((g) => g.colors);
    const names = picked
      .map((id) => allColors.find((c) => c.id === id)?.name)
      .filter(Boolean);
    if (names.length === 0) return [];
    return [`${layer.name}: ${names.join(', ')}`];
  });
}


// ── Edge design ───────────────────────────────────────────────────────────
// Grommets (Gold, Black, Silver) or branded edges.
export const EDGE_OPTIONS: SwatchOption[] = [
  { id: 'none', name: 'No edge design', color: 'transparent' },
  { id: 'grommets-gold', name: 'Grommets — Gold', color: '#c9a227' },
  { id: 'grommets-black', name: 'Grommets — Black', color: '#1c1c1c' },
  { id: 'grommets-silver', name: 'Grommets — Silver', color: '#c0c0c0' },
  { id: 'branded', name: 'Branded edges', color: '#7a4a22' },
];

// ── Chain ─────────────────────────────────────────────────────────────────
// Silver, Gold, or a combo.
export const CHAIN_OPTIONS: SwatchOption[] = [
  { id: 'none', name: 'No chain', color: 'transparent' },
  { id: 'silver', name: 'Silver chain', color: '#c0c0c0' },
  { id: 'gold', name: 'Gold chain', color: '#c9a227' },
  { id: 'combo', name: 'Silver & gold combo', color: '#b8945f' },
];

// Backwards-compatible alias — older code/data may still reference accents.
// Edge design replaces the previous "accent" step.
export const ACCENT_OPTIONS = EDGE_OPTIONS;

// Personalization / extras for the finished hat.
export interface PersonalizationOption {
  id: string;
  label: string;
  detail: string;
  price: number; // starting price in dollars added to the hat total
}

export const PERSONALIZATION_OPTIONS: PersonalizationOption[] = [
  { id: 'branding', label: 'Personalized branding starts at $25', detail: 'Your logo or initials branded into the hat', price: 25 },
  { id: 'cards-matches', label: 'Playing card $5', detail: 'Tucked playing card accent', price: 5 },
  { id: 'retro-matches', label: 'Retro matches $10', detail: 'Vintage retro matchbook accent', price: 10 },
  { id: 'charms-pins', label: 'Charms & pins starting at $5', detail: 'Hand-picked charms and enamel pins', price: 5 },
  { id: 'burning', label: 'Burning/distressing & branded edges $25', detail: 'Hand-burned, distressed & branded edges', price: 25 },
  { id: 'western-bend', label: 'Western bend Wool Felts only $25', detail: 'Shaped western bend — wool felt only', price: 25 },
  { id: 'hand-painted', label: 'Hand painted design starting at $40', detail: 'Custom hand-painted artwork', price: 40 },
];


export interface HatDesignState {
  baseId: string;
  colorId?: string; // selected color for the chosen base hat
  sizeId?: string; // selected size (id from SIZE_OPTIONS) for the chosen base hat
  bandId: string; // legacy single-band id (kept for featured looks / saved designs)
  // Layered band builder: map of layer id (fabric/leather/suede/beaded) -> selected color ids.
  bandLayers?: Record<string, string[]>;
  edgeId: string; // edge design (grommets / branded)
  chainId: string; // chain option
  personalization: string[];
}



/** Helper: the size option objects available for a given base id. */
export function sizesForBase(
  baseId: string,
  bases: HatBase[] = HAT_BASES
): SizeOption[] {
  const base = bases.find((b) => b.id === baseId);
  const ids = base?.sizes && base.sizes.length ? base.sizes : ['os'];
  return ids.map((id) => SIZE_OPTIONS[id]).filter(Boolean);
}



// Pre-made templates guests can load into the configurator.
export interface FeaturedLook {
  id: string;
  name: string;
  tagline: string;
  image: string;
  description?: string; // longer custom-design blurb
  material?: string; // e.g. "Australian Wool Felt $139"
  totalCost?: string; // e.g. "Total cost with this detailing $325-$425"
  design: HatDesignState;
}

export const FEATURED_LOOKS: FeaturedLook[] = [
  {
    id: 'frio-inbetween',
    name: 'Frio "In Between"',
    tagline: 'Painted river scene with burned lettering on a wide flatbrim.',
    image: 'https://jbgcpamchxdazezunlgz.databasepad.com/storage/v1/object/public/hat-bar-images/mirror-6834789ecdd892bd5a829aa2_1782018453798_11ef9bc9.JPG',
    description:
      'This is a custom design for the Inn Between owner. We can paint any scene and brand with your logo.',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'leather',
      edgeId: 'branded',
      chainId: 'none',
      personalization: ['branding'],
    },
  },
  {
    id: 'distressed-outlaw',
    name: 'Distressed Outlaw',
    tagline: 'Weathered charcoal felt with layered ribbon band & bullet pin.',
    image: 'https://jbgcpamchxdazezunlgz.databasepad.com/storage/v1/object/public/hat-bar-images/mirror-6834789ecdd892bd5a829aa2_1782018455374_c60d0c0f.JPG',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'leather',
      edgeId: 'grommets-black',
      chainId: 'none',
      personalization: ['burning', 'charms-pins'],
    },
  },
  {
    id: 'lavender-smoke',
    name: 'Lavender Smoke',
    tagline: 'Smoky lilac wash with frayed silk band & painted feathers.',
    image: 'https://jbgcpamchxdazezunlgz.databasepad.com/storage/v1/object/public/hat-bar-images/mirror-6834789ecdd892bd5a829aa2_1782018455922_6aff6b00.JPG',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'fabric',
      edgeId: 'none',
      chainId: 'none',
      personalization: [],
    },

  },
  {
    id: 'golden-spikes',
    name: 'Golden Spikes',
    tagline: 'Ivory felt with a fan of polished gold spikes & chain band.',
    image: 'https://jbgcpamchxdazezunlgz.databasepad.com/storage/v1/object/public/hat-bar-images/mirror-6834789ecdd892bd5a829aa2_1782018456659_88fc15e2.JPG',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'leather',
      edgeId: 'grommets-gold',
      chainId: 'gold',
      personalization: [],
    },

  },
  {
    id: 'burned-bend-rancher',
    name: 'Burned Bend Rancher',
    tagline: 'Grey wool felt with feathers, shell pin & a hand-burned brim edge.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782066681487_58bf2e96.jpg',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'leather',
      edgeId: 'branded',
      chainId: 'none',
      personalization: ['burning', 'western-bend', 'charms-pins'],
    },
  },
  {
    id: 'silver-studded',
    name: 'Silver Studded Cattleman',
    tagline: 'Pale grey felt with silver chain band & polished brim studs.',
    image: 'https://jbgcpamchxdazezunlgz.databasepad.com/storage/v1/object/public/hat-bar-images/mirror-6834789ecdd892bd5a829aa2_1782018491213_f197d64f.JPG',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'leather',
      edgeId: 'grommets-silver',
      chainId: 'silver',
      personalization: [],
    },

  },
  {
    id: 'fringe-faux-western',
    name: 'Flat Brim Faux Suede',
    tagline: 'Cream faux suede flat brim with a woven gold chain band.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782066606752_ab904cc7.jpg',
    material: 'Flatbrim Faux Suede $35',
    totalCost: 'Total cost with this detailing $65 - $165',
    design: {
      baseId: 'straw',
      bandId: 'leather',
      edgeId: 'none',
      chainId: 'gold',
      personalization: ['charms-pins'],
    },

  },
  {
    id: 'western-straw-classic',
    name: 'Western Straw Classic',
    tagline: 'Natural western straw with a longhorn concho, retro matches, Texas ribbon & feather.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782068426713_eba703d6.jpg',
    material: 'Western Straw $77',
    totalCost: 'Total cost with this detailing $125 - $165',
    design: {
      baseId: 'western',
      bandId: 'fabric',
      edgeId: 'none',
      chainId: 'none',
      personalization: ['charms-pins', 'cards-matches'],
    },
  },
  {
    id: 'flatbrim-faux-clean',
    name: 'Flatbrim Faux Suede',
    tagline: 'Ombré faux suede with frayed silk band, pearls, gold chain, painted feather & Queen card.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782068013446_ae340694.JPEG',
    material: 'Flatbrim Faux Suede $35',
    totalCost: 'Total cost with this detailing $65 - $165',
    design: {
      baseId: 'straw',
      bandId: 'fabric',
      edgeId: 'none',
      chainId: 'gold',
      personalization: ['cards-matches'],
    },
  },
  {
    id: 'leopard-faux-western',
    name: 'Hand-Painted Leopard',
    tagline: 'Cream faux suede western with a hand-painted leopard print brim — bold & one-of-a-kind.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782068055610_43a3e5a3.JPG',
    material: 'Faux Suede Western $77',
    totalCost: 'Total cost with this detailing $125 - $195',
    design: {
      baseId: 'premium',
      bandId: 'no-band',
      edgeId: 'none',
      chainId: 'none',
      personalization: ['burning'],
    },
  },
  {
    id: 'turquoise-fringe-flatbrim',
    name: 'Turquoise Fringe Flat-Brim',
    tagline: 'Hand-painted ombré crown with cut leather fringe brim & spike studs.',
    image: 'https://jbgcpamchxdazezunlgz.databasepad.com/storage/v1/object/public/hat-bar-images/mirror-6834789ecdd892bd5a829aa2_1782017401135_c12a8965.JPG',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'leather',
      edgeId: 'grommets-silver',
      chainId: 'silver',
      personalization: ['burning', 'charms-pins'],
    },
  },
  {
    id: 'desert-marble-burgundy',
    name: 'Desert Marble Burgundy',
    tagline: 'Marbled paint finish with a burgundy & lace band, pearls and a feather burst.',
    image: 'https://jbgcpamchxdazezunlgz.databasepad.com/storage/v1/object/public/hat-bar-images/mirror-6834789ecdd892bd5a829aa2_1782017409933_0ab130f7.webp',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'fabric',
      edgeId: 'none',
      chainId: 'none',
      personalization: ['charms-pins'],
    },
  },
  {
    id: 'plum-pressed-flowers',
    name: 'Plum Pressed Bloom',
    tagline: 'Distressed plum wool felt with a burlap band, fabric flowers, gold chain & branded initials.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782099015450_4bdb2a22.jpg',
    description:
      'A soft plum Australian wool felt hand-distressed for a worn, vintage feel. Finished with a raw burlap band, hand-set fabric roses, gold chain and branded initials.',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'fabric',
      edgeId: 'none',
      chainId: 'gold',
      personalization: ['burning', 'charms-pins', 'branding'],
    },
  },
  {
    id: 'painted-feathers-rancher',
    name: 'Painted Feathers Rancher',
    tagline: 'Burned ivory wool felt with hand-painted feathers trailing across the brim & gold chain band.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782099016298_3e2122a4.jpg',
    description:
      'Ivory Australian wool felt with a smoky burned crown and a fan of hand-painted feathers drifting across the brim. Finished with a suede band and delicate gold chain.',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'leather',
      edgeId: 'none',
      chainId: 'gold',
      personalization: ['burning', 'hand-painted'],
    },
  },
  {
    id: 'painted-hummingbird',
    name: 'Painted Hummingbird',
    tagline: 'Hand-painted hummingbird on ivory wool felt with a vintage script band & burned brim edge.',
    image: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782099016661_1173f772.jpg',
    description:
      'Ivory Australian wool felt featuring a soft hand-painted hummingbird, wrapped with a vintage French-script band, gold chain and a hand-burned zigzag brim edge.',
    material: 'Australian Wool Felt $139',
    totalCost: 'Total cost with this detailing $325 - $425',
    design: {
      baseId: 'wool-felt',
      bandId: 'fabric',
      edgeId: 'branded',
      chainId: 'gold',
      personalization: ['hand-painted', 'burning'],
    },
  },
];


