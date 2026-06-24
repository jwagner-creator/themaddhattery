// Single source of truth for pricing a custom hat design.
// Computes the retail price from the selected base hat plus any personalization
// extras, and the deposit due to reserve the build with FamousPay.
import {
  HAT_BASES,
  PERSONALIZATION_OPTIONS,
  HatDesignState,
  type HatBase,
} from '@/data/hatDesign';

// Fraction of the total taken as a deposit to start the build.
export const HAT_DEPOSIT_RATE = 0.5;
// Never charge a deposit smaller than this (dollars).
export const HAT_DEPOSIT_MIN = 25;

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
  extras: HatPriceLine[];
  extrasTotal: number;
  total: number;
  deposit: number;
}

/** Compute the full price breakdown + deposit for a hat design. */
export function computeHatPricing(
  design: HatDesignState,
  bases: HatBase[] = HAT_BASES
): HatPricing {
  const base = bases.find((b) => b.id === design.baseId) || bases[0] || HAT_BASES[0];
  const basePrice = basePriceFor(base);

  const extras: HatPriceLine[] = PERSONALIZATION_OPTIONS.filter((p) =>
    design.personalization.includes(p.id)
  ).map((p) => ({ id: p.id, label: p.label, price: p.price }));

  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const total = basePrice + extrasTotal;
  const deposit = Math.max(
    HAT_DEPOSIT_MIN,
    Math.round(total * HAT_DEPOSIT_RATE)
  );

  return {
    base,
    baseName: base.name,
    basePrice,
    extras,
    extrasTotal,
    total,
    deposit,
  };
}
