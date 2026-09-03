import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';

interface Lead {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  guests: number | null;
  hat_style: string | null;
  estimated_total: string | null;
  deposit: string | null;
  final_total: string | null;
  notes: string | null;
  consultation_date: string | null;
  confirmed: boolean | null;
  deposit_received: boolean | null;
  source: string | null;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : '—';

const AdminQuoteRequests: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .in('source', ['event-quote-request', 'quote-request'])
      .is('confirmed', false)
      .order('created_at', { ascending: false });
    setLeads((data || []) as Lead[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
    } else {
      setPwError('Incorrect password.');
    }
  };

  const startEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditValues({
      consultation_date: lead.consultation_date || '',
      final_total: lead.final_total || lead.estimated_total || '',
      deposit_received: lead.deposit_received || false,
    });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from('leads').update(editValues).eq('id', id);
    setSaving(false);
    if (error) { flash('err', 'Could not save changes.'); return; }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...editValues } : l));
    setEditingId(null);
    flash('ok', 'Saved!');
  };

  const confirmAndMove = async (lead: Lead) => {
    if (!window.confirm(`Confirm ${lead.name}'s request and move to bookings?`)) return;
    setSaving(true);
    const { error } = await supabase.from('leads').update({ confirmed: true }).eq('id', lead.id);
    setSaving(false);
    if (error) { flash('err', 'Could not confirm.'); return; }
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    flash('ok', `${lead.name}'s request confirmed and moved to bookings!`);
  };

  const deleteLead = async (id: string, name: string | null) => {
    if (!window.confirm(`Delete ${name || 'this request'}? This cannot be undone.`)) return;
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
    flash('ok', 'Request deleted.');
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

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Quote Requests</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/maddhattery-admin/bookings" className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]">Bookings</Link>
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
          <p className="text-[#5b5043] text-sm">{leads.length} pending request{leads.length !== 1 ? 's' : ''}</p>
          <button onClick={fetchLeads} className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm hover:bg-[#f3ead9]">Refresh</button>
        </div>

        {loading ? (
          <p className="text-[#5b5043]">Loading requests…</p>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-10 text-center text-[#7a6e5c]">
            No pending quote requests.
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map(lead => (
              <div key={lead.id} className="bg-white rounded-xl border border-[#e0d4c0] overflow-hidden">
                {/* Header row */}
                <div className="flex items-center justify-between p-5 flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-[#2a2018]">{lead.name || '—'}</p>
                    <p className="text-sm text-[#5b5043]">{lead.email} {lead.phone ? `· ${lead.phone}` : ''}</p>
                    <p className="text-xs text-[#9a8d78] mt-0.5">Submitted {fmtDate(lead.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-right">
                      <p className="text-xs text-[#9a8d78]">Estimated total</p>
                      <p className="font-bold text-[#2a2018]">{lead.estimated_total || '—'}</p>
                    </div>
                    <button onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                      className="rounded-full border border-[#d8cbb4] px-4 py-2 text-sm text-[#5b5043] hover:border-[#2a2018]">
                      {expandedId === lead.id ? 'Hide details' : 'View details'}
                    </button>
                    <button onClick={() => confirmAndMove(lead)} disabled={saving}
                      className="rounded-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
                      Confirm & move to bookings
                    </button>
                    <button onClick={() => deleteLead(lead.id, lead.name)}
                      className="rounded-full border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 text-sm">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === lead.id && (
                  <div className="border-t border-[#e0d4c0] p-5 bg-[#fbf7f0]">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                      <div>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-1">Event type</p>
                        <p className="text-[#2a2018] font-medium">{lead.event_type || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-1">Event date</p>
                        <p className="text-[#2a2018] font-medium">{fmtDate(lead.event_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-1">Event location</p>
                        <p className="text-[#2a2018] font-medium">{lead.event_location || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-1">Guests</p>
                        <p className="text-[#2a2018] font-medium">{lead.guests || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-1">Hat style</p>
                        <p className="text-[#2a2018] font-medium">{lead.hat_style || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-1">Deposit</p>
                        <p className="text-[#2a2018] font-medium">{lead.deposit || '—'}</p>
                      </div>
                      {lead.notes && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-1">Notes & add-ons</p>
                          <p className="text-[#2a2018] whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Editable fields */}
                    <div className="border-t border-[#e0d4c0] pt-4">
                      <p className="text-xs uppercase tracking-wider text-[#9a8d78] mb-3">Admin fields</p>
                      {editingId === lead.id ? (
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-[#7a6e5c] mb-1">Consultation date</label>
                            <input type="date" value={editValues.consultation_date || ''}
                              onChange={e => setEditValues(v => ({ ...v, consultation_date: e.target.value }))}
                              className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#7a6e5c] mb-1">Final total</label>
                            <input type="text" value={editValues.final_total || ''}
                              onChange={e => setEditValues(v => ({ ...v, final_total: e.target.value }))}
                              placeholder="e.g. $3,500"
                              className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                          </div>
                          <div className="flex items-end gap-4 pb-1">
                            <label className="flex items-center gap-2 text-sm text-[#5b5043] cursor-pointer">
                              <input type="checkbox" checked={editValues.deposit_received || false}
                                onChange={e => setEditValues(v => ({ ...v, deposit_received: e.target.checked }))} />
                              Deposit received
                            </label>
                          </div>
                          <div className="sm:col-span-3 flex gap-2">
                            <button onClick={() => saveEdit(lead.id)} disabled={saving}
                              className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-5 py-2 text-sm transition-colors disabled:opacity-50">
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-5 py-2 text-sm hover:bg-[#f6efe4]">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-6 flex-wrap">
                          <div>
                            <p className="text-xs text-[#9a8d78]">Consultation date</p>
                            <p className="text-[#2a2018] font-medium">{fmtDate(lead.consultation_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9a8d78]">Final total</p>
                            <p className="text-[#2a2018] font-medium">{lead.final_total || lead.estimated_total || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9a8d78]">Deposit received</p>
                            <p className={`font-medium ${lead.deposit_received ? 'text-green-700' : 'text-[#9a8d78]'}`}>
                              {lead.deposit_received ? '✓ Yes' : 'Not yet'}
                            </p>
                          </div>
                          <button onClick={() => startEdit(lead)}
                            className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-4 py-1.5 text-sm hover:border-[#2a2018]">
                            Edit
                          </button>
                        </div>
                      )}
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

export default AdminQuoteRequests;
