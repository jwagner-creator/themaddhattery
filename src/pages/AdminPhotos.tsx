import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  fetchPhotoOrder,
  savePhotoOrder,
  sortByOrder,
  type BucketPhoto,
} from '@/lib/bucketImages';

const BUCKET = 'hat-bar-images';
const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const SHOWN_COUNT = 8;

const AdminPhotos: React.FC = () => {
  const [photos, setPhotos] = useState<BucketPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Index of the photo currently being dragged for reordering
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !data) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    const list: BucketPhoto[] = data
      .filter((f) => f.name && IMAGE_RE.test(f.name))
      .map((f) => ({
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
      }));
    const order = await fetchPhotoOrder();
    setPhotos(sortByOrder(list, order));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Persist the current on-screen order to the database
  const persistOrder = useCallback(async (ordered: BucketPhoto[]) => {
    setSaving(true);
    const ok = await savePhotoOrder(ordered.map((p) => p.name));
    setSaving(false);
    if (!ok) flash('err', 'Could not save the new order. Please try again.');
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (arr.length === 0) {
        flash('err', 'Please choose image files (jpg, png, webp, etc).');
        return;
      }
      setUploading(true);
      const newNames: string[] = [];
      for (const file of arr) {
        const ext = file.name.split('.').pop() || 'jpg';
        const safe = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-z0-9-_]/gi, '-')
          .toLowerCase();
        const name = `${Date.now()}-${safe}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (!error) newNames.push(name);
      }
      setUploading(false);
      if (newNames.length > 0) {
        flash('ok', `Uploaded ${newNames.length} photo${newNames.length > 1 ? 's' : ''}.`);
        // Append new photos to the END of the existing order and persist
        const appended: BucketPhoto[] = [
          ...photos,
          ...newNames.map((name) => ({
            name,
            url: supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl,
          })),
        ];
        setPhotos(appended);
        await persistOrder(appended);
      } else {
        flash('err', 'Upload failed. Please try again.');
      }
    },
    [photos, persistOrder]
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDropUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Ignore internal reorder drags (which carry no files)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const remove = async (name: string) => {
    if (!confirm('Remove this photo from your site?')) return;
    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) {
      flash('err', 'Could not delete photo.');
      return;
    }
    flash('ok', 'Photo removed.');
    const next = photos.filter((x) => x.name !== name);
    setPhotos(next);
    await persistOrder(next);
  };

  // ---- Drag-and-drop reordering ----
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Mark as an internal reorder so the upload zone ignores it
    e.dataTransfer.setData('text/x-reorder', String(index));
  };

  const handleDragOverItem = (index: number) => (e: React.DragEvent) => {
    if (dragIndex.current === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) setOverIndex(index);
  };

  const handleDropItem = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from === null || from === index) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      persistOrder(next);
      return next;
    });
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setOverIndex(null);
  };

  // Move buttons (accessible alternative to drag for touch devices)
  const move = (index: number, dir: -1 | 1) => {
    setPhotos((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      persistOrder(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#1f1812] text-[#f3ead9]">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-2">Photo Manager</p>
            <h1 className="font-serif text-3xl sm:text-4xl">Your hat gallery photos</h1>
            <p className="mt-2 text-[#cbbfa9] max-w-xl">
              Drag photos to reorder them. The first {SHOWN_COUNT} appear in your live gallery, with
              the very first photo used as the hero image. Your order is saved automatically.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors"
            >
              View site
            </Link>
            <Link
              to="/admin/design"
              className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors"
            >
              Design page photos
            </Link>
            <Link
              to="/admin"
              className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors"
            >
              Bookings
            </Link>
          </div>

        </div>

        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              message.type === 'ok'
                ? 'bg-green-900/40 text-green-200 border border-green-700/40'
                : 'bg-red-900/40 text-red-200 border border-red-700/40'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            // Only show the upload highlight for file drags, not reorder drags
            if (dragIndex.current !== null) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDropUpload}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors mb-10 ${
            dragOver
              ? 'border-[#c9a36a] bg-[#2a2018]'
              : 'border-[#5a4a37] bg-[#241c14] hover:border-[#c9a36a]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPick}
            className="hidden"
          />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#c9a36a] text-[#2a2018]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="font-semibold text-lg">
            {uploading ? 'Uploading…' : 'Click to upload or drag photos here'}
          </p>
          <p className="text-sm text-[#cbbfa9] mt-1">JPG, PNG, or WEBP — you can select several at once</p>
        </div>

        {/* Gallery */}
        {loading ? (
          <p className="text-[#cbbfa9]">Loading your photos…</p>
        ) : photos.length === 0 ? (
          <p className="text-[#cbbfa9]">No photos yet. Upload some above to fill your gallery.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-serif text-2xl">
                {photos.length} photo{photos.length > 1 ? 's' : ''}
              </h2>
              <div className="flex items-center gap-4">
                {saving && <span className="text-xs text-[#c9a36a]">Saving order…</span>}
                <button onClick={load} className="text-sm text-[#c9a36a] hover:underline">
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {photos.map((photo, i) => {
                const shown = i < SHOWN_COUNT;
                const isOver = overIndex === i;
                return (
                  <div
                    key={photo.name}
                    draggable
                    onDragStart={handleDragStart(i)}
                    onDragOver={handleDragOverItem(i)}
                    onDrop={handleDropItem(i)}
                    onDragEnd={handleDragEnd}
                    className={`group relative rounded-2xl overflow-hidden bg-[#3a2e22] aspect-square cursor-grab active:cursor-grabbing transition-all ${
                      isOver ? 'ring-4 ring-[#c9a36a] scale-[0.97]' : ''
                    } ${shown ? '' : 'opacity-70'}`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      loading="lazy"
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Position badge */}
                    <span className="absolute top-2 left-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/60 px-2 text-xs font-bold text-white">
                      {i + 1}
                    </span>

                    {i === 0 && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-[#c9a36a] text-[#2a2018] text-[11px] font-semibold px-2.5 py-1">
                        Hero image
                      </span>
                    )}
                    {shown && i !== 0 && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/55 text-white text-[11px] font-semibold px-2.5 py-1">
                        In gallery
                      </span>
                    )}
                    {!shown && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/55 text-[#cbbfa9] text-[11px] font-semibold px-2.5 py-1">
                        Hidden
                      </span>
                    )}

                    {/* Controls */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        title="Move earlier"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-[#c9a36a] hover:text-[#2a2018] disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:text-white"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === photos.length - 1}
                        title="Move later"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-[#c9a36a] hover:text-[#2a2018] disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:text-white"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(photo.name)}
                        title="Delete photo"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-[#9c8e76]">
              Drag a photo onto another to reorder, or use the arrow buttons. The first {SHOWN_COUNT}{' '}
              photos show in your live gallery; the rest stay hidden until you move them up.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPhotos;
