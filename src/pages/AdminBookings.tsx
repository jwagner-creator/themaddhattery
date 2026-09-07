import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';

interface CustomLineItem {
  label: string;
  price: number;
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
  hat_sizes: string | null;
  guests: number | null;
  hours: number | null;
  estimated_total: string | null;
  deposit: string | null;
  final_total: string | null;
  final_deposit: string | null;
  notes: string | null;
  consultation_date: string | null;
  deposit_received: boolean | null;
  confirmed: boolean | null;
  service_addons: string | null;
  custom_addons: string | null;
  custom_line_items: CustomLineItem[] | null;
  status: string | null;
  created_at: string;
}

const moneyC = (cents: number | null) =>
  ((cents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// Parse text dollar amounts like "$3,500" to numbers
const parseMoney = (s: string | null): number => {
  if (!s) return 0;
  return parseFloat(s.replace(/[$,]/g, '')) || 0;
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

const EVENT_TYPES = [
  'Wedding or bachelorette party',
  "Girls' night & celebrations",
  'Corporate employee appreciation',
  'Corporate client appreciation',
  'Host-sponsored, guest paid',
  'Other private event',
];

const HAT_STYLES = [
  'Western Straw',
  'Flatbrim Faux Suede',
  'Faux Suede Western',
  'Western Australian Wool Felt Flat Brim',
  'Wool Felt Western',
  'Other / Custom',
];

const SERVICE_ADDONS_LIST = [
  'Branding & burning station',
  'Travel outside DFW area',
];

const CUSTOM_ADDONS_LIST = [
  'Hat Bar package — Basic ($20/guest)',
  'Hat Bar package — Premium ($40/guest)',
  'Hat Bar package — Premium Unlimited ($60/guest)',
  'Leather or suede hat band ($10/guest)',
  'Cowhide & suede swatches ($5/guest)',
  'Playing cards ($5/guest)',
  'Leather hat clip ($15/guest)',
  'Hat brush ($10/guest)',
  'Canvas tote bag ($25/guest)',
  'Satin duster bag ($6/guest)',
  'Custom logo or personalized option ($4/guest)',
];

// Edit modal for a confirmed lead/booking
const LeadEditModal: React.FC<{
  lead: Lead;
  onClose: () => void;
  onSaved: (updated: Lead) => void;
  flash: (type: 'ok' | 'err', text: string) => void;
}> = ({ lead, onClose, onSaved, flash }) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(lead.name || '');
  const [email, setEmail] = useState(lead.email || '');
  const [phone, setPhone] = useState(lead.phone || '');
  const [eventType, setEventType] = useState(lead.event_type || '');
  const [eventDate, setEventDate] = useState(lead.event_date || '');
  const [eventLocation, setEventLocation] = useState(lead.event_location || '');
  const [company, setCompany] = useState(lead.company || '');
  const [hatStyle, setHatStyle] = useState(lead.hat_style || '');
  const [guests, setGuests] = useState(lead.guests || 0);
  const [hours, setHours] = useState(lead.hours || 3);
  const [consultationDate, setConsultationDate] = useState(lead.consultation_date || '');
  const [depositReceived, setDepositReceived] = useState(lead.deposit_received || false);
  const [finalTotal, setFinalTotal] = useState(lead.final_total || lead.estimated_total || '');
  const [finalDeposit, setFinalDeposit] = useState(lead.final_deposit || lead.deposit || '');
  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState(lead.status || 'confirmed');
  const [serviceAddons, setServiceAddons] = useState<string[]>(
    lead.service_addons ? lead.service_addons.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [customAddons, setCustomAddons] = useState<string[]>(
    lead.custom_addons ? lead.custom_addons.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [lineItems, setLineItems] = useState<CustomLineItem[]>(lead.custom_line_items || []);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const toggleServiceAddon = (a: string) =>
    setServiceAddons(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const toggleCustomAddon = (a: string) =>
    setCustomAddons(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const addLineItem = () => {
    if (!newItemLabel.trim() || !newItemPrice) return;
    setLineItems(prev => [...prev, { label: newItemLabel.trim(), price: parseFloat(newItemPrice) }]);
    setNewItemLabel(''); setNewItemPrice('');
  };

  const removeLineItem = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    const patch = {
      name, email, phone: phone || null,
      event_type: eventType, event_date: eventDate || null,
      event_location: eventLocation || null, company: company || null,
      hat_style: hatStyle || null, guests, hours,
      consultation_date: consultationDate || null,
      deposit_received: depositReceived,
      final_total: finalTotal || null, final_deposit: finalDeposit || null,
      notes: notes || null, status,
      service_addons: serviceAddons.join(', ') || null,
      custom_addons: customAddons.join(', ') || null,
      custom_line_items: lineItems.length > 0 ? lineItems : null,
    };
    const { error } = await supabase.from('leads').update(patch).eq('id', lead.id);
    setSaving(false);
    if (error) { flash('err', 'Could not save changes.'); return; }
    onSaved({ ...lead, ...patch });
    flash('ok', `Saved changes for ${name}.`);
    onClose();
  };

  const lineItemsTotal = lineItems.reduce((s, i) => s + i.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-[#e0d4c0] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-serif text-xl text-[#2a2018]">Edit booking — {lead.name}</h2>
          <button onClick={onClose} className="text-[#5b5043] hover:text-[#2a2018] text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Contact</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Full name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
            </div>
          </div>

          {/* Event details */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Event details</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Event type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]">
                  <option value="">Select…</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Hat style</label>
                <select value={hatStyle} onChange={e => setHatStyle(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]">
                  <option value="">Select…</option>
                  {HAT_STYLES.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Event date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Event location / venue</label>
                <input value={eventLocation} onChange={e => setEventLocation(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Company (if applicable)</label>
                <input value={company} onChange={e => setCompany(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Guest count</label>
                <input type="number" min={1} value={guests} onChange={e => setGuests(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Hours of service</label>
                <select value={hours} onChange={e => setHours(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]">
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={5}>5 hours</option>
                  <option value={6}>6 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]">
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Service add-ons */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Service add-ons</h3>
            <div className="space-y-2">
              {SERVICE_ADDONS_LIST.map(a => (
                <label key={a} className="flex items-center gap-2 cursor-pointer text-sm text-[#2a2018]">
                  <input type="checkbox" checked={serviceAddons.includes(a)} onChange={() => toggleServiceAddon(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>

          {/* Custom add-ons */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Custom add-ons</h3>
            <div className="space-y-2">
              {CUSTOM_ADDONS_LIST.map(a => (
                <label key={a} className="flex items-center gap-2 cursor-pointer text-sm text-[#2a2018]">
                  <input type="checkbox" checked={customAddons.includes(a)} onChange={() => toggleCustomAddon(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>

          {/* Custom line items */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Custom line items <span className="normal-case font-normal text-[#9a8d78]">(one-off items not in the standard list)</span></h3>
            {lineItems.length > 0 && (
              <div className="space-y-2 mb-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#f6efe4] rounded-lg px-4 py-2.5">
                    <span className="text-sm text-[#2a2018]">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#2a2018]">{fmt(item.price)}</span>
                      <button onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </div>
                  </div>
                ))}
                <div className="text-sm text-right text-[#2a2018] font-semibold pr-1">
                  Line items total: {fmt(lineItemsTotal)}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <input value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)}
                placeholder="Item description (e.g. Custom embroidery)"
                className="flex-1 rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              <input type="number" step="0.01" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                placeholder="$"
                className="w-24 rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              <button onClick={addLineItem}
                className="rounded-lg bg-[#2a2018] text-[#f3ead9] px-4 py-2 text-sm hover:bg-[#3a2e22]">
                Add
              </button>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Financials</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Final total (invoice amount)</label>
                <input value={finalTotal} onChange={e => setFinalTotal(e.target.value)}
                  placeholder="e.g. $3,500"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Final deposit amount</label>
                <input value={finalDeposit} onChange={e => setFinalDeposit(e.target.value)}
                  placeholder="e.g. $1,750"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Consultation date</label>
                <input type="date" value={consultationDate} onChange={e => setConsultationDate(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#2a2018]">
                  <input type="checkbox" checked={depositReceived} onChange={e => setDepositReceived(e.target.checked)} />
                  Deposit received
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Notes</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="Event notes, special requests, add-ons details…"
              className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a] resize-none" />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-[#e0d4c0] px-6 py-4 flex gap-3">
          <button onClick={save} disabled={saving}
            className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-3 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={onClose}
            className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-8 py-3 hover:bg-[#f6efe4]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminBookings: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    const { data } = await supabase
      .from('leads').select('*').eq('confirmed', true).order('created_at', { ascending: false });
    setLeads((data || []) as Lead[]);
    setLeadsLoading(false);
  };

  useEffect(() => {
    if (authed) { fetchLeads(); }
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

  const stats = useMemo(() => {
    const totalGuests = leads.reduce((s, l) => s + (l.guests || 0), 0);
    const totalEvents = leads.length;
    const amountBooked = leads.reduce((s, l) => s + parseMoney(l.final_total || l.estimated_total), 0);
    const amountPaid = leads
      .filter(l => l.deposit_received)
      .reduce((s, l) => s + parseMoney(l.final_deposit || l.deposit), 0);
    return { totalEvents, totalGuests, confirmedLeads: leads.length, amountBooked, amountPaid };
  }, [bookings, leads]);

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
      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSaved={updated => setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))}
          flash={flash}
        />
      )}

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
        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Total events</p>
            <p className="font-serif text-3xl text-[#2a2018]">{stats.totalEvents}</p>
            <p className="text-xs text-[#9a8d78] mt-0.5">{stats.confirmedLeads} confirmed events</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Confirmed bookings</p>
            <p className="font-serif text-3xl text-[#2a2018]">{stats.confirmedLeads}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Total guests booked</p>
            <p className="font-serif text-3xl text-[#2a2018]">{stats.totalGuests}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Amount booked</p>
            <p className="font-serif text-3xl text-[#2a2018]">{fmt(stats.amountBooked)}</p>
            <p className="text-xs text-[#9a8d78] mt-0.5">Total event value</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Amount paid</p>
            <p className="font-serif text-3xl text-green-700">{fmt(stats.amountPaid)}</p>
            <p className="text-xs text-[#9a8d78] mt-0.5">Deposits received</p>
          </div>
        </div>

        {/* Confirmed Quote Requests */}
        <div>
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
              No confirmed quote requests yet. Confirm requests from the{' '}
              <Link to="/maddhattery-admin/quotes" className="text-[#c9a36a] hover:underline">Quote requests page</Link>.
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
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-[#9a8d78]">Final total</p>
                        <p className="font-bold text-[#2a2018]">{lead.final_total || lead.estimated_total || '—'}</p>
                        {lead.deposit_received && <span className="text-xs text-green-700 font-medium block">✓ Deposit received</span>}
                      </div>
                      <button onClick={() => setEditingLead(lead)}
                        className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-4 py-2 text-sm">
                        Edit event
                      </button>
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
                      { label: 'Status', value: lead.status || 'confirmed' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-sm text-[#2a2018] font-medium">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {(lead.service_addons || lead.custom_addons || (lead.custom_line_items && lead.custom_line_items.length > 0)) && (
                    <div className="mt-3 pt-3 border-t border-[#e0d4c0] grid sm:grid-cols-3 gap-3">
                      {lead.service_addons && (
                        <div>
                          <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Service add-ons</p>
                          <p className="text-sm text-[#5b5043]">{lead.service_addons}</p>
                        </div>
                      )}
                      {lead.custom_addons && (
                        <div>
                          <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Custom add-ons</p>
                          <p className="text-sm text-[#5b5043]">{lead.custom_addons}</p>
                        </div>
                      )}
                      {lead.custom_line_items && lead.custom_line_items.length > 0 && (
                        <div>
                          <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Custom line items</p>
                          {lead.custom_line_items.map((item, i) => (
                            <p key={i} className="text-sm text-[#5b5043]">{item.label} — {fmt(item.price)}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {lead.notes && (
                    <div className="mt-3 pt-3 border-t border-[#e0d4c0]">
                      <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Notes</p>
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
