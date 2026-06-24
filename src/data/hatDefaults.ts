import { HAT_BASES, HatDesignState } from '@/data/hatDesign';

/** The default starting configuration for the hat designer. */
const WOOL_FELT_BASE = HAT_BASES.find((b) => b.id === 'wool-felt') ?? HAT_BASES[0];

export const DEFAULT_DESIGN: HatDesignState = {
  baseId: WOOL_FELT_BASE.id,
  colorId: WOOL_FELT_BASE.colors[0]?.id,
  sizeId: WOOL_FELT_BASE.sizes[0],
  bandId: 'leather',
  edgeId: 'none',
  chainId: 'none',
  personalization: [],
};
