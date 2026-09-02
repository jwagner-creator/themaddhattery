import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HatBase, HatColorOption } from '@/data/hatDesign';
 
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
  show_on_event_builder: boolean;
  show_on_design_page: boolean;
}
 
export interface NewBaseInput {
  name: string;
  range: string;
  description: string;
  image: string;
  sizes: string[];
  colors?: HatColorOption[];
  show_on_event_builder?: boolean;
  show_on_design_page?: boolean;
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
 
const SELECT = 'id, name, range, description, image, sort_order, active, sizes, colors, show_on_event_builder, show_on_design_page';
 
// All hats from DB — for admin
export async function fetchCustomBaseRows(): Promise<CustomBaseRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as CustomBaseRow[];
}
 
// Hats for event builder (quote page)
export async function fetchEventBuilderBases(): Promise<HatBase[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .eq('active', true)
    .eq('show_on_event_builder', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as CustomBaseRow[]).map(rowToBase);
}
 
// Hats for design page (hat configurator)
export async function fetchDesignPageBases(): Promise<HatBase[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .eq('active', true)
    .eq('show_on_design_page', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as CustomBaseRow[]).map(rowToBase);
}
 
// Keep for backward compat
export async function fetchCustomBases(): Promise<HatBase[]> {
  return fetchEventBuilderBases();
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
      show_on_event_builder: input.show_on_event_builder ?? true,
      show_on_design_page: input.show_on_design_page ?? true,
    })
    .select(SELECT)
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
  patch: Partial<Pick<CustomBaseRow, 'name' | 'range' | 'description' | 'image' | 'sizes' | 'colors' | 'show_on_event_builder' | 'show_on_design_page' | 'active'>>
): Promise<boolean> {
  const { error } = await supabase.from(TABLE).update(patch).eq('id', id);
  return !error;
}
 
// Hook for design page
export function useHatBases() {
  const [bases, setBases] = useState<HatBase[]>([]);
  const [loading, setLoading] = useState(true);
 
  const load = useCallback(async () => {
    const bases = await fetchDesignPageBases();
    setBases(bases);
    setLoading(false);
  }, []);
 
  useEffect(() => {
    let active = true;
    fetchDesignPageBases().then(bases => {
      if (!active) return;
      setBases(bases);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
 
  return { bases, loading, reload: load };
}
