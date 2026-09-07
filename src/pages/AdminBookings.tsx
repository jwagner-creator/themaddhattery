import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  event_type: string | null;
  budget_tier: string | null;
  guests: number | null;
  hours: number | null;
  estimated_total: number | null;
  deposit_amount: number | null;
  status: string | null;
  event_date: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  company: string | null;
  hat_style: string | null;
  guests: number | null;
  estimated_total: string | null;
  deposit: string | null;
  final_total: string | null;
  notes: string | null;
  consultation_date: string | null;
  deposit_received: boolean | null;
  confirmed: boolean | null;
  created_at: string;
}

const moneyC = (cents: number | null) =>
  ((cents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const STATUS_OPTIONS = ['deposit_paid', 'confirmed', 'completed', 'cancelled'];

const statusStyles: Record<string, string> = {
  deposit_paid: 'bg-amber-100 text-amber-800 border-amber-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const fmtDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const NAV_LINKS = [
  { to: '/', label: 'View site' },
  { to: '/maddhattery-admin', label: 'Gallery' },
  { to: '/maddhattery-admin/photos', label: 'Hat-bar photos' },
  { to: '/maddhattery-admin/bookings', label: 'Bookings' },
  { to: '/maddhattery-admin/design', label: 'Hat design' },
  { to: '/maddhattery-admin/wholesale', label: 'Wholesale' },
  { to: '/maddhattery-admin/quotes', label: 'Quote requests' },
  { to: '/maddhattery-admin/addons', label: 'Add-ons' },
];

const AdminBookings: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dateField, setDateField] = useState<'event_date' | 'created_at'>('created_at');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('hat_bar_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError('Could not load bookings.');
    else setBookings((data as Booking[]) || []);
    setLoading(false);
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    const { data, error: err } = await supabase
      .from('leads')
      .select('*')
      .eq('confirmed', true)
      .order('created_at', { ascending: false });
    if (!err) setLeads((data || []) as Lead[]);
    setLeadsLoading(false);
  };

  useEffect(() => {
    if (authed) { fetchBookings(); fetchLeads(); }
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
      setPwError('');
    } else {
      setPwError('Incorrect password.');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const prev = bookings;
    setBookings(b => b.map(bk => bk.id === id ? { ...bk, status } : bk));
    const { error: err } = await supabase.from('hat_bar_bookings').update({ status }).eq('id', id);
    if (err) { setBookings(prev); setError('Failed to update status.'); }
    setUpdatingId(null);
  };

  const view = useMemo(() => {
    let list = [...bookings];
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
    list.sort((a, b) => {
      const av = a[dateField] ? new Date(a[dateField] as string).getTime() : 0;
      const bv = b[dateField] ? new Date(b[dateField] as string).getTime() : 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [bookings, statusFilter, sortDir, dateField]);

  const stats = useMemo(() => ({
    count: bookings.length,
    totalDeposits: bookings.reduce((s, b) => s + (b.deposit_amount || 0), 0),
    guests: bookings.reduce((s, b) => s + (b.guests || 0), 0),
  }), [bookings]);

  const signOut = () => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); };

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
          <button type="submit" className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3 transition-colors">Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
              <h1 className="font-serif text-2xl">Bookings Dashboard</h1>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22] transition-colors">{l.label}</Link>
            ))}
            <button onClick={signOut} className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22] transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Total bookings</p>
            <p className="font-serif text-3xl text-[#2a2018]">{stats.count}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Deposits collected</p>
            <p className="font-serif text-3xl text-[#2a2018]">{moneyC(stats.totalDeposits)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Total guests booked</p>
            <p className="font-serif text-3xl text-[#2a2018]">{stats.guests}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#5b5043]">Sort by</label>
            <select value={dateField} onChange={e => setDateField(e.target.value as 'event_date' | 'created_at')}
              className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a36a]">
              <option value="created_at">Booked date</option>
              <option value="event_date">Event date</option>
            </select>
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm hover:bg-[#f3ead9]">
              {sortDir === 'asc' ? 'Oldest first ↑' : 'Newest first ↓'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#5b5043]">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a36a] capitalize">
              <option value="all">All</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button onClick={() => { fetchBookings(); fetchLeads(); }}
            className="ml-auto rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm hover:bg-[#f3ead9]">
            Refresh
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {/* Hat bar bookings table */}
        <div className="bg-white rounded-xl border border-[#e0d4c0] overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-[#7a6e5c]">Loading bookings…</div>
          ) : view.length === 0 ? (
            <div className="p-10 text-center text-[#7a6e5c]">No hat bar bookings found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f3ead9] text-[#5b5043] text-left">
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold text-center">Guests</th>
                  <th className="px-4 py-3 font-semibold text-right">Deposit</th>
                  <th className="px-4 py-3 font-semibold text-right">Est. total</th>
                  <th className="px-4 py-3 font-semibold">Event date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {view.map(b => (
                  <tr key={b.id} className="border-t border-[#efe6d6] align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#2a2018]">{b.name || '—'}</div>
                      <div className="text-xs text-[#9a8d78]">Booked {fmtDate(b.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-[#5b5043]">
                      <div className="truncate max-w-[180px]">{b.email || '—'}</div>
                      <div className="text-xs text-[#9a8d78]">{b.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3 text-[#5b5043] max-w-[180px]">{b.event_type || '—'}</td>
                    <td className="px-4 py-3 text-center text-[#2a2018]">{b.guests ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#2a2018]">{moneyC(b.deposit_amount)}</td>
                    <td className="px-4 py-3 text-right text-[#5b5043]">{moneyC(b.estimated_total)}</td>
                    <td className="px-4 py-3 text-[#2a2018]">{fmtDate(b.event_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[b.status || ''] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {(b.status || 'unknown').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {b.status !== 'confirmed' && b.status !== 'completed' && (
                          <button disabled={updatingId === b.id} onClick={() => updateStatus(b.id, 'confirmed')}
                            className="rounded-md bg-blue-600 text-white text-xs px-2.5 py-1 hover:bg-blue-700 disabled:opacity-50">
                            Mark confirmed
                          </button>
                        )}
                        {b.status !== 'completed' && (
                          <button disabled={updatingId === b.id} onClick={() => updateStatus(b.id, 'completed')}
                            className="rounded-md bg-green-600 text-white text-xs px-2.5 py-1 hover:bg-green-700 disabled:opacity-50">
                            Mark completed
                          </button>
                        )}
                        {b.status === 'completed' && <span className="text-xs text-[#9a8d78]">Done</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Confirmed Quote Requests */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl text-[#2a2018]">Confirmed Quote Requests</h2>
              <p className="text-sm text-[#7a6e5c] mt-0.5">{leads.length} confirmed event quote{leads.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {leadsLoading ? (
            <p className="text-[#5b5043]">Loading…</p>
          ) : leads.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e0d4c0] p-8 text-center text-[#7a6e5c]">
              No confirmed quote requests yet. Confirm requests from the <Link to="/maddhattery-admin/quotes" className="text-[#c9a36a] hover:underline">Quote requests page</Link>.
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map(lead => (
                <div key={lead.id} className="bg-white rounded-xl border border-[#e0d4c0] p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold text-[#2a2018]">{lead.name || '—'}</p>
                      <p className="text-sm text-[#5b5043]">{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</p>
                      <p className="text-xs text-[#9a8d78] mt-0.5">Submitted {fmtDate(lead.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#9a8d78]">Estimated total</p>
                      <p className="font-bold text-[#2a2018]">{lead.final_total || lead.estimated_total || '—'}</p>
                      {lead.deposit_received && <span className="text-xs text-green-700 font-medium">✓ Deposit received</span>}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#e0d4c0]">
                    {[
                      { label: 'Event type', value: lead.event_type },
                      { label: 'Event date', value: fmtDate(lead.event_date) },
                      { label: 'Location', value: lead.event_location },
                      { label: 'Guests', value: lead.guests?.toString() },
                      { label: 'Hat style', value: lead.hat_style },
                      { label: 'Company', value: lead.company },
                      { label: 'Consultation date', value: fmtDate(lead.consultation_date) },
                      { label: 'Deposit', value: lead.deposit },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-sm text-[#2a2018] font-medium">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {lead.notes && (
                    <div className="mt-3 pt-3 border-t border-[#e0d4c0]">
                      <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Notes & add-ons</p>
                      <p className="text-sm text-[#5b5043] whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminBookings;
