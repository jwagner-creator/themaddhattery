import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HAT_BASES, type HatBase, type HatColorOption } from '@/data/hatDesign';

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
  colors: HatColorOption[] | null;
}

export interface NewBaseInput {
  name: string;
  range: string;
  description: string;
  image: string;
  sizes: string[];
  colors?: HatColorOption[];
}

function rowToBase(row: CustomBaseRow): HatBase {
  return {
    id: row.id,
    name: row.name,
    tierId: '',
    range: row.range,
    image: row.image,
    description: row.description,
    colors: row.colors && row.colors.length > 0
      ? row.colors
      : [{ id: 'natural', name: 'Natural', color: '#d9c2a3' }],
    sizes: row.sizes && row.sizes.length > 0 ? row.sizes : ['os'],
  };
}

export async function fetchCustomBases(): Promise<HatBase[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, range, description, image, sort_order, active, sizes, colors')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as CustomBaseRow[]).map(rowToBase);
}

export async function fetchCustomBaseRows(): Promise<CustomBaseRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, range, description, image, sort_order, active, sizes, colors')
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
      colors: input.colors || [],
    })
    .select('id, name, range, description, image, sort_order, active, sizes, colors')
    .single();
  if (error || !data) return null;
  return data as CustomBaseRow;
}

export async function deleteCustomBase(id: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return !error;
}

export async function updateCustomBase(
  id: string,
  patch: Partial<Pick<CustomBaseRow, 'name' | 'range' | 'description' | 'image' | 'sizes' | 'colors'>>
): Promise<boolean> {
  const { error } = await supabase.from(TABLE).update(patch).eq('id', id);
  return !error;
}

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
    return () => { active = false; };
  }, []);

  return { bases, loading, reload: load };
}
