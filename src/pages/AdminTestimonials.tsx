import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';
const BUCKET = 'hat-bar-images';

const NAV_LINKS = [
  { to: '/', label: 'View site' },
  { to: '/maddhattery-admin', label: 'Gallery' },
  { to: '/maddhattery-admin/photos', label: 'Hat-bar photos' },
  { to: '/maddhattery-admin/bookings', label: 'Bookings' },
  { to: '/maddhattery-admin/design', label: 'Hat design' },
  { to: '/maddhattery-admin/wholesale', label: 'Wholesale' },
  { to: '/maddhattery-admin/quotes', label: 'Quote requests' },
  { to: '/maddhattery-admin/addons', label: 'Add-ons' },
  { to: '/maddhattery-admin/testimonials', label: 'Testimonials' },
];

interface Testimonial {
  id: string;
  image_url: string;
  quote: string | null;
  client_name: string | null;
  event_type: string | null;
  sort_order: number;
  active: boolean;
}

const AdminTestimonials: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Testimonial>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('testimonials').select('*').order('sort_order').order('created_at');
    setItems((data || []) as Testimonial[]);
    setLoading(false);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `testimonials/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { flash('err', 'Upload failed.'); return ''; }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const onPickNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!f) return;
    setUploading(true);
    const url = await uploadImage(f);
    setUploading(false);
    if (!url) return;
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const { data, error } = await supabase.from('testimonials').insert({
      image_url: url, sort_order: maxOrder + 1, active: true,
    }).select().single();
    if (error || !data) { flash('err', 'Could not add photo.'); return; }
    setItems(prev => [...prev, data as Testimonial]);
    flash('ok', 'Photo added! Now add a quote by clicking Edit.');
  };

  const onReplacePhoto = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const url = await uploadImage(f);
    setUploading(false);
    if (!url) return;
    await supabase.from('testimonials').update({ image_url: url }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, image_url: url } : i));
    flash('ok', 'Photo replaced!');
  };

  const startEdit = (item: Testimonial) => {
    setEditingId(item.id);
    setEditValues({ quote: item.quote || '', client_name: item.client_name || '', event_type: item.event_type || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from('testimonials').update(editValues).eq('id', editingId);
    setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...editValues } as Testimonial : i));
    setEditingId(null);
    flash('ok', 'Saved!');
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('testimonials').update({ active }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, active } : i));
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Delete this testimonial?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    flash('ok', 'Deleted.');
  };

  const moveOrder = async (id: string, dir: number) => {
    const idx = items.findIndex(i => i.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    newItems.forEach((item, i) => { item.sort_order = i; });
    setItems(newItems);
    await Promise.all(newItems.map((item, i) =>
      supabase.from('testimonials').update({ sort_order: i }).eq('id', item.id)
    ));
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6efe4] p-4">
        <form onSubmit={e => { e.preventDefault(); if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem(AUTH_KEY, 'true'); setAuthed(true); } else setPwError('Incorrect password.'); }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e0d4c0] p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">the maddhattery</p>
          <h1 className="font-serif text-2xl text-[#2a2018] mb-6">Admin Login</h1>
          <input type="password" autoFocus value={pwInput} onChange={e => setPwInput(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a] mb-3" />
          {pwError && <p className="text-sm text-red-600 mb-3">{pwError}</p>}
          <button type="submit" className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3">Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Testimonials Manager</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22] transition-colors">{l.label}</Link>
            ))}
            <button onClick={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }}
              className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22] transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-[#5b5043] text-sm">{items.length} testimonial{items.length !== 1 ? 's' : ''} · Changes show instantly on the website</p>
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickNew} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-6 py-2.5 text-sm transition-colors disabled:opacity-50">
              {uploading ? 'Uploading…' : '+ Add photo'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-[#5b5043]">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-10 text-center text-[#7a6e5c]">
            No testimonials yet. Click <strong>+ Add photo</strong> to get started!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item, idx) => (
              <div key={item.id} className={`rounded-2xl overflow-hidden bg-white border ${item.active ? 'border-[#e0d4c0]' : 'border-dashed border-[#d0c4b0] opacity-60'}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f3ead9]">
                  <img src={item.image_url} alt={item.client_name || 'Event'} className="w-full h-full object-cover" />
                  {!item.active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">Hidden</span>
                    </div>
                  )}
                </div>

                {editingId === item.id ? (
                  <div className="p-4 space-y-2">
                    <input value={editValues.client_name || ''} onChange={e => setEditValues(v => ({ ...v, client_name: e.target.value }))}
                      placeholder="Client name"
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-xs outline-none focus:border-[#c9a36a]" />
                    <input value={editValues.event_type || ''} onChange={e => setEditValues(v => ({ ...v, event_type: e.target.value }))}
                      placeholder="Event type (e.g. Bachelorette)"
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-xs outline-none focus:border-[#c9a36a]" />
                    <textarea value={editValues.quote || ''} onChange={e => setEditValues(v => ({ ...v, quote: e.target.value }))}
                      placeholder="Client quote…" rows={3}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-xs outline-none focus:border-[#c9a36a] resize-none" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 rounded-full bg-[#c9a36a] text-[#2a2018] font-semibold text-xs py-2">Save</button>
                      <button onClick={() => setEditingId(null)} className="rounded-full border border-[#d8cbb4] text-[#5b5043] text-xs px-4 py-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {item.quote && <p className="text-xs text-[#5b5043] italic mb-1 leading-relaxed line-clamp-3">"{item.quote}"</p>}
                    {item.client_name && <p className="text-xs font-semibold text-[#c9a36a]">{item.client_name}</p>}
                    {item.event_type && <p className="text-xs text-[#9a8d78]">{item.event_type}</p>}
                    {!item.quote && !item.client_name && <p className="text-xs text-[#9a8d78] italic">No quote added yet</p>}

                    {/* Action buttons */}
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <button onClick={() => startEdit(item)} className="rounded-full bg-[#2a2018] text-[#f3ead9] text-xs px-3 py-1.5 hover:bg-[#3a2e22]">Edit</button>
                      <label className="rounded-full border border-[#d8cbb4] text-[#5b5043] text-xs px-3 py-1.5 cursor-pointer hover:border-[#2a2018]">
                        Replace
                        <input type="file" accept="image/*" className="hidden" onChange={e => onReplacePhoto(item.id, e)} />
                      </label>
                      <button onClick={() => toggleActive(item.id, !item.active)}
                        className={`rounded-full text-xs px-3 py-1.5 ${item.active ? 'border border-[#d8cbb4] text-[#5b5043] hover:border-[#2a2018]' : 'bg-green-100 text-green-800'}`}>
                        {item.active ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="rounded-full border border-red-200 text-red-500 text-xs px-3 py-1.5 hover:bg-red-50">Delete</button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => moveOrder(item.id, -1)} disabled={idx === 0}
                        className="rounded-full border border-[#d8cbb4] text-[#5b5043] text-xs px-3 py-1 disabled:opacity-30">← Move left</button>
                      <button onClick={() => moveOrder(item.id, 1)} disabled={idx === items.length - 1}
                        className="rounded-full border border-[#d8cbb4] text-[#5b5043] text-xs px-3 py-1 disabled:opacity-30">Move right →</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminTestimonials;
