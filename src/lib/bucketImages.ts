import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'hat-bar-images';
const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const ORDER_TABLE = 'gallery_photo_order';

export interface BucketPhoto {
  name: string;
  url: string;
}

/**
 * Reads the saved photo order from the database.
 * Returns a map of file name -> position. Missing/unordered files fall
 * back to the end (alphabetical) when sorting.
 */
export async function fetchPhotoOrder(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from(ORDER_TABLE)
    .select('name, position')
    .order('position', { ascending: true });
  if (error || !data) return {};
  const map: Record<string, number> = {};
  data.forEach((row: { name: string; position: number }) => {
    map[row.name] = row.position;
  });
  return map;
}

/**
 * Persists the given ordered list of file names. Position is the array index.
 * Replaces the whole ordering table so deleted files are cleaned up.
 */
export async function savePhotoOrder(names: string[]): Promise<boolean> {
  // Remove existing rows, then insert the new order.
  await supabase.from(ORDER_TABLE).delete().neq('name', '');
  if (names.length === 0) return true;
  const rows = names.map((name, i) => ({ name, position: i }));
  const { error } = await supabase.from(ORDER_TABLE).insert(rows);
  return !error;
}

/**
 * Sorts a list of photos by the saved order map. Photos not present in the
 * map are appended in alphabetical order so newly-uploaded files still show up.
 */
export function sortByOrder(photos: BucketPhoto[], order: Record<string, number>): BucketPhoto[] {
  const has = (n: string) => Object.prototype.hasOwnProperty.call(order, n);
  return [...photos].sort((a, b) => {
    const aHas = has(a.name);
    const bHas = has(b.name);
    if (aHas && bHas) return order[a.name] - order[b.name];
    if (aHas) return -1; // ordered items first
    if (bHas) return 1;
    return a.name.localeCompare(b.name); // unordered → alphabetical
  });
}

/**
 * Lists every image file in the hat-bar-images bucket (optionally within a
 * folder) and returns them as { name, url }, sorted by the saved order.
 */
export async function listBucketPhotos(folder = ''): Promise<BucketPhoto[]> {
  const [{ data, error }, order] = await Promise.all([
    supabase.storage.from(BUCKET).list(folder, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    }),
    fetchPhotoOrder(),
  ]);

  if (error || !data) return [];

  const photos: BucketPhoto[] = data
    .filter((f) => f.name && IMAGE_RE.test(f.name))
    .map((f) => {
      const path = folder ? `${folder}/${f.name}` : f.name;
      return {
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      };
    });

  return sortByOrder(photos, order);
}

/**
 * Lists image URLs in saved order. Returns an empty array if the bucket is
 * empty or unavailable so callers can fall back to default images.
 */
export async function listBucketImages(folder = ''): Promise<string[]> {
  const photos = await listBucketPhotos(folder);
  return photos.map((p) => p.url);
}

/**
 * React hook: returns bucket image URLs (in saved order) if any exist,
 * otherwise the provided fallback list. `loading` is true while loading.
 */
export function useBucketImages(fallback: string[], folder = '') {
  const [images, setImages] = useState<string[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listBucketImages(folder).then((urls) => {
      if (!active) return;
      if (urls.length > 0) setImages(urls);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [folder]);

  return { images, loading };
}
