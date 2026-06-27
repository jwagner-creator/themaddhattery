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
  estimated_total: number | null; // cents
  deposit_amount: number | null; // cents
  status: string | null;
  event_date: string | null;
  created_at: string;
}

const money = (cents: number | null) =>
  ((cents || 0) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

const STATUS_OPTIONS = ['deposit_paid', 'confirmed', 'completed', 'cancelled'];

const statusStyles: Record<string, string> = {
  deposit_paid: 'bg-amber-100 text-amber-800 border-amber-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const fmtDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const AdminBookings: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (err) {
      setError('Could not load bookings.');
    } else {
      setBookings((data as Booking[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchBookings();
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
    setBookings((b) => b.map((bk) => (bk.id === id ? { ...bk, status } : bk)));
    const { error: err } = await supabase
      .from('hat_bar_bookings')
      .update({ status })
      .eq('id', id);
    if (err) {
      setBookings(prev); // revert
      setError('Failed to update status.');
    }
    setUpdatingId(null);
  };

  const view = useMemo(() => {
    let list = [...bookings];
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    list.sort((a, b) => {
      const av = a[dateField] ? new Date(a[dateField] as string).getTime() : 0;
      const bv = b[dateField] ? new Date(b[dateField] as string).getTime() : 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [bookings, statusFilter, sortDir, dateField]);

  const stats = useMemo(() => {
    const totalDeposits = bookings.reduce((s, b) => s + (b.deposit_amount || 0), 0);
    const guests = bookings.reduce((s, b) => s + (b.guests || 0), 0);
    return { count: bookings.length, totalDeposits, guests };
  }, [bookings]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6efe4] p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e0d4c0] p-8"
        >
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
          <button
            type="submit"
            className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3 transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Bookings Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
           <Link
  to="/maddhattery-admin/photos"
  className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]"
>
  Manage photos
</Link>
<Link
  to="/maddhattery-admin"
  className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]"
>
  Custom gallery
</Link>

            <button
              onClick={() => {
                sessionStorage.removeItem(AUTH_KEY);
                setAuthed(false);
              }}
              className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]"
            >
              Sign out
            </button>
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
            <p className="font-serif text-3xl text-[#2a2018]">{money(stats.totalDeposits)}</p>
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
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value as 'event_date' | 'created_at')}
              className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a36a]"
            >
              <option value="created_at">Booked date</option>
              <option value="event_date">Event date</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm hover:bg-[#f3ead9]"
            >
              {sortDir === 'asc' ? 'Oldest first ↑' : 'Newest first ↓'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#5b5043]">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a36a] capitalize"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchBookings}
            className="ml-auto rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm hover:bg-[#f3ead9]"
          >
            Refresh
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e0d4c0] overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-[#7a6e5c]">Loading bookings…</div>
          ) : view.length === 0 ? (
            <div className="p-10 text-center text-[#7a6e5c]">No bookings found.</div>
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
                {view.map((b) => (
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
                    <td className="px-4 py-3 text-right font-medium text-[#2a2018]">{money(b.deposit_amount)}</td>
                    <td className="px-4 py-3 text-right text-[#5b5043]">{money(b.estimated_total)}</td>
                    <td className="px-4 py-3 text-[#2a2018]">{fmtDate(b.event_date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          statusStyles[b.status || ''] || 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        {(b.status || 'unknown').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {b.status !== 'confirmed' && b.status !== 'completed' && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => updateStatus(b.id, 'confirmed')}
                            className="rounded-md bg-blue-600 text-white text-xs px-2.5 py-1 hover:bg-blue-700 disabled:opacity-50"
                          >
                            Mark confirmed
                          </button>
                        )}
                        {b.status !== 'completed' && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => updateStatus(b.id, 'completed')}
                            className="rounded-md bg-green-600 text-white text-xs px-2.5 py-1 hover:bg-green-700 disabled:opacity-50"
                          >
                            Mark completed
                          </button>
                        )}
                        {b.status === 'completed' && (
                          <span className="text-xs text-[#9a8d78]">Done</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminBookings;
