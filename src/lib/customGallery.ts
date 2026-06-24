import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const TABLE = 'custom_gallery_designs';
const BUCKET = 'hat-bar-images';

export interface CustomDesign {
  id: string;
  src: string;
  title: string;
  note: string;
  position: number;
}

// Static fallback used if the table is empty/unavailable so the homepage
// gallery never renders blank. Photos of real customers wearing their
// custom-designed hats.
export const DEFAULT_DESIGNS: Omit<CustomDesign, 'id'>[] = [
  {
    src: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782099565906_8564e978.JPG',
    title: 'Smoke Grey Feathered Rancher',
    note: 'A customer styling her grey felt rancher with studded leather band & layered feathers.',
    position: 0,
  },
  {
    src: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782099615489_b96b9c8b.JPG',
    title: 'Burgundy Angel-Wing Western',
    note: 'Deep burgundy felt with painted feathers, charms & a silver angel-wing pin.',
    position: 1,
  },
  {
    src: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782099836961_3b3953bc.JPG',
    title: 'Camel Lace-Band Rancher',
    note: 'Soft camel felt with a woven aztec lace band & studded brim, worn in-booth.',
    position: 2,
  },
  {
    src: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782099903615_b114d1c8.JPG',
    title: 'Cherry Red Feather Flat-Brim',
    note: 'Vibrant red felt with burlap & leather band and a guinea-feather spray.',
    position: 3,
  },
  {
    src: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782100363970_01a79152.JPG',
    title: 'Distressed Turquoise Cattleman',
    note: 'Sand felt with burned distressing, denim band & turquoise stone bar.',
    position: 4,
  },
  {
    src: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782100364953_a86f166b.webp',
    title: 'Black Feathered Cattleman',
    note: 'Classic black felt with a tan band and a single statement feather.',
    position: 5,
  },
  {
    src: 'https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782100367718_7d83f831.JPG',
    title: 'Ivory Turquoise Bead Western',
    note: 'Crisp ivory straw with patterned band, black ribbon tails & turquoise beads.',
    position: 6,
  },
];

/** Fetch all custom designs in saved order. */
export async function fetchCustomDesigns(): Promise<CustomDesign[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, src, title, note, position')
    .order('position', { ascending: true });
  if (error || !data) return [];
  return data as CustomDesign[];
}

/** Upload an image file to the bucket and return its public URL. */
export async function uploadDesignImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const safe = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-_]/gi, '-')
    .toLowerCase();
  const name = `custom-${Date.now()}-${safe}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

/** Insert a new design at the end of the list. */
export async function addCustomDesign(
  src: string,
  title = '',
  note = ''
): Promise<CustomDesign | null> {
  const existing = await fetchCustomDesigns();
  const position = existing.length;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ src, title, note, position })
    .select('id, src, title, note, position')
    .single();
  if (error || !data) return null;
  return data as CustomDesign;
}

/** Update a design's editable fields (title, note, src). */
export async function updateCustomDesign(
  id: string,
  fields: Partial<Pick<CustomDesign, 'src' | 'title' | 'note'>>
): Promise<boolean> {
  const { error } = await supabase.from(TABLE).update(fields).eq('id', id);
  return !error;
}

/** Delete a design by id. */
export async function deleteCustomDesign(id: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return !error;
}

export interface ConvertResult {
  url: string;
  status: string;
  converted?: boolean;
  publicUrl?: string;
  galleryId?: string | null;
  detail?: string;
}

/** True for iPhone HEIC/HEIF files that browsers can't render. */
export function isHeicFile(file: File): boolean {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type.includes('heic') ||
    type.includes('heif')
  );
}

/** Upload any file (including HEIC) to the bucket and return its public URL. */
export async function uploadRawFile(file: File): Promise<string | null> {
  const rawExt = (file.name.split('.').pop() || 'bin').toLowerCase();
  const safe = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-_]/gi, '-')
    .toLowerCase();
  const name = `upload-${Date.now()}-${safe}.${rawExt}`;
  const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });
  if (error) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

/**
 * Send a list of (possibly HEIC) photo URLs to the edge function, which
 * decodes HEIC -> JPG, mirrors them into the hat-bar-images bucket, and
 * (by default) appends them as new gallery entries. Returns per-URL results.
 */
export async function convertHeicPhotos(
  photos: { url: string; title?: string; note?: string }[],
  addToGallery = true
): Promise<ConvertResult[]> {
  const { data, error } = await supabase.functions.invoke('mirror-gallery-images', {
    body: { photos, addToGallery },
  });
  if (error || !data?.results) return [];
  return data.results as ConvertResult[];
}

/**
 * Handle HEIC/HEIF files chosen directly from a device: upload each raw file
 * to the bucket, then run it through the edge function to convert to JPG and
 * append a new gallery entry. Returns the per-file conversion results.
 */
export async function convertHeicFiles(files: File[]): Promise<ConvertResult[]> {
  const photos: { url: string }[] = [];
  for (const file of files) {
    const url = await uploadRawFile(file);
    if (url) photos.push({ url });
  }
  if (photos.length === 0) return [];
  return convertHeicPhotos(photos, true);
}



/** Persist the given ordered list of ids as positions 0..n. */
export async function saveDesignOrder(ids: string[]): Promise<boolean> {
  const updates = await Promise.all(
    ids.map((id, i) => supabase.from(TABLE).update({ position: i }).eq('id', id))
  );
  return updates.every((u) => !u.error);
}

/**
 * React hook for the public gallery: returns DB designs if any exist,
 * otherwise the static defaults. `loading` is true while loading.
 */
export function useCustomDesigns() {
  const [designs, setDesigns] = useState<CustomDesign[]>(
    DEFAULT_DESIGNS.map((d, i) => ({ ...d, id: `default-${i}` }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCustomDesigns().then((rows) => {
      if (!active) return;
      if (rows.length > 0) setDesigns(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { designs, loading };
}
