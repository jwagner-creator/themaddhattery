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

export const SIZE_OPTIONS: Record<string, SizeOption> = {
  os: { id: 'os', name: 'O/S — One Size' },
  'sm-md': { id: 'sm-md', name: 'S/M' },
  'lg-xl': { id: 'lg-xl', name: 'L/XL' },
  s: { id: 's', name: 'S' },
  m: { id: 'm', name: 'M' },
  l: { id: 'l', name: 'L' },
  xl: { id: 'xl', name: 'XL' },
};

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
  tierId: string;
  range: string;
  price?: number;
  image: string;
  description: string;
  colors: HatColorOption[];
  sizes: string[];
}

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
      { id: 'black', name: 'Black', color: '#1c1c1c', image:
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
  color: string;
}

export const BAND_OPTIONS: SwatchOption[] = [
  { id: 'no-band', name: 'No band', color: 'transparent' },
  { id: 'fabric', name: 'Fabric band', color: '#b89b74' },
  { id: 'beaded', name: 'Beaded band', color: '#2f9e9e' },
  { id: 'leather', name: 'Leather band', color: '#6b4423' },
];

export interface BandLayerColor {
  id: string;
  name: string;
  color: string;
}

export interface BandLayerGroup {
  label?: string;
  colors: BandLayerColor[];
}

export interface BandLayerType {
  id: string;
  name: string;
  blurb: string;
  multi?: boolean;
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

export const EDGE_OPTIONS: SwatchOption[] = [
  { id: 'none', name: 'No edge design', color: 'transparent' },
  { id: 'grommets-gold', name: 'Grommets — Gold', color: '#c9a227' },
  { id: 'grommets-black', name: 'Grommets — Black', color: '#1c1c1c' },
  { id:
