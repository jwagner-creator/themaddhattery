import { useEffect, useState } from 'react';
import { HAT_BASES, FEATURED_LOOKS } from '@/data/hatDesign';
import { supabase } from '@/lib/supabase';


export interface DesignSlot {
  key: string; // unique slot key, e.g. "base-western" or "look-bridal-boho"
  group: 'base' | 'look';
  label: string;
  defaultUrl: string;
}

const TABLE = 'design_image_overrides';

// The editable image "slots" on the custom design page. Derived from the
// shared hat data so it stays a single source of truth — every base hat and
// every featured look gets one swappable picture.
export const DESIGN_SLOTS: DesignSlot[] = [
  ...HAT_BASES.map((b) => ({
    key: `base-${b.id}`,
    group: 'base' as const,
    label: `Base hat — ${b.name}`,
    defaultUrl: b.image,
  })),
  ...FEATURED_LOOKS.map((l) => ({
    key: `look-${l.id}`,
    group: 'look' as const,
    label: `Featured look — ${l.name}`,
    defaultUrl: l.image,
  })),
];

export type DesignImageMap = Record<string, string>;

/** Fetch the saved image overrides as a { slotKey: url } map. */
export async function fetchDesignImages(): Promise<DesignImageMap> {
  const { data, error } = await supabase.from(TABLE).select('slot_key, url');
  if (error || !data) return {};
  const map: DesignImageMap = {};
  data.forEach((row: { slot_key: string; url: string }) => {
    if (row.slot_key && row.url) map[row.slot_key] = row.url;
  });
  return map;
}

/** Save (insert or replace) the override image for a slot. */
export async function saveDesignImage(slotKey: string, url: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ slot_key: slotKey, url, updated_at: new Date().toISOString() }, { onConflict: 'slot_key' });
  return !error;
}

/** Remove a slot's override so it falls back to its built-in default photo. */
export async function resetDesignImage(slotKey: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq('slot_key', slotKey);
  return !error;
}

/** Resolve a slot's image: use the saved override if present, else the default. */
export function resolveImage(map: DesignImageMap, slotKey: string, fallback: string): string {
  return (map && map[slotKey]) || fallback;
}

/**
 * React hook: loads the saved image overrides. Returns an empty map while
 * loading so callers immediately fall back to their default photos.
 */
export function useDesignImages() {
  const [images, setImages] = useState<DesignImageMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchDesignImages().then((m) => {
      if (!active) return;
      setImages(m);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { images, loading };
}


