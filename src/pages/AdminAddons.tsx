import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';

interface Addon {
  id: string;
  type: string;
  label: string;
  price_per_guest: number;
  flat_price: number;
  price_label: string;
  note: string | null;
  max_guests: number | null;
  per_staff: boolean;
  active: boolean;
  sort_order: number;
}

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const AdminAddons: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Addon>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddon, setNewAddon] = useState<Partial<Addon>>({
    type: 'custom',
    label: '',
    price_per_guest: 0,
    flat_price: 0,
    price_label: '',
    note: '',
    max_guests: undefined,
    per_staff: false,
    active: true,
  });

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('quote_addons').select('*').order('type').order('sort_order');
    setAddons((data || []) as Addon[]);
    setLoading(false);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
    } else {
      setPwError('Incorrect password.');
    }
  };

  const startEdit = (addon: Addon) => {
    setEditingId(addon.id);
    setEditValues({ ...addon });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase.from('quote_addons').update(editValues).eq('id', editingId);
    setSaving(false);
    if (error) { flash('err', 'Could not save changes.'); return; }
    setAddons(prev => prev.map(a => a.id === editingId ? { ...a, ...editValues } as Addon : a));
    setEditingId(null);
    flash('ok', 'Saved!');
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('quote_addons').update({ active }).eq('id', id);
    setAddons(prev => prev.map(a => a.id === id ? { ...a, active } : a));
  };

  const deleteAddon = async (id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    await supabase.from('quote_addons').delete().eq('id', id);
    setAddons(prev => prev.filter(a => a.id !== id));
    flash('ok', `Deleted "${label}".`);
  };

  const addNew = async () => {
    if (!newAddon.label?.trim()) { flash('err', 'Label is required.'); return; }
    setSaving(true);
    const maxOrder = addons.filter(a => a.type === newAddon.type).reduce((m, a) => Math.max(m, a.sort_order), 0);
    const { data, error } = await supabase.from('quote_addons').insert({
      ...newAddon,
      sort_order: maxOrder + 1,
    }).select().single();
    setSaving(false);
    if (error || !data) { flash('err', 'Could not add add-on.'); return; }
    setAddons(prev => [...prev, data as Addon]);
    setNewAddon({ type: 'custom', label: '', price_per_guest: 0, flat_price: 0, price_label: '', note: '', max_guests: undefined, per_staff: false, active: true });
    setShowAddForm(false);
    flash('ok', `Added "${(data as Addon).label}".`);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6efe4] p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e0d4c0] p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">the maddhattery</p>
          <h1 className="font-serif text-2xl text-[#2a2018] mb-6">Admin Login</h1>
          <input type="password" autoFocus value={pwInput} onChange={e => setPwInput(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a] mb-3" />
          {pwError && <p className="text-sm text-red-600 mb-3">{pwError}</p>}
          <button type="submit" className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3 transition-colors">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  const serviceAddons = addons.filter(a => a.type === 'service');
  const customAddons = addons.filter(a => a.type === 'custom');

  const renderAddonRow = (addon: Addon) => {
    if (editingId === addon.id) {
      return (
        <tr key={addon.id} className="border-t border-[#efe6d6] bg-[#faf3e6]">
          <td className="px-4 py-3" colSpan={7}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Label *</label>
                <input value={editValues.label || ''} onChange={e => setEditValues(v => ({ ...v, label: e.target.value }))}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Price per guest ($)</label>
                <input type="number" step="0.01" value={editValues.price_per_guest || 0}
                  onChange={e => setEditValues(v => ({ ...v, price_per_guest: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Flat price ($)</label>
                <input type="number" step="0.01" value={editValues.flat_price || 0}
                  onChange={e => setEditValues(v => ({ ...v, flat_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Price label (shown to customer)</label>
                <input value={editValues.price_label || ''} onChange={e => setEditValues(v => ({ ...v, price_label: e.target.value }))}
                  placeholder="e.g. $20 / guest"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Max guests (optional)</label>
                <input type="number" value={editValues.max_guests || ''}
                  onChange={e => setEditValues(v => ({ ...v, max_guests: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Leave blank for no limit"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm text-[#5b5043] cursor-pointer">
                  <input type="checkbox" checked={editValues.per_staff || false}
                    onChange={e => setEditValues(v => ({ ...v, per_staff: e.target.checked }))} />
                  Price per staff member
                </label>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs text-[#7a6e5c] mb-1">Note (shown to customer)</label>
                <input value={editValues.note || ''} onChange={e => setEditValues(v => ({ ...v, note: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving}
                className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-5 py-2 text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditingId(null)}
                className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-5 py-2 text-sm hover:bg-[#f6efe4]">
                Cancel
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={addon.id} className={`border-t border-[#efe6d6] ${!addon.active ? 'opacity-50' : ''}`}>
        <td className="px-4 py-3">
          <p className="font-medium text-[#2a2018] text-sm">{addon.label}</p>
          {addon.note && <p className="text-xs text-[#9a8d78] mt-0.5">{addon.note}</p>}
          {addon.max_guests && <p className="text-xs text-[#b8915a] mt-0.5">Max {addon.max_guests} guests</p>}
        </td>
        <td className="px-4 py-3 text-[#2a2018] text-sm">
          {addon.price_per_guest > 0 ? `${money(addon.price_per_guest)}/guest` : '—'}
        </td>
        <td className="px-4 py-3 text-[#2a2018] text-sm">
          {addon.flat_price > 0 ? `${money(addon.flat_price)}${addon.per_staff ? '/staff' : ''}` : '—'}
        </td>
        <td className="px-4 py-3 text-[#5b5043] text-sm">{addon.price_label}</td>
        <td className="px-4 py-3">
          <button onClick={() => toggleActive(addon.id, !addon.active)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${addon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {addon.active ? 'Active' : 'Hidden'}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={() => startEdit(addon)} className="text-xs text-[#c9a36a] hover:underline">Edit</button>
            <button onClick={() => deleteAddon(addon.id, addon.label)} className="text-xs text-red-500 hover:underline">Delete</button>
          </div>
        </td>
      </tr>
    );
  };

  const renderTable = (title: string, items: Addon[]) => (
    <div className="mb-8">
      <h2 className="font-serif text-xl text-[#2a2018] mb-3">{title}</h2>
      <div className="bg-white rounded-xl border border-[#e0d4c0] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f3ead9] text-[#5b5043] text-left">
              <th className="px-4 py-3 font-semibold">Label</th>
              <th className="px-4 py-3 font-semibold">Per guest</th>
              <th className="px-4 py-3 font-semibold">Flat price</th>
              <th className="px-4 py-3 font-semibold">Price label</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[#9a8d78]">No add-ons yet.</td></tr>
            ) : items.map(renderAddonRow)}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Add-ons Manager</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/maddhattery-admin" className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]">Main admin</Link>
            <button onClick={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }}
              className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]">Sign out</button>
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
          <p className="text-[#5b5043] text-sm">Changes appear instantly in the event quote builder — no code needed.</p>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold px-5 py-2.5 text-sm transition-colors">
            {showAddForm ? 'Cancel' : '+ Add new add-on'}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-6 mb-8">
            <h2 className="font-serif text-lg text-[#2a2018] mb-4">New add-on</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Type</label>
                <select value={newAddon.type} onChange={e => setNewAddon(v => ({ ...v, type: e.target.value }))}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2.5 text-sm outline-none focus:border-[#c9a36a]">
                  <option value="custom">Custom add-on (per guest)</option>
                  <option value="service">Service add-on (flat rate)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#7a6e5c] mb-1">Label *</label>
                <input value={newAddon.label || ''} onChange={e => setNewAddon(v => ({ ...v, label: e.target.value }))}
                  placeholder="e.g. Custom hat pin set"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2.5 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              {newAddon.type === 'custom' ? (
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Price per guest ($)</label>
                  <input type="number" step="0.01" value={newAddon.price_per_guest || ''}
                    onChange={e => setNewAddon(v => ({ ...v, price_per_guest: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2.5 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Flat price ($)</label>
                  <input type="number" step="0.01" value={newAddon.flat_price || ''}
                    onChange={e => setNewAddon(v => ({ ...v, flat_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2.5 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
              )}
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Price label (shown to customer)</label>
                <input value={newAddon.price_label || ''} onChange={e => setNewAddon(v => ({ ...v, price_label: e.target.value }))}
                  placeholder="e.g. $15 / guest or $8-$12 / guest"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2.5 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Max guests (optional)</label>
                <input type="number" value={newAddon.max_guests || ''}
                  onChange={e => setNewAddon(v => ({ ...v, max_guests: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="Leave blank for no limit"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2.5 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs text-[#7a6e5c] mb-1">Note (optional)</label>
                <input value={newAddon.note || ''} onChange={e => setNewAddon(v => ({ ...v, note: e.target.value }))}
                  placeholder="Description shown to customers"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2.5 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              {newAddon.type === 'service' && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="per_staff" checked={newAddon.per_staff || false}
                    onChange={e => setNewAddon(v => ({ ...v, per_staff: e.target.checked }))} />
                  <label htmlFor="per_staff" className="text-sm text-[#5b5043]">Price per staff member</label>
                </div>
              )}
            </div>
            <button onClick={addNew} disabled={saving}
              className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-3 text-sm transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : 'Add add-on'}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-[#5b5043]">Loading add-ons…</p>
        ) : (
          <>
            {renderTable('Service add-ons', serviceAddons)}
            {renderTable('Custom add-ons (per guest)', customAddons)}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminAddons;
