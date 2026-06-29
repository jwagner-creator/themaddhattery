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
  sizes: string[] | null;
}

export interface NewBaseInput {
  name: string;
  range: string;
  description: string;
  image: string;
  sizes: string[];
}

/** Convert a DB row into the shared HatBase shape used everywhere. */
function rowToBase(row: CustomBaseRow): HatBase {
  return {
    id: row.id,
    name: row.name,
    tierId: '',
    range: row.range,
    image: row.image,
    description: row.description,
    colors: [{ id: 'natural', name: 'Natural', color: '#d9c2a3' }],
    // Use sizes from DB if set, otherwise default to one-size
    sizes: row.sizes && row.sizes.length > 0 ? row.sizes : ['os'],
  };
}

/** Fetch all active custom bases (sorted) as HatBase objects. */
export async function fetchCustomBases(): Promise<HatBase[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, range, description, image, sort_order, active, sizes')
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
    .select('id, name, range, description, image, sort_order, active, sizes')
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
      sizes: input.sizes,
    })
    .select('id, name, range, description, image, sort_order, active, sizes')
    .single();
  if (error || !data) return null;
  return data as CustomBaseRow;
}

export async function deleteCustomBase(id: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return !error;
}

/** Update a single field on an existing custom base hat. */
export async function updateCustomBase(
  id: string,
  patch: Partial<Pick<CustomBaseRow, 'name' | 'range' | 'description' | 'image' | 'sizes'>>
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
