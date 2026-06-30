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
