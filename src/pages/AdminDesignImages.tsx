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
const BUILD = 'v4-multicolor';
 
const SIZE_CHOICES = [
  { id: 'os', label: 'O/S — One Size' },
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
  { id: 'xl', label: 'XL' },
  { id: 'sm-md', label: 'S/M' },
  { id: 'lg-xl', label: 'L/XL' },
];
 
interface ColorEntry {
  id: string;
  name: string;
  color: string;
  image?: string;
}
 
const AddBasesManager: React.FC<{
  flash: (type: 'ok' | 'err', text: string) => void;
}> = ({ flash }) => {
  const mainFileRef = useRef<HTMLInputElement>(null);
  const colorFileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CustomBaseRow[]>([]);
  const [name, setName] = useState('');
  const [range, setRange] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['os']);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState<ColorEntry[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#c9a87c');
  const [newColorImage, setNewColorImage] = useState('');
  const [uploadingColor, setUploadingColor] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
 
  const load = () => fetchCustomBaseRows().then(setRows);
  useEffect(() => { load(); }, []);
 
  const toggleSize = (id: string) => {
    setSelectedSizes(prev => {
      if (id === 'os') return ['os'];
      const withoutOs = prev.filter(s => s !== 'os');
      return withoutOs.includes(id)
        ? withoutOs.filter(s => s !== id)
        : [...withoutOs, id];
    });
  };
 
  const uploadImage = async (file: File, prefix: string): Promise<string> => {
    if (!file.type.startsWith('image/')) { flash('err', 'Please choose an image file.'); return ''; }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `design/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { flash('err', `Upload failed: ${error.message}`); return ''; }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };
 
  const onPickMain = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (mainFileRef.current) mainFileRef.current.value = '';
    if (!f) return;
    setUploading(true);
    const url = await uploadImage(f, 'custom-base');
    setUploading(false);
    if (url) { setImageUrl(url); flash('ok', 'Main photo uploaded!'); }
  };
 
  const onPickColorImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (colorFileRef.current) colorFileRef.current.value = '';
    if (!f) return;
    setUploadingColor(true);
    const url = await uploadImage(f, 'custom-base-color');
    setUploadingColor(false);
    if (url) setNewColorImage(url);
  };
 
  const addColor = () => {
    if (!newColorName.trim()) { flash('err', 'Please enter a color name.'); return; }
    const colorId = newColorName.toLowerCase().replace(/\s+/g, '-');
    const entry: ColorEntry = { id: colorId, name: newColorName.trim(), color: newColorHex, image: newColorImage || undefined };
    if (editingColorIndex !== null) {
      setColors(prev => prev.map((c, i) => i === editingColorIndex ? entry : c));
      setEditingColorIndex(null);
    } else {
      setColors(prev => [...prev, entry]);
    }
    setNewColorName(''); setNewColorHex('#c9a87c'); setNewColorImage('');
  };
 
  const editColor = (i: number) => {
    const c = colors[i];
    setNewColorName(c.name); setNewColorHex(c.color); setNewColorImage(c.image || '');
    setEditingColorIndex(i);
  };
 
  const removeColor = (i: number) => setColors(prev => prev.filter((_, idx) => idx !== i));
 
  const add = async () => {
    if (!name.trim()) { flash('err', 'Please give the hat a name.'); return; }
    if (!imageUrl) { flash('err', 'Please upload a main photo for the hat.'); return; }
    if (selectedSizes.length === 0) { flash('err', 'Please select at least one size.'); return; }
    setSaving(true);
    const colorsData = colors.length > 0 ? colors : [{ id: 'natural', name: 'Natural', color: '#d9c2a3' }];
    const created = await addCustomBase({
      name: name.trim(),
      range: range.trim(),
      description: description.trim(),
      image: imageUrl,
      sizes: selectedSizes,
      colors: colorsData,
    });
    setSaving(false);
    if (!created) { flash('err', 'Could not add the hat. Please try again.'); return; }
    setName(''); setRange(''); setDescription(''); setImageUrl(''); setSelectedSizes(['os']); setColors([]);
    load();
    flash('ok', `Added "${created.name}" to the designer.`);
  };
 
  const remove = async (id: string, label: string) => {
    const ok = await deleteCustomBase(id);
    if (ok) { setRows(prev => prev.filter(r => r.id !== id)); flash('ok', `Removed "${label}".`); }
    else flash('err', 'Could not remove the hat.');
  };
 
  return (
    <div className="mb-12">
      <h2 className="font-serif text-2xl mb-2">Add a new base hat</h2>
      <p className="text-[#cbbfa9] text-sm mb-1 max-w-2xl">
        Upload a main photo, add color options with individual photos, choose sizes, and it shows up
        instantly in the hat configurator. Build: {BUILD}
      </p>
 
      <div className="rounded-2xl bg-[#3a2e22] border border-[#4a3c2e] p-5 space-y-5">
        <div className="grid sm:grid-cols-[180px_1fr] gap-5">
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-[#241c14] flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt="New base hat" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#9a8d77] text-xs px-3 text-center">No main photo yet</span>
              )}
            </div>
            <input ref={mainFileRef} type="file" accept="image/*" onChange={onPickMain} className="hidden" />
            <button type="button" disabled={uploading} onClick={() => mainFileRef.current?.click()}
              className="w-full mt-3 rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm py-2 transition-colors disabled:opacity-50">
              {uploading ? 'Uploading…' : imageUrl ? 'Replace main photo' : 'Upload main photo'}
            </button>
          </div>
 
          <div className="space-y-3">
            <input type="text" placeholder="Hat name (e.g. Bangora Western)" value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]" />
            <input type="text" placeholder="Price range (e.g. $77)" value={range} onChange={e => setRange(e.target.value)}
              className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]" />
            <textarea placeholder="Short description (optional)" value={description} onChange={e => setDescription(e.target.value)}
              rows={2} className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a] resize-none" />
            <div>
              <p className="text-xs uppercase tracking-wider text-[#9a8d77] mb-2">Available sizes</p>
              <div className="flex flex-wrap gap-2">
                {SIZE_CHOICES.map(s => {
                  const selected = selectedSizes.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggleSize(s.id)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${selected ? 'bg-[#c9a36a] border-[#c9a36a] text-[#2a2018]' : 'bg-transparent border-[#5a4a37] text-[#cbbfa9] hover:border-[#c9a36a]'}`}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#9a8d77] mt-1">Select O/S for one-size hats, or individual sizes for fitted hats.</p>
            </div>
          </div>
        </div>
 
        <div className="border-t border-[#4a3c2e] pt-5">
          <p className="text-xs uppercase tracking-wider text-[#9a8d77] mb-3">
            Color options <span className="normal-case font-normal">(optional — add one per color variation)</span>
          </p>
 
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#241c14] rounded-xl p-2 pr-3">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-[#4a3c2e]" style={{ background: c.color }} />
                  )}
                  <div>
                    <p className="text-xs font-medium text-[#f3ead9]">{c.name}</p>
                    <p className="text-[10px] text-[#9a8d77]">{c.color}</p>
                  </div>
                  <div className="flex gap-1 ml-1">
                    <button onClick={() => editColor(i)} className="text-[#c9a36a] text-xs hover:underline">Edit</button>
                    <span className="text-[#4a3c2e]">·</span>
                    <button onClick={() => removeColor(i)} className="text-red-400 text-xs hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
 
          <div className="bg-[#241c14] rounded-xl p-4 space-y-3">
            <p className="text-xs text-[#9a8d77]">{editingColorIndex !== null ? 'Edit color' : 'Add a color'}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <input type="text" placeholder="Color name (e.g. Cream)" value={newColorName} onChange={e => setNewColorName(e.target.value)}
                className="rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-3 py-2 text-sm focus:outline-none focus:border-[#c9a36a]" />
              <div className="flex items-center gap-2">
                <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[#4a3c2e] bg-transparent cursor-pointer" />
                <input type="text" value={newColorHex} onChange={e => setNewColorHex(e.target.value)}
                  className="flex-1 rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] px-3 py-2 text-sm focus:outline-none focus:border-[#c9a36a]" placeholder="#c9a87c" />
              </div>
              <div>
                <input ref={colorFileRef} type="file" accept="image/*" onChange={onPickColorImage} className="hidden" />
                {newColorImage ? (
                  <div className="flex items-center gap-2">
                    <img src={newColorImage} alt="Color" className="w-10 h-10 rounded-lg object-cover" />
                    <button type="button" onClick={() => colorFileRef.current?.click()} className="text-xs text-[#c9a36a] hover:underline">
                      {uploadingColor ? 'Uploading…' : 'Replace photo'}
                    </button>
                  </div>
                ) : (
                  <button type="button" disabled={uploadingColor} onClick={() => colorFileRef.current?.click()}
                    className="w-full rounded-lg border border-[#4a3c2e] text-[#9a8d77] text-sm py-2 hover:border-[#c9a36a] transition-colors disabled:opacity-50">
                    {uploadingColor ? 'Uploading…' : 'Add photo for this color'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={addColor}
                className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm px-5 py-2 transition-colors">
                {editingColorIndex !== null ? 'Update color' : 'Add color'}
              </button>
              {editingColorIndex !== null && (
                <button type="button" onClick={() => { setEditingColorIndex(null); setNewColorName(''); setNewColorHex('#c9a87c'); setNewColorImage(''); }}
                  className="rounded-full border border-[#4a3c2e] text-[#9a8d77] text-sm px-5 py-2 hover:border-[#c9a36a]">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
 
        <button type="button" disabled={saving} onClick={add}
          className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm px-8 py-3 transition-colors disabled:opacity-50">
          {saving ? 'Adding hat…' : 'Save new hat to configurator'}
        </button>
      </div>
 
      {rows.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-[#9a8d77] mb-3">Your added hats</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {rows.map(r => (
              <CustomBaseCard key={r.id} row={r} flash={flash}
                onUpdated={(id, image) => setRows(prev => prev.map(x => x.id === id ? { ...x, image } : x))}
                onEdited={(id, patch) => setRows(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x))}
                onRemove={() => remove(r.id, r.name)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
 
const CustomBaseCard: React.FC<{
  row: CustomBaseRow;
  flash: (type: 'ok' | 'err', text: string) => void;
  onUpdated: (id: string, image: string) => void;
  onRemove: () => void;
  onEdited: (id: string, patch: Partial<CustomBaseRow>) => void;
}> = ({ row, flash, onUpdated, onRemove, onEdited }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingColorIdx, setUploadingColorIdx] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(row.name);
  const [editRange, setEditRange] = useState(row.range || '');
  const [editDescription, setEditDescription] = useState(row.description || '');
  const [editSizes, setEditSizes] = useState<string[]>(row.sizes || ['os']);
  const [saving, setSaving] = useState(false);
 
  const toggleSize = (id: string) => {
    setEditSizes(prev => {
      if (id === 'os') return ['os'];
      const withoutOs = prev.filter(s => s !== 'os');
      return withoutOs.includes(id) ? withoutOs.filter(s => s !== id) : [...withoutOs, id];
    });
  };
 
  const saveEdit = async () => {
    if (!editName.trim()) { flash('err', 'Hat name is required.'); return; }
    setSaving(true);
    const patch = { name: editName.trim(), range: editRange.trim(), description: editDescription.trim(), sizes: editSizes };
    const ok = await updateCustomBase(row.id, patch);
    setSaving(false);
    if (ok) { onEdited(row.id, patch); setEditOpen(false); flash('ok', `Updated "${editName}".`); }
    else flash('err', 'Could not save changes.');
  };
 
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { flash('err', 'Upload failed. Please try again.'); return ''; }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };
 
  const onPickMain = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!f) return;
    setBusy(true);
    const url = await uploadImage(f, `design/custom-base-${row.id}-${Date.now()}.${f.name.split('.').pop() || 'jpg'}`);
    if (url) {
      const ok = await updateCustomBase(row.id, { image: url });
      if (ok) { onUpdated(row.id, url); flash('ok', `Updated main photo for "${row.name}".`); }
      else flash('err', 'Could not save the new photo.');
    }
    setBusy(false);
  };
 
  const onPickColorImage = (colorIndex: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingColorIdx(colorIndex);
    const url = await uploadImage(f, `design/custom-base-color-${row.id}-${colorIndex}-${Date.now()}.${f.name.split('.').pop() || 'jpg'}`);
    if (url && row.colors) {
      const updatedColors = row.colors.map((c, i) => i === colorIndex ? { ...c, image: url } : c);
      const ok = await updateCustomBase(row.id, { colors: updatedColors });
      if (ok) flash('ok', `Updated photo for ${row.colors[colorIndex]?.name}.`);
      else flash('err', 'Could not save color photo.');
    }
    setUploadingColorIdx(null);
  };
 
  return (
    <>
      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditOpen(false)} />
          <div className="relative bg-[#2a2018] border border-[#4a3c2e] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-xl text-[#f3ead9] mb-4">Edit hat</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#9a8d77] mb-1">Hat name *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-lg bg-[#1f1812] border border-[#4a3c2e] text-[#f3ead9] px-4 py-2.5 outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#9a8d77] mb-1">Price range</label>
                <input value={editRange} onChange={e => setEditRange(e.target.value)}
                  placeholder="e.g. $77"
                  className="w-full rounded-lg bg-[#1f1812] border border-[#4a3c2e] text-[#f3ead9] px-4 py-2.5 outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#9a8d77] mb-1">Description</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                  rows={2} className="w-full rounded-lg bg-[#1f1812] border border-[#4a3c2e] text-[#f3ead9] px-4 py-2.5 outline-none focus:border-[#c9a36a] resize-none" />
              </div>
              <div>
                <label className="block text-xs text-[#9a8d77] mb-2">Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_CHOICES.map(s => {
                    const selected = editSizes.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleSize(s.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${selected ? 'bg-[#c9a36a] border-[#c9a36a] text-[#2a2018]' : 'border-[#5a4a37] text-[#cbbfa9] hover:border-[#c9a36a]'}`}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-2.5 text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={() => setEditOpen(false)}
                  className="rounded-full border border-[#5a4a37] text-[#cbbfa9] px-5 py-2.5 text-sm hover:bg-[#3a2e22]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      <div className="rounded-2xl overflow-hidden bg-[#3a2e22] border border-[#4a3c2e]">
        <div className="relative aspect-square overflow-hidden bg-[#241c14]">
          <img key={row.image} src={row.image} alt={row.name} className="w-full h-full object-cover" />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">Working…</div>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm font-medium text-[#f3ead9] leading-tight">{row.name}</p>
          {row.range && <p className="text-xs text-[#c9a36a] mt-0.5">{row.range}</p>}
          {row.sizes && row.sizes.length > 0 && (
            <p className="text-xs text-[#9a8d77] mt-0.5">Sizes: {row.sizes.join(', ').toUpperCase()}</p>
          )}
          {row.colors && row.colors.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9a8d77] mb-2">Colors</p>
              <div className="space-y-2">
                {row.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg border border-[#5a4a37] flex-shrink-0" style={{ background: c.color }} />
                    )}
                    <span className="text-xs text-[#cbbfa9] flex-1">{c.name}</span>
                    <label className="cursor-pointer text-[10px] text-[#c9a36a] hover:underline flex-shrink-0">
                      {uploadingColorIdx === i ? 'Uploading…' : c.image ? 'Replace' : 'Add photo'}
                      <input type="file" accept="image/*" className="hidden" onChange={onPickColorImage(i)} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickMain} className="hidden" />
          <button type="button" onClick={() => setEditOpen(true)}
            className="mt-3 w-full rounded-full bg-[#5a4a37] hover:bg-[#6a5a47] text-[#f3ead9] font-semibold text-sm py-2 transition-colors">
            Edit details
          </button>
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
            className="mt-2 w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm py-2 transition-colors disabled:opacity-50">
            {busy ? 'Working…' : 'Change main photo'}
          </button>
          <button type="button" disabled={busy} onClick={onRemove}
            className="mt-2 w-full rounded-full border border-[#5a4a37] text-[#cbbfa9] text-sm py-2 hover:bg-[#2a2018] transition-colors disabled:opacity-50">
            Remove hat
          </button>
        </div>
      </div>
    </>
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
    if (!file.type.startsWith('image/')) { flash('err', 'Please choose an image file.'); return; }
    setBusy(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const name = `design/${slot.key}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(name, file, { cacheControl: '3600', upsert: true });
    if (upErr) { setBusy(false); flash('err', `Upload failed: ${upErr.message}`); return; }
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
    const ok = await saveDesignImage(slot.key, publicUrl);
    setBusy(false);
    if (ok) { onChanged(slot.key, publicUrl); flash('ok', `Updated "${slot.label}". Now live.`); }
    else flash('err', 'Photo uploaded but could not be saved. Please try again.');
  };
 
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    if (fileRef.current) fileRef.current.value = '';
  };
 
  const pickFromGallery = async (galleryUrl: string) => {
    setBusy(true);
    const ok = await saveDesignImage(slot.key, galleryUrl);
    setBusy(false);
    if (ok) { onChanged(slot.key, galleryUrl); flash('ok', `Swapped "${slot.label}" to gallery photo.`); }
    else flash('err', 'Could not save the gallery photo. Please try again.');
  };
 
  const reset = async () => {
    setBusy(true);
    const ok = await resetDesignImage(slot.key);
    setBusy(false);
    if (ok) { onChanged(slot.key, null); flash('ok', 'Reset to the default photo.'); }
    else flash('err', 'Could not reset the photo.');
  };
 
  return (
    <div className="rounded-2xl overflow-hidden bg-[#3a2e22] border border-[#4a3c2e]">
      <div className="relative aspect-square overflow-hidden bg-[#241c14]">
        <img key={url} src={url} alt={slot.label} className="w-full h-full object-cover" />
        {overridden && (
          <span className="absolute top-2 left-2 rounded-full bg-[#c9a36a] text-[#2a2018] text-[11px] font-semibold px-2.5 py-1">Custom</span>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">Working…</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-[#f3ead9] leading-tight mb-3">{slot.label}</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
        <button type="button" disabled={busy} onClick={() => setPickerOpen(true)}
          className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm py-2 transition-colors disabled:opacity-50">
          Pick from gallery
        </button>
        <div className="flex gap-2 mt-2">
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-full border border-[#5a4a37] text-[#cbbfa9] text-sm py-2 hover:bg-[#2a2018] transition-colors disabled:opacity-50">
            Upload new
          </button>
          {overridden && (
            <button type="button" disabled={busy} onClick={reset}
              className="rounded-full border border-[#5a4a37] text-[#cbbfa9] text-sm px-3 py-2 hover:bg-[#2a2018] transition-colors disabled:opacity-50">
              Reset
            </button>
          )}
        </div>
      </div>
      <GalleryPickerModal open={pickerOpen} title={`Pick a photo for ${slot.label}`}
        onClose={() => setPickerOpen(false)} onPick={pickFromGallery} />
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
    fetchDesignImages().then(m => { setOverrides(m); setLoading(false); });
  }, []);
 
  const onChanged = (slotKey: string, url: string | null) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (url) next[slotKey] = url;
      else delete next[slotKey];
      return next;
    });
  };
 
  const bases = DESIGN_SLOTS.filter(s => s.group === 'base');
  const looks = DESIGN_SLOTS.filter(s => s.group === 'look');
 
  const renderGroup = (title: string, slots: DesignSlot[]) => (
    <div className="mb-12">
      <h2 className="font-serif text-2xl mb-5">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {slots.map(slot => (
          <SlotCard key={slot.key} slot={slot} url={overrides[slot.key] || slot.defaultUrl}
            onChanged={onChanged} flash={flash} />
        ))}
      </div>
    </div>
  );
 
  return (
    <div className="min-h-screen bg-[#1f1812] text-[#f3ead9]">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-2">Design Page Admin</p>
            <h1 className="font-serif text-3xl sm:text-4xl">Hat configurator manager</h1>
            <p className="mt-2 text-[#cbbfa9] max-w-xl">
              Add new base hats with multiple colors, swap design page photos, and manage featured looks.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/design" className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors">
              View design page
            </Link>
            <Link to="/maddhattery-admin/photos" className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors">
              Gallery photos
            </Link>
          </div>
        </div>
 
        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-900/40 text-green-200 border border-green-700/40' : 'bg-red-900/40 text-red-200 border border-red-700/40'}`}>
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
 
