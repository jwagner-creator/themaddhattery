// Lets the store owner ADD brand-new base hats (beyond the built-in ones) from
// the admin photo manager. Custom bases live in the design_bases table and are
// merged with the hardcoded HAT_BASES so the configurator shows everything.
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HAT_BASES, type HatBase } from '@/data/hatDesign';

const TABLE = 'design_bases';

export interface CustomBaseRow {
  id: string;
  name: string;
  range: string;
  description: string;
  image: string;
  sort_order: number;
  active: boolean;
}

export interface NewBaseInput {
  name: string;
  range: string;
  description: string;
  image: string;
}

/** Convert a DB row into the shared HatBase shape used everywhere. */
function rowToBase(row: CustomBaseRow): HatBase {
  return {
    id: row.id,
    name: row.name,
    // Custom bases aren't tied to a budget tier; keep an empty tierId so the
    // estimate falls back gracefully (the range string is what guests see).
    tierId: '',
    range: row.range,
    image: row.image,
    description: row.description,
    // Custom bases have no preset color list; default to a neutral natural.
    colors: [{ id: 'natural', name: 'Natural', color: '#d9c2a3' }],
    // Custom bases default to a single one-size offering.
    sizes: ['os'],
  };
}

/** Fetch all active custom bases (sorted) as HatBase objects. */
export async function fetchCustomBases(): Promise<HatBase[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, range, description, image, sort_order, active')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as CustomBaseRow[]).map(rowToBase);
}

/** Fetch raw rows (for the admin list — includes inactive). */
export async function fetchCustomBaseRows(): Promise<CustomBaseRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, range, description, image, sort_order, active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as CustomBaseRow[];
}

export async function addCustomBase(input: NewBaseInput): Promise<CustomBaseRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: input.name,
      range: input.range,
      description: input.description,
      image: input.image,
    })
    .select('id, name, range, description, image, sort_order, active')
    .single();
  if (error || !data) return null;
  return data as CustomBaseRow;
}

export async function deleteCustomBase(id: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return !error;
}

/** Update a single field (e.g. the photo) on an existing custom base hat. */
export async function updateCustomBase(
  id: string,
  patch: Partial<Pick<CustomBaseRow, 'name' | 'range' | 'description' | 'image'>>
): Promise<boolean> {
  const { error } = await supabase.from(TABLE).update(patch).eq('id', id);
  return !error;
}


/**
 * React hook: returns the full list of base hats (built-in + any custom ones
 * the owner added). Built-ins come first so existing designs keep working.
 */
export function useHatBases() {
  const [bases, setBases] = useState<HatBase[]>(HAT_BASES);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const custom = await fetchCustomBases();
    setBases([...HAT_BASES, ...custom]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    fetchCustomBases().then((custom) => {
      if (!active) return;
      setBases([...HAT_BASES, ...custom]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { bases, loading, reload: load };
}
