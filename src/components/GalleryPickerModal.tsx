import React, { useEffect, useState } from 'react';
import { listBucketPhotos, type BucketPhoto } from '@/lib/bucketImages';

interface GalleryPickerModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  /** Called with the chosen image URL. */
  onPick: (url: string) => void;
}

/**
 * A modal that shows every photo currently in the gallery (the hat-bar-images
 * bucket) so the owner can swap a design-page photo straight from the gallery
 * instead of uploading a new file.
 */
const GalleryPickerModal: React.FC<GalleryPickerModalProps> = ({
  open,
  title = 'Pick a photo from the gallery',
  onClose,
  onPick,
}) => {
  const [photos, setPhotos] = useState<BucketPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    listBucketPhotos().then((rows) => {
      if (!active) return;
      setPhotos(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const filtered = query.trim()
    ? photos.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : photos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-[#2a2018] border border-[#4a3c2e] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-[#4a3c2e]">
          <div>
            <h3 className="font-serif text-xl text-[#f3ead9]">{title}</h3>
            <p className="text-xs text-[#9a8d77] mt-1">
              Click any photo to use it. These are the photos in your gallery bucket.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#5a4a37] text-[#cbbfa9] text-sm px-4 py-2 hover:bg-[#3a2e22] transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="p-4 border-b border-[#4a3c2e]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter photos by file name…"
            className="w-full rounded-lg bg-[#1f1812] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-[#cbbfa9] text-center py-10">Loading gallery photos…</p>
          ) : filtered.length === 0 ? (
            <p className="text-[#cbbfa9] text-center py-10">
              {photos.length === 0
                ? 'No gallery photos found yet. Upload some on the Gallery photos page first.'
                : 'No photos match that search.'}
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((photo) => (
                <button
                  key={photo.name}
                  type="button"
                  onClick={() => {
                    onPick(photo.url);
                    onClose();
                  }}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-[#1f1812] border-2 border-transparent hover:border-[#c9a36a] transition-all"
                  title={photo.name}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    Use this photo
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryPickerModal;
