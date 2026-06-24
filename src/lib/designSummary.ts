// Shared helpers for turning a HatDesignState into human-readable labels and
// for saving / loading finished designs. Single source of truth so the
// configurator, save modal, and shareable summary page all agree.
import {
  HAT_BASES,
  BAND_OPTIONS,
  EDGE_OPTIONS,
  CHAIN_OPTIONS,
  PERSONALIZATION_OPTIONS,
  summarizeBandLayers,
  sizesForBase,
  HatDesignState,
} from '@/data/hatDesign';

export interface DesignSummary {
  baseName: string;
  baseRange: string;
  baseDescription: string;
  colorName: string;
  sizeName: string;
  bandName: string;
  edgeName: string;
  chainName: string;
  personalizationLabels: string[];
}

/** Resolve a raw design state into display-friendly labels.
 *  Pass a custom `bases` list (built-in + admin-added) so custom base hats
 *  resolve to their real name/range instead of falling back to the default. */
export function summarizeDesign(
  design: HatDesignState,
  bases: typeof HAT_BASES = HAT_BASES
): DesignSummary {
  const base = bases.find((b) => b.id === design.baseId) || HAT_BASES[0];
  const edge = EDGE_OPTIONS.find((e) => e.id === design.edgeId) || EDGE_OPTIONS[0];
  const chain = CHAIN_OPTIONS.find((c) => c.id === design.chainId) || CHAIN_OPTIONS[0];
  // Prefer the layered band description; fall back to the legacy single band.
  const bandLines = summarizeBandLayers(design.bandLayers);
  const legacyBand =
    BAND_OPTIONS.find((b) => b.id === design.bandId) || BAND_OPTIONS[0];
  const bandName = bandLines.length ? bandLines.join(' · ') : legacyBand.name;

  const color =
    base.colors.find((c) => c.id === design.colorId) || base.colors[0];
  const availableSizes = sizesForBase(base.id, bases);
  const size =
    availableSizes.find((s) => s.id === design.sizeId) || availableSizes[0];
  const personalizationLabels = PERSONALIZATION_OPTIONS.filter((p) =>
    design.personalization.includes(p.id)
  ).map((p) => p.label);

  return {
    baseName: base.name,
    baseRange: base.range,
    baseDescription: base.description,
    colorName: color?.name || '',
    sizeName: size?.name || '',
    bandName,

    edgeName: edge.name,
    chainName: chain.name,
    personalizationLabels,
  };
}
