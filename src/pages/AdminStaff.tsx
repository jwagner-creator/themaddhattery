import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';

const NAV_LINKS = [
  { to: '/', label: 'View site' },
  { to: '/maddhattery-admin', label: 'Gallery' },
  { to: '/maddhattery-admin/quotes', label: 'Quote requests' },
  { to: '/maddhattery-admin/bookings', label: 'Proposals' },
  { to: '/maddhattery-admin/events', label: 'Event manager' },
  { to: '/maddhattery-admin/staff', label: 'Staff roster' },
  { to: '/maddhattery-admin/addons', label: 'Add-ons' },
  { to: '/maddhattery-admin/testimonials', label: 'Testimonials' },
];

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  role: string | null;
  default_rate: number;
  active: boolean;
  notes: string | null;
}

const blank = (): Omit<StaffMember, 'id'> => ({
  name: '', email: '', phone: '', location: '', role: '',
  default_rate: 0, active: true, notes: '',
});

const AdminStaff: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<StaffMember>>({});
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    if (authed) {
      supabase.from('staff').select('*').order('name').then(({ data }) => {
        setStaff((data || []) as StaffMember[]);
        setLoading(false);
      });
    }
  }, [authed]);

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from('staff').update(editValues).eq('id', id);
    setSaving(false);
    if (error) { flash('err', 'Could not save.'); return; }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...editValues } as StaffMember : s));
    setEditingId(null);
    flash('ok', 'Saved!');
  };

  const addMember = async () => {
    if (!newMember.name.trim()) { flash('err', 'Name is required.'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('staff').insert(newMember).select().single();
    setSaving(false);
    if (error || !data) { flash('err', 'Could not add.'); return; }
    setStaff(prev => [...prev, data as StaffMember].sort((a, b) => a.name.localeCompare(b.name)));
    setNewMember(blank());
    setAdding(false);
    flash('ok', `${newMember.name} added to roster!`);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('staff').update({ active }).eq('id', id);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active } : s));
  };

  const deleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the roster?`)) return;
    await supabase.from('staff').delete().eq('id', id);
    setStaff(prev => prev.filter(s => s.id !== id));
    flash('ok', `${name} removed.`);
  };

  const fmt = (n: number) => `$${n.toFixed(2)}/hr`;

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

  const inputClass = "w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]";

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Staff Roster</h1>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-[#5b5043] text-sm">{staff.filter(s => s.active).length} active · {staff.length} total</p>
          <button onClick={() => setAdding(true)}
            className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-6 py-2.5 text-sm">
            + Add staff member
          </button>
        </div>

        {/* Add new member form */}
        {adding && (
          <div className="bg-white rounded-2xl border border-[#e0d4c0] p-6 mb-6">
            <h3 className="font-medium text-[#2a2018] mb-4">New staff member</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Name *</label>
                <input value={newMember.name} onChange={e => setNewMember(v => ({ ...v, name: e.target.value }))}
                  placeholder="Full name" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Role</label>
                <input value={newMember.role || ''} onChange={e => setNewMember(v => ({ ...v, role: e.target.value }))}
                  placeholder="e.g. Lead stylist, Assistant" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Default rate ($/hr)</label>
                <input type="number" step="0.01" value={newMember.default_rate || ''}
                  onChange={e => setNewMember(v => ({ ...v, default_rate: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Email</label>
                <input type="email" value={newMember.email || ''} onChange={e => setNewMember(v => ({ ...v, email: e.target.value }))}
                  placeholder="email@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Phone</label>
                <input type="tel" value={newMember.phone || ''} onChange={e => setNewMember(v => ({ ...v, phone: e.target.value }))}
                  placeholder="555-555-5555" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Location (city)</label>
                <input value={newMember.location || ''} onChange={e => setNewMember(v => ({ ...v, location: e.target.value }))}
                  placeholder="Dallas, TX" className={inputClass} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs text-[#7a6e5c] mb-1">Notes</label>
                <input value={newMember.notes || ''} onChange={e => setNewMember(v => ({ ...v, notes: e.target.value }))}
                  placeholder="Skills, availability, etc." className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={addMember} disabled={saving}
                className="rounded-full bg-[#2a2018] text-[#f3ead9] font-semibold px-6 py-2.5 text-sm hover:bg-[#3a2e22] disabled:opacity-50">
                {saving ? 'Adding…' : 'Add to roster'}
              </button>
              <button onClick={() => { setAdding(false); setNewMember(blank()); }}
                className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-6 py-2.5 text-sm hover:bg-[#f6efe4]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Staff list */}
        {loading ? (
          <p className="text-[#5b5043]">Loading…</p>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-10 text-center text-[#7a6e5c]">
            No staff yet. Click <strong>+ Add staff member</strong> to build your roster!
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map(member => (
              <div key={member.id} className={`bg-white rounded-xl border p-5 ${member.active ? 'border-[#e0d4c0]' : 'border-dashed border-[#d0c4b0] opacity-60'}`}>
                {editingId === member.id ? (
                  <div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Name</label>
                        <input value={editValues.name || ''} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Role</label>
                        <input value={editValues.role || ''} onChange={e => setEditValues(v => ({ ...v, role: e.target.value }))}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Default rate ($/hr)</label>
                        <input type="number" step="0.01" value={editValues.default_rate || ''}
                          onChange={e => setEditValues(v => ({ ...v, default_rate: parseFloat(e.target.value) || 0 }))}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Email</label>
                        <input type="email" value={editValues.email || ''} onChange={e => setEditValues(v => ({ ...v, email: e.target.value }))}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Phone</label>
                        <input type="tel" value={editValues.phone || ''} onChange={e => setEditValues(v => ({ ...v, phone: e.target.value }))}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Location</label>
                        <input value={editValues.location || ''} onChange={e => setEditValues(v => ({ ...v, location: e.target.value }))}
                          className={inputClass} />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs text-[#7a6e5c] mb-1">Notes</label>
                        <input value={editValues.notes || ''} onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                          className={inputClass} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => saveEdit(member.id)} disabled={saving}
                        className="rounded-full bg-[#c9a36a] text-[#2a2018] font-semibold px-6 py-2 text-sm hover:bg-[#b8915a] disabled:opacity-50">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-6 py-2 text-sm hover:bg-[#f6efe4]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#2a2018]">{member.name}</p>
                        {member.role && <span className="text-xs bg-[#f3ead9] text-[#5b5043] rounded-full px-2 py-0.5">{member.role}</span>}
                        {!member.active && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Inactive</span>}
                      </div>
                      <div className="flex gap-4 text-sm text-[#7a6e5c] flex-wrap">
                        {member.default_rate > 0 && <span className="font-medium text-[#c9a36a]">{fmt(member.default_rate)}</span>}
                        {member.location && <span>📍 {member.location}</span>}
                        {member.email && <span>✉ {member.email}</span>}
                        {member.phone && <span>📞 {member.phone}</span>}
                      </div>
                      {member.notes && <p className="text-xs text-[#9a8d78] mt-1">{member.notes}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setEditingId(member.id); setEditValues({ ...member }); }}
                        className="rounded-full border border-[#d8cbb4] text-[#5b5043] text-xs px-3 py-1.5 hover:border-[#2a2018]">Edit</button>
                      <button onClick={() => toggleActive(member.id, !member.active)}
                        className="rounded-full border border-[#d8cbb4] text-[#5b5043] text-xs px-3 py-1.5 hover:border-[#2a2018]">
                        {member.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteMember(member.id, member.name)}
                        className="rounded-full border border-red-200 text-red-500 text-xs px-3 py-1.5 hover:bg-red-50">Remove</button>
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

export default AdminStaff;
