// Single source of truth for pricing a custom hat design.
import {
  HAT_BASES,
  PERSONALIZATION_OPTIONS,
  BAND_LAYERS,
  EDGE_OPTIONS,
  CHAIN_OPTIONS,
  SIZE_OPTIONS,
  HatDesignState,
  type HatBase,
} from '@/data/hatDesign';

export const HAT_DEPOSIT_RATE = 0.5;
export const HAT_DEPOSIT_MIN = 25;

// ── Band / edge / chain base prices ──────────────────────────────────────
export const BAND_LAYER_PRICES: Record<string, number> = {
  fabric: 15,
  leather: 20,
  suede: 15,
  beaded: 25,
};

export const EDGE_PRICES: Record<string, number> = {
  'grommets-gold': 25,
  'grommets-black': 25,
  'grommets-silver': 25,
  branded: 25,
};

export const CHAIN_PRICES: Record<string, number> = {
  silver: 20,
  gold: 20,
  combo: 20,
};

export const PRICING_DISCLAIMER =
  'All add-on prices shown are starting prices and may vary based on the materials and complexity used in your final design.';

/** Parse the first dollar amount out of a range string like "$139" or "$25 – $50". */
export function parsePrice(range?: string): number {
  if (!range) return 0;
  const match = range.replace(/,/g, '').match(/\$\s*(\d+(?:\.\d+)?)/);
  return match ? Math.round(parseFloat(match[1])) : 0;
}

/** The fixed retail price (dollars) of a base hat. */
export function basePriceFor(base?: HatBase | null): number {
  if (!base) return 0;
  if (typeof base.price === 'number' && base.price > 0) return base.price;
  return parsePrice(base.range);
}

export interface HatPriceLine {
  id: string;
  label: string;
  price: number;
}

export interface HatPricing {
  base: HatBase;
  baseName: string;
  basePrice: number;
  sizeName: string;
  colorName: string;
  extras: HatPriceLine[];
  extrasTotal: number;
  total: number;
  deposit: number;
  disclaimer: string;
}

/** Compute the full price breakdown + deposit for a hat design. */
export function computeHatPricing(
  design: HatDesignState,
  bases: HatBase[] = HAT_BASES
): HatPricing {
  const base = bases.find((b) => b.id === design.baseId) || bases[0] || HAT_BASES[0];
  const basePrice = basePriceFor(base);

  // Size label
  const sizeOption = design.sizeId ? SIZE_OPTIONS[design.sizeId] : null;
  const sizeName = sizeOption ? sizeOption.name : (base.sizes?.includes('os') ? 'One Size' : '');

  // Color label
  const colorOption = design.colorId
    ? base.colors.find((c) => c.id === design.colorId)
    : null;
  const colorName = colorOption?.name || '';

  const extras: HatPriceLine[] = [];

  // Band layers pricing
  if (design.bandLayers) {
    Object.entries(design.bandLayers).forEach(([layerId, colorIds]) => {
      if (!colorIds || colorIds.length === 0) return;
      const layer = BAND_LAYERS.find((l) => l.id === layerId);
      const price = BAND_LAYER_PRICES[layerId] || 0;
      if (layer && price > 0) {
        const allColors = layer.groups.flatMap((g) => g.colors);
        const colorNames = colorIds
          .map((id) => allColors.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        extras.push({
          id: `band-${layerId}`,
          label: `${layer.name} band${colorNames ? ` (${colorNames})` : ''} — starting at $${price}`,
          price,
        });
      }
    });
  } else if (design.bandId && design.bandId !== 'no-band') {
    // Legacy single band
    const layer = BAND_LAYERS.find((l) => l.id === design.bandId);
    const price = BAND_LAYER_PRICES[design.bandId] || 0;
    if (layer && price > 0) {
      extras.push({
        id: `band-${design.bandId}`,
        label: `${layer.name} band — starting at $${price}`,
        price,
      });
    }
  }

  // Edge design pricing
  if (design.edgeId && design.edgeId !== 'none') {
    const edge = EDGE_OPTIONS.find((e) => e.id === design.edgeId);
    const price = EDGE_PRICES[design.edgeId] || 0;
    if (edge && price > 0) {
      extras.push({
        id: `edge-${design.edgeId}`,
        label: `${edge.name} — starting at $${price}`,
        price,
      });
    }
  }

  // Chain pricing
  if (design.chainId && design.chainId !== 'none') {
    const chain = CHAIN_OPTIONS.find((c) => c.id === design.chainId);
    const price = CHAIN_PRICES[design.chainId] || 0;
    if (chain && price > 0) {
      extras.push({
        id: `chain-${design.chainId}`,
        label: `${chain.name} — starting at $${price}`,
        price,
      });
    }
  }

  // Personalization options
  PERSONALIZATION_OPTIONS.filter((p) =>
    design.personalization.includes(p.id)
  ).forEach((p) => {
    extras.push({ id: p.id, label: p.label, price: p.price });
  });

  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const total = basePrice + extrasTotal;
  const deposit = Math.max(HAT_DEPOSIT_MIN, Math.round(total * HAT_DEPOSIT_RATE));

  return {
    base,
    baseName: base.name,
    basePrice,
    sizeName,
    colorName,
    extras,
    extrasTotal,
    total,
    deposit,
    disclaimer: PRICING_DISCLAIMER,
  };
}
