import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  DESIGN_SLOTS,
  fetchDesignImages,
  saveDesignImage,
  resetDesignImage,
  type DesignImageMap,
  type DesignSlot,
} from '@/lib/designImages';
import {
  fetchCustomBaseRows,
  addCustomBase,
  deleteCustomBase,
  updateCustomBase,
  type CustomBaseRow,
} from '@/lib/customBases';
import GalleryPickerModal from '@/components/GalleryPickerModal';

const BUCKET = 'hat-bar-images';

/** Lets the owner ADD brand-new base hats (name, price range, description,
 *  photo). These appear in the configurator alongside the built-in hats. */
const AddBasesManager: React.FC<{
  flash: (type: 'ok' | 'err', text: string) => void;
}> = ({ flash }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CustomBaseRow[]>([]);
  const [name, setName] = useState('');
  const [range, setRange] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => fetchCustomBaseRows().then(setRows);
  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      flash('err', 'Please choose an image file.');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `design/custom-base-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    setUploading(false);
    if (error) {
      flash('err', `Upload failed: ${error.message}`);
      return;
    }

    setImageUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    flash('ok', 'Photo uploaded — now fill in the details and add the hat.');
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  const add = async () => {
    if (!name.trim()) {
      flash('err', 'Please give the hat a name.');
      return;
    }
    if (!imageUrl) {
      flash('err', 'Please upload a photo for the hat.');
      return;
    }
    setSaving(true);
    const created = await addCustomBase({
      name: name.trim(),
      range: range.trim(),
      description: description.trim(),
      image: imageUrl,
    });
    setSaving(false);
    if (!created) {
      flash('err', 'Could not add the hat. Please try again.');
      return;
    }
    setName('');
    setRange('');
    setDescription('');
    setImageUrl('');
    load();
    flash('ok', `Added “${created.name}” to the designer.`);
  };

  const remove = async (id: string, label: string) => {
    const ok = await deleteCustomBase(id);
    if (ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      flash('ok', `Removed “${label}”.`);
    } else {
      flash('err', 'Could not remove the hat.');
    }
  };

  return (
    <div className="mb-12">
      <h2 className="font-serif text-2xl mb-2">Add a new base hat</h2>
      <p className="text-[#cbbfa9] text-sm mb-5 max-w-2xl">
        Upload a photo, name it, and it shows up instantly in the “Choose your base hat” step on
        the design page — no code needed.
      </p>

      <div className="rounded-2xl bg-[#3a2e22] border border-[#4a3c2e] p-5 grid sm:grid-cols-[180px_1fr] gap-5">
        {/* Image picker */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-[#241c14] flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt="New base hat" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#9a8d77] text-xs px-3 text-center">No photo yet</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="w-full mt-3 rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm py-2 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : imageUrl ? 'Replace photo' : 'Upload photo'}
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Hat name (e.g. Vintage Trucker)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]"
          />
          <input
            type="text"
            placeholder="Price range (e.g. $50 – $99)"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]"
          />
          <textarea
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a] resize-none"
          />
          <button
            type="button"
            disabled={saving}
            onClick={add}
            className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm px-6 py-2.5 transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add base hat'}
          </button>
        </div>
      </div>

      {/* Existing custom hats — each has its own "Change photo" button */}
      {rows.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-[#9a8d77] mb-3">Your added hats — change each photo individually</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {rows.map((r) => (
              <CustomBaseCard
                key={r.id}
                row={r}
                flash={flash}
                onUpdated={(id, image) =>
                  setRows((prev) => prev.map((x) => (x.id === id ? { ...x, image } : x)))
                }
                onRemove={() => remove(r.id, r.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** A single admin card for one custom (owner-added) base hat. Lets the owner
 *  swap THIS hat's photo without removing and re-adding it. */
const CustomBaseCard: React.FC<{
  row: CustomBaseRow;
  flash: (type: 'ok' | 'err', text: string) => void;
  onUpdated: (id: string, image: string) => void;
  onRemove: () => void;
}> = ({ row, flash, onUpdated, onRemove }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      flash('err', 'Please choose an image file.');
      return;
    }
    setBusy(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `design/custom-base-${row.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) {
      setBusy(false);
      flash('err', 'Upload failed. Please try again.');
      return;
    }
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const ok = await updateCustomBase(row.id, { image: publicUrl });
    setBusy(false);
    if (ok) {
      onUpdated(row.id, publicUrl);
      flash('ok', `Updated the photo for “${row.name}”.`);
    } else {
      flash('err', 'Could not save the new photo.');
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-[#3a2e22] border border-[#4a3c2e]">
      <div className="relative aspect-square overflow-hidden bg-[#241c14]">
        {/* key forces the <img> to reload when the URL changes */}
        <img key={row.image} src={row.image} alt={row.name} className="w-full h-full object-cover" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
            Working…
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-[#f3ead9] leading-tight">{row.name}</p>
        {row.range && <p className="text-xs text-[#c9a36a] mt-0.5">{row.range}</p>}
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="mt-3 w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm py-2 transition-colors disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Change photo'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="mt-2 w-full rounded-full border border-[#5a4a37] text-[#cbbfa9] text-sm py-2 hover:bg-[#2a2018] transition-colors disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
};


const SlotCard: React.FC<{
  slot: DesignSlot;
  url: string;
  onChanged: (slotKey: string, url: string | null) => void;
  flash: (type: 'ok' | 'err', text: string) => void;
}> = ({ slot, url, onChanged, flash }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const overridden = url !== slot.defaultUrl;

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      flash('err', 'Please choose an image file.');
      return;
    }
    setBusy(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const name = `design/${slot.key}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(name, file, { cacheControl: '3600', upsert: true });
    if (upErr) {
      setBusy(false);
      flash('err', `Upload failed: ${upErr.message}`);
      return;
    }
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
    const ok = await saveDesignImage(slot.key, publicUrl);
    setBusy(false);
    if (ok) {
      onChanged(slot.key, publicUrl);
      flash('ok', `Updated “${slot.label}”. The new photo is now live on the design page.`);
    } else {
      flash('err', 'Photo uploaded but could not be saved. Please try again.');
    }
  };


  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  /** Use a photo that's already in the gallery — no upload needed. */
  const pickFromGallery = async (galleryUrl: string) => {
    setBusy(true);
    const ok = await saveDesignImage(slot.key, galleryUrl);
    setBusy(false);
    if (ok) {
      onChanged(slot.key, galleryUrl);
      flash('ok', `Swapped “${slot.label}” to the chosen gallery photo. It's now live.`);
    } else {
      flash('err', 'Could not save the gallery photo. Please try again.');
    }
  };

  const reset = async () => {
    setBusy(true);
    const ok = await resetDesignImage(slot.key);
    setBusy(false);
    if (ok) {
      onChanged(slot.key, null);
      flash('ok', 'Reset to the default photo.');
    } else {
      flash('err', 'Could not reset the photo.');
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-[#3a2e22] border border-[#4a3c2e]">
      <div className="relative aspect-square overflow-hidden bg-[#241c14]">
        <img key={url} src={url} alt={slot.label} className="w-full h-full object-cover" />
        {overridden && (
          <span className="absolute top-2 left-2 rounded-full bg-[#c9a36a] text-[#2a2018] text-[11px] font-semibold px-2.5 py-1">
            Custom
          </span>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
            Working…
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-[#f3ead9] leading-tight mb-3">{slot.label}</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
        <button
          type="button"
          disabled={busy}
          onClick={() => setPickerOpen(true)}
          className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm py-2 transition-colors disabled:opacity-50"
        >
          Pick from gallery
        </button>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-full border border-[#5a4a37] text-[#cbbfa9] text-sm py-2 hover:bg-[#2a2018] transition-colors disabled:opacity-50"
          >
            Upload new
          </button>
          {overridden && (
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-full border border-[#5a4a37] text-[#cbbfa9] text-sm px-3 py-2 hover:bg-[#2a2018] transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <GalleryPickerModal
        open={pickerOpen}
        title={`Pick a photo for ${slot.label}`}
        onClose={() => setPickerOpen(false)}
        onPick={pickFromGallery}
      />
    </div>
  );
};

const AdminDesignImages: React.FC = () => {
  const [overrides, setOverrides] = useState<DesignImageMap>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    fetchDesignImages().then((m) => {
      setOverrides(m);
      setLoading(false);
    });
  }, []);

  const onChanged = (slotKey: string, url: string | null) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (url) next[slotKey] = url;
      else delete next[slotKey];
      return next;
    });
  };

  const bases = DESIGN_SLOTS.filter((s) => s.group === 'base');
  const looks = DESIGN_SLOTS.filter((s) => s.group === 'look');

  const renderGroup = (title: string, slots: DesignSlot[]) => (
    <div className="mb-12">
      <h2 className="font-serif text-2xl mb-5">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {slots.map((slot) => (
          <SlotCard
            key={slot.key}
            slot={slot}
            url={overrides[slot.key] || slot.defaultUrl}
            onChanged={onChanged}
            flash={flash}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1f1812] text-[#f3ead9]">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-2">Design Page Photos</p>
            <h1 className="font-serif text-3xl sm:text-4xl">Custom hat page pictures</h1>
            <p className="mt-2 text-[#cbbfa9] max-w-xl">
              Swap the pictures shown on the “Design your hat” page. Use “Pick from gallery” to choose
              any photo already in your gallery, or “Upload new” for a fresh one. Changes appear
              instantly — no code, no rebuild. Use “Reset” to go back to the original photo.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/design"
              className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors"
            >
              View design page
            </Link>
            <Link
    
  to="/maddhattery-admin/photos"
  className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors"
>
  Gallery photos
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

        {loading ? (
          <p className="text-[#cbbfa9]">Loading photos…</p>
        ) : (
          <>
            <AddBasesManager flash={flash} />
            <div className="border-t border-[#4a3c2e] pt-10 mb-2">
              <p className="text-[#cbbfa9] text-sm max-w-2xl">
                Below: swap the photo on each of the built-in base hats and featured looks.
              </p>
            </div>
            {renderGroup('Built-in base hat photos', bases)}
            {renderGroup('Featured looks', looks)}
          </>
        )}

      </div>
    </div>
  );
};

export default AdminDesignImages;
