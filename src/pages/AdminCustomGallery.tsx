import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomDesigns, uploadDesignImage, addCustomDesign, updateCustomDesign, deleteCustomDesign, saveDesignOrder, convertHeicPhotos, convertHeicFiles, isHeicFile, type CustomDesign } from '@/lib/customGallery';

const AdminCustomGallery: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('maddhattery_admin_auth') === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [designs, setDesigns] = useState<CustomDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [heicUrls, setHeicUrls] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertingFiles, setConvertingFiles] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === 'hatbar26') {
      sessionStorage.setItem('maddhattery_admin_auth', 'true');
      setAuthed(true);
      setPwError('');
    } else {
      setPwError('Incorrect password.');
    }
  };

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchCustomDesigns();
    setDesigns(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [load, authed]);

  const persistOrder = useCallback(async (ordered: CustomDesign[]) => {
    setSaving(true);
    const ok = await saveDesignOrder(ordered.map(d => d.id));
    setSaving(false);
    if (!ok) flash('err', 'Could not save the new order. Please try again.');
  }, []);

  const uploadNew = useCallback(async (files: FileList | File[]) => {
    const all = Array.from(files);
    const heicFiles = all.filter(f => isHeicFile(f));
    const normalFiles = all.filter(f => !isHeicFile(f) && f.type.startsWith('image/'));
    const skipped = all.length - heicFiles.length - normalFiles.length;
    if (heicFiles.length === 0 && normalFiles.length === 0) {
      flash('err', 'Please choose image files (jpg, png, webp, or iPhone HEIC).');
      return;
    }
    const added: CustomDesign[] = [];
    if (normalFiles.length > 0) {
      setUploading(true);
      for (const file of normalFiles) {
        const url = await uploadDesignImage(file);
        if (!url) continue;
        const row = await addCustomDesign(url, '', '');
        if (row) added.push(row);
      }
      setUploading(false);
    }
    let convertedCount = 0;
    let convertFailed = 0;
    if (heicFiles.length > 0) {
      setConvertingFiles(true);
      const results = await convertHeicFiles(heicFiles);
      setConvertingFiles(false);
      convertedCount = results.filter(r => r.status === 'ok').length;
      convertFailed = heicFiles.length - convertedCount;
    }
    if (convertedCount > 0) {
      await load();
    } else if (added.length > 0) {
      setDesigns(prev => [...prev, ...added]);
    }
    const totalOk = added.length + convertedCount;
    if (totalOk > 0) {
      flash('ok', `Added ${totalOk} photo${totalOk > 1 ? 's' : ''}` + (convertedCount ? ` (${convertedCount} iPhone HEIC converted to JPG)` : '') + (convertFailed || skipped ? ` — ${convertFailed + skipped} could not be added.` : '.'));
    } else {
      flash('err', 'Upload failed. Please try again.');
    }
  }, [load]);

  const onPickAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadNew(e.target.files);
    if (addInputRef.current) addInputRef.current.value = '';
  };

  const onDropUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadNew(e.dataTransfer.files);
    }
  };

  const onConvertHeic = useCallback(async () => {
    const urls = heicUrls.split(/[\n,]+/).map(u => u.trim()).filter(u => /^https?:\/\//i.test(u));
    if (urls.length === 0) {
      flash('err', 'Paste at least one image URL (one per line).');
      return;
    }
    setConverting(true);
    const results = await convertHeicPhotos(urls.map(url => ({ url })), true);
    setConverting(false);
    const ok = results.filter(r => r.status === 'ok');
    const failed = results.filter(r => r.status !== 'ok');
    if (ok.length > 0) {
      const convertedCount = ok.filter(r => r.converted).length;
      flash('ok', `Added ${ok.length} photo${ok.length > 1 ? 's' : ''}` + (convertedCount ? ` (${convertedCount} HEIC converted to JPG)` : '') + (failed.length ? ` — ${failed.length} failed.` : '.'));
      setHeicUrls('');
      await load();
    } else {
      flash('err', 'Could not process those URLs. Check the links and try again.');
    }
  }, [heicUrls, load]);

  const triggerReplace = (id: string) => {
    replaceTargetId.current = id;
    replaceInputRef.current?.click();
  };

  const onPickReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = replaceTargetId.current;
    if (replaceInputRef.current) replaceInputRef.current.value = '';
    replaceTargetId.current = null;
    if (!file || !id) return;
    setUploading(true);
    const url = await uploadDesignImage(file);
    setUploading(false);
    if (!url) { flash('err', 'Could not upload the replacement image.'); return; }
    const ok = await updateCustomDesign(id, { src: url });
    if (!ok) { flash('err', 'Could not save the new image.'); return; }
    setDesigns(prev => prev.map(d => d.id === id ? { ...d, src: url } : d));
    flash('ok', 'Image replaced.');
  };

  const onFieldChange = (id: string, field: 'title' | 'note', value: string) => {
    setDesigns(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const saveField = async (id: string, field: 'title' | 'note', value: string) => {
    const ok = await updateCustomDesign(id, { [field]: value });
    if (!ok) flash('err', 'Could not save your edit.');
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this design from your homepage gallery?')) return;
    const ok = await deleteCustomDesign(id);
    if (!ok) { flash('err', 'Could not delete this design.'); return; }
    const next = designs.filter(d => d.id !== id);
    setDesigns(next);
    await persistOrder(next);
    flash('ok', 'Design removed.');
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
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
    setDesigns(prev => {
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

  const move = (index: number, dir: -1 | 1) => {
    setDesigns(prev => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      persistOrder(next);
      return next;
    });
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6efe4] p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e0d4c0] p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">the maddhattery</p>
          <h1 className="font-serif text-2xl text-[#2a2018] mb-6">Admin Login</h1>
          <input
            type="password"
            autoFocus
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a] mb-3"
          />
          {pwError && <p className="text-sm text-red-600 mb-3">{pwError}</p>}
          <button type="submit" className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3 transition-colors">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1812] text-[#f3ead9]">
      <input ref={replaceInputRef} type="file" accept="image/*" onChange={onPickReplace} className="hidden" />
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-2">Admin</p>
            <h1 className="font-serif text-3xl sm:text-4xl">Custom designs gallery</h1>
            <p className="mt-2 text-[#cbbfa9] max-w-xl">
              Upload, reorder, and edit titles &amp; captions for the homepage gallery.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/" className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors">View site</Link>
            <Link to="/maddhattery-admin/photos" className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors">Hat-bar photos</Link>
            <Link to="/maddhattery-admin/bookings" className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors">Bookings</Link>
            <button onClick={() => { sessionStorage.removeItem('maddhattery_admin_auth'); setAuthed(false); }} className="rounded-full border border-[#5a4a37] px-5 py-2.5 text-sm hover:bg-[#2a2018] transition-colors">Sign out</button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-900/40 text-green-200 border border-green-700/40' : 'bg-red-900/40 text-red-200 border border-red-700/40'}`}>
            {message.text}
          </div>
        )}

        <div
          onDragOver={e => { if (dragIndex.current !== null) return; e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDropUpload}
          onClick={() => addInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors mb-10 ${dragOver ? 'border-[#c9a36a] bg-[#2a2018]' : 'border-[#5a4a37] bg-[#241c14] hover:border-[#c9a36a]'}`}
        >
          <input ref={addInputRef} type="file" accept="image/*,.heic,.heif,.HEIC,.HEIF" multiple onChange={onPickAdd} className="hidden" />
          <p className="font-semibold text-lg">
            {convertingFiles ? 'Converting iPhone photos…' : uploading ? 'Uploading…' : 'Click to add or drag photos here'}
          </p>
          <p className="text-sm text-[#cbbfa9] mt-1">JPG, PNG, WEBP, or iPhone HEIC/HEIF</p>
        </div>

        <div className="rounded-2xl border border-[#3a2e22] bg-[#241c14] p-6 mb-10">
          <h2 className="font-serif text-xl mb-3">Convert HEIC photos &amp; add to gallery</h2>
          <textarea value={heicUrls} onChange={e => setHeicUrls(e.target.value)} rows={3} placeholder="https://…/photo.HEIC" className="w-full resize-y rounded-lg bg-[#1f1812] border border-[#3a2e22] px-3 py-2 text-sm text-[#f3ead9] focus:outline-none focus:border-[#c9a36a] font-mono" />
          <button onClick={onConvertHeic} disabled={converting} className="mt-3 rounded-full bg-[#c9a36a] px-5 py-2.5 text-sm font-semibold text-[#2a2018] hover:bg-[#d8b67e] disabled:opacity-50">
            {converting ? 'Converting…' : 'Convert & add to gallery'}
          </button>
        </div>

        {loading ? (
          <p className="text-[#cbbfa9]">Loading…</p>
        ) : designs.length === 0 ? (
          <p className="text-[#cbbfa9]">No designs yet. Add some above.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl">{designs.length} design{designs.length > 1 ? 's' : ''}</h2>
              <div className="flex items-center gap-4">
                {saving && <span className="text-xs text-[#c9a36a]">Saving…</span>}
                <button onClick={load} className="text-sm text-[#c9a36a] hover:underline">Refresh</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {designs.map((d, i) => (
                <div key={d.id} onDragOver={handleDragOverItem(i)} onDrop={handleDropItem(i)} className={`rounded-2xl overflow-hidden bg-[#241c14] border transition-all ${overIndex === i ? 'border-[#c9a36a] ring-2 ring-[#c9a36a]' : 'border-[#3a2e22]'}`}>
                  <div draggable onDragStart={handleDragStart(i)} onDragEnd={handleDragEnd} className="relative aspect-[3/4] bg-[#3a2e22] cursor-grab active:cursor-grabbing group">
                    <img src={d.src} alt={d.title || 'Custom design'} loading="lazy" draggable={false} className="w-full h-full object-cover pointer-events-none" />
                    <span className="absolute top-2 left-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/60 px-2 text-xs font-bold text-white">{i + 1}</span>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-[#c9a36a] hover:text-[#2a2018] disabled:opacity-30">←</button>
                      <button onClick={() => move(i, 1)} disabled={i === designs.length - 1} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-[#c9a36a] hover:text-[#2a2018] disabled:opacity-30">→</button>
                    </div>
                    <button onClick={() => triggerReplace(d.id)} className="absolute bottom-2 left-2 rounded-full bg-black/65 hover:bg-[#c9a36a] hover:text-[#2a2018] text-white text-[11px] font-semibold px-3 py-1.5 transition-colors">Replace image</button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#9c8e76] mb-1">Title</label>
                      <input value={d.title} onChange={e => onFieldChange(d.id, 'title', e.target.value)} onBlur={e => saveField(d.id, 'title', e.target.value)} placeholder="e.g. Turquoise Fringe Flat-Brim" className="w-full rounded-lg bg-[#1f1812] border border-[#3a2e22] px-3 py-2 text-sm text-[#f3ead9] focus:outline-none focus:border-[#c9a36a]" />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#9c8e76] mb-1">Caption</label>
                      <textarea value={d.note} onChange={e => onFieldChange(d.id, 'note', e.target.value)} onBlur={e => saveField(d.id, 'note', e.target.value)} rows={2} placeholder="Short description" className="w-full resize-none rounded-lg bg-[#1f1812] border border-[#3a2e22] px-3 py-2 text-sm text-[#cbbfa9] focus:outline-none focus:border-[#c9a36a]" />
                    </div>
                    <button onClick={() => remove(d.id)} className="text-xs text-red-300 hover:text-red-200 hover:underline">Delete this design</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCustomGallery;
