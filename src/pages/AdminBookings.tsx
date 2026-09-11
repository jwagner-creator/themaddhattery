import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';

const STYLIST_HOURLY_RATE = 25;
const TRAVEL_RATE_PER_STAFF = 100;
const BRANDING_RATE = 150;

interface CustomLineItem { label: string; price: number; }

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
  hat_price_per_guest: number | null;
  guests: number | null;
  hours: number | null;
  estimated_total: string | null;
  deposit: string | null;
  final_total: string | null;
  final_deposit: string | null;
  amount_paid: number | null;
  notes: string | null;
  consultation_date: string | null;
  deposit_received: boolean | null;
  confirmed: boolean | null;
  service_addons: string | null;
  custom_addons: string | null;
  custom_line_items: CustomLineItem[] | null;
  status: string | null;
  taxable: boolean | null;
  tax_rate: number | null;
  created_at: string;
}

const parseMoney = (s: string | null | number): number => {
  if (!s) return 0;
  if (typeof s === 'number') return s;
  return parseFloat(String(s).replace(/[$,]/g, '')) || 0;
};

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtRound = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const getTeamSize = (guests: number) => {
  if (guests <= 10) return 2;
  if (guests <= 50) return 3;
  if (guests <= 100) return 4;
  if (guests <= 200) return 5;
  if (guests <= 400) return 6;
  if (guests <= 700) return 7;
  return 8;
};

const getBranderCount = (guests: number) => Math.min(Math.ceil(guests / 25), 3);

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

const SERVICE_ADDONS_LIST = [
  { id: 'branding', label: 'Branding & burning station', price: BRANDING_RATE, perBrander: true },
  { id: 'travel', label: 'Travel outside DFW area', price: TRAVEL_RATE_PER_STAFF, perStaff: true },
];

const CUSTOM_ADDONS_LIST = [
  { id: 'hat-bar-basic', label: 'Hat Bar — Basic', pricePerGuest: 20 },
  { id: 'hat-bar-premium', label: 'Hat Bar — Premium', pricePerGuest: 40 },
  { id: 'hat-bar-unlimited', label: 'Hat Bar — Premium Unlimited', pricePerGuest: 60 },
  { id: 'leather-band', label: 'Leather or suede hat band', pricePerGuest: 10 },
  { id: 'cowhide-suede', label: 'Cowhide & suede swatches', pricePerGuest: 5 },
  { id: 'cards', label: 'Playing cards', pricePerGuest: 5 },
  { id: 'hat-clip', label: 'Leather hat clip', pricePerGuest: 15 },
  { id: 'hat-brush', label: 'Hat brush', pricePerGuest: 10 },
  { id: 'canvas-tote', label: 'Canvas tote bag', pricePerGuest: 25 },
  { id: 'satin-duster', label: 'Satin duster bag', pricePerGuest: 6 },
  { id: 'custom-logo', label: 'Custom logo/personalized', pricePerGuest: 4 },
];

// Invoice generator
const generateInvoice = (lead: Lead, calc: ReturnType<typeof calcTotals>) => {
  const w = window.open('', '_blank');
  if (!w) return;
  const lineRows = [
    lead.hat_price_per_guest && lead.guests ? `<tr><td>${lead.hat_style || 'Hat'}</td><td class="r">${fmt(lead.hat_price_per_guest)}/guest × ${lead.guests}</td><td class="r">${fmt(lead.hat_price_per_guest * lead.guests)}</td></tr>` : '',
    calc.stylistTotal > 0 ? `<tr><td>Stylist team (${getTeamSize(lead.guests || 0)} staff × $${STYLIST_HOURLY_RATE}/hr × ${lead.hours || 0} hrs)</td><td class="r"></td><td class="r">${fmt(calc.stylistTotal)}</td></tr>` : '',
    calc.brandingTotal > 0 ? `<tr><td>Branding & burning station (${getBranderCount(lead.guests || 0)} brander${getBranderCount(lead.guests || 0) > 1 ? 's' : ''})</td><td class="r"></td><td class="r">${fmt(calc.brandingTotal)}</td></tr>` : '',
    calc.travelTotal > 0 ? `<tr><td>Travel outside DFW (${getTeamSize(lead.guests || 0)} staff × $${TRAVEL_RATE_PER_STAFF})</td><td class="r"></td><td class="r">${fmt(calc.travelTotal)}</td></tr>` : '',
    ...CUSTOM_ADDONS_LIST.filter(a => (lead.custom_addons || '').includes(a.id)).map(a =>
      `<tr><td>${a.label} (× ${lead.guests || 0} guests)</td><td class="r">${fmt(a.pricePerGuest)}/guest</td><td class="r">${fmt(a.pricePerGuest * (lead.guests || 0))}</td></tr>`
    ),
    ...(lead.custom_line_items || []).map(i =>
      `<tr><td>${i.label}</td><td class="r"></td><td class="r">${fmt(i.price)}</td></tr>`
    ),
  ].filter(Boolean).join('');

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice — ${lead.name}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #2a2018; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
    .brand h1 { font-size: 28px; margin: 0; color: #2a2018; }
    .brand p { margin: 4px 0 0; color: #7a6e5c; font-size: 14px; }
    .invoice-info { text-align: right; font-size: 14px; color: #5b5043; }
    .invoice-info h2 { font-size: 22px; color: #c9a36a; margin: 0 0 8px; }
    .client { background: #f6efe4; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
    .client h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #9a8d78; }
    .client p { margin: 3px 0; font-size: 15px; }
    .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; font-size: 14px; }
    .event-details div { }
    .event-details label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #9a8d78; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #2a2018; color: #f3ead9; }
    thead td { padding: 10px 12px; font-size: 13px; }
    tbody tr { border-bottom: 1px solid #e0d4c0; }
    tbody td { padding: 10px 12px; font-size: 14px; }
    .r { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals tr td { padding: 6px 12px; font-size: 14px; }
    .totals .total-row td { font-size: 18px; font-weight: bold; border-top: 2px solid #2a2018; padding-top: 10px; }
    .totals .balance-row td { font-size: 20px; font-weight: bold; color: #c9a36a; }
    .paid-row td { color: green; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e0d4c0; font-size: 12px; color: #9a8d78; text-align: center; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <div class="header">
    <div class="brand">
      <h1>the maddhattery</h1>
      <p>by VinHaus Boutique & Hat Bar</p>
      <p>hello@thevinhaus.com</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p>Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      ${lead.event_date ? `<p>Event date: ${fmtDate(lead.event_date)}</p>` : ''}
    </div>
  </div>

  <div class="client">
    <h3>Bill to</h3>
    <p><strong>${lead.name || '—'}</strong></p>
    ${lead.company ? `<p>${lead.company}</p>` : ''}
    ${lead.email ? `<p>${lead.email}</p>` : ''}
    ${lead.phone ? `<p>${lead.phone}</p>` : ''}
  </div>

  <div class="event-details">
    ${lead.event_type ? `<div><label>Event type</label>${lead.event_type}</div>` : ''}
    ${lead.event_date ? `<div><label>Event date</label>${fmtDate(lead.event_date)}</div>` : ''}
    ${lead.event_location ? `<div><label>Venue</label>${lead.event_location}</div>` : ''}
    ${lead.guests ? `<div><label>Guests</label>${lead.guests}</div>` : ''}
    ${lead.hours ? `<div><label>Hours of service</label>${lead.hours} hours</div>` : ''}
  </div>

  <table>
    <thead><tr><td>Description</td><td class="r">Rate</td><td class="r">Amount</td></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="r">${fmt(calc.subtotal)}</td></tr>
    ${calc.taxTotal > 0 ? `<tr><td>Sales tax (${((lead.tax_rate || 0.0625) * 100).toFixed(2)}%)</td><td class="r">${fmt(calc.taxTotal)}</td></tr>` : '<tr><td>Sales tax</td><td class="r">Exempt</td></tr>'}
    <tr class="total-row"><td>Total</td><td class="r">${fmt(calc.total)}</td></tr>
    ${calc.amountPaid > 0 ? `<tr class="paid-row"><td>Amount paid</td><td class="r">(${fmt(calc.amountPaid)})</td></tr>` : ''}
    <tr class="balance-row"><td>Balance due</td><td class="r">${fmt(calc.balanceDue)}</td></tr>
  </table>

  ${lead.notes ? `<div style="margin-top:30px;padding:16px;background:#f6efe4;border-radius:8px;font-size:13px;color:#5b5043;"><strong>Notes:</strong> ${lead.notes}</div>` : ''}

  <div class="footer">
    <p>the maddhattery by VinHaus · hello@thevinhaus.com · Thank you for your business!</p>
    <p>Payment due upon receipt. Set up, break down, and travel time billed separately if applicable.</p>
  </div>
  <script>window.print();</script>
  </body></html>`);
  w.document.close();
};

const calcTotals = (
  guests: number,
  hours: number,
  hatPricePerGuest: number,
  serviceAddons: string[],
  customAddons: string[],
  lineItems: CustomLineItem[],
  taxable: boolean,
  taxRate: number
) => {
  const teamSize = getTeamSize(guests);
  const branderCount = getBranderCount(guests);
  const hatTotal = hatPricePerGuest * guests;
  const stylistTotal = teamSize * STYLIST_HOURLY_RATE * hours;
  const brandingTotal = serviceAddons.includes('branding') ? BRANDING_RATE * branderCount : 0;
  const travelTotal = serviceAddons.includes('travel') ? TRAVEL_RATE_PER_STAFF * teamSize : 0;
  const customTotal = CUSTOM_ADDONS_LIST
    .filter(a => customAddons.includes(a.id))
    .reduce((s, a) => s + a.pricePerGuest * guests, 0);
  const lineItemsTotal = lineItems.reduce((s, i) => s + i.price, 0);
  const subtotal = hatTotal + stylistTotal + brandingTotal + travelTotal + customTotal + lineItemsTotal;
  const taxTotal = taxable ? Math.round(subtotal * taxRate * 100) / 100 : 0;
  const total = subtotal + taxTotal;
  const depositAmount = Math.round(total / 2 * 100) / 100;
  return { hatTotal, stylistTotal, brandingTotal, travelTotal, customTotal, lineItemsTotal, subtotal, taxTotal, total, depositAmount, teamSize, branderCount };
};

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
  const [hatPricePerGuest, setHatPricePerGuest] = useState(lead.hat_price_per_guest || 0);
  const [guests, setGuests] = useState(lead.guests || 0);
  const [hours, setHours] = useState(lead.hours || 3);
  const [consultationDate, setConsultationDate] = useState(lead.consultation_date || '');
  const [depositReceived, setDepositReceived] = useState(lead.deposit_received || false);
  const [amountPaid, setAmountPaid] = useState(lead.amount_paid || 0);
  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState(lead.status || 'confirmed');
  const [taxable, setTaxable] = useState(lead.taxable !== false);
  const [taxRate, setTaxRate] = useState(lead.tax_rate || 0.0625);
  const [serviceAddons, setServiceAddons] = useState<string[]>(
    lead.service_addons ? lead.service_addons.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [customAddons, setCustomAddonsList] = useState<string[]>(
    lead.custom_addons ? lead.custom_addons.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [lineItems, setLineItems] = useState<CustomLineItem[]>(lead.custom_line_items || []);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const calc = useMemo(() =>
    calcTotals(guests, hours, hatPricePerGuest, serviceAddons, customAddons, lineItems, taxable, taxRate),
    [guests, hours, hatPricePerGuest, serviceAddons, customAddons, lineItems, taxable, taxRate]
  );

  const balanceDue = calc.total - amountPaid;

  const toggleService = (id: string) =>
    setServiceAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleCustom = (id: string) =>
    setCustomAddonsList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const addLineItem = () => {
    if (!newItemLabel.trim() || !newItemPrice) return;
    setLineItems(prev => [...prev, { label: newItemLabel.trim(), price: parseFloat(newItemPrice) }]);
    setNewItemLabel(''); setNewItemPrice('');
  };

  const save = async () => {
    setSaving(true);
    const patch = {
      name, email, phone: phone || null,
      event_type: eventType, event_date: eventDate || null,
      event_location: eventLocation || null, company: company || null,
      hat_style: hatStyle || null, hat_price_per_guest: hatPricePerGuest || null,
      guests, hours, consultation_date: consultationDate || null,
      deposit_received: depositReceived, amount_paid: amountPaid,
      final_total: fmt(calc.total),
      final_deposit: fmt(calc.depositAmount),
      notes: notes || null, status, taxable, tax_rate: taxRate,
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

  const handleInvoice = () => {
    const fullLead = {
      ...lead, name, email, phone, event_type: eventType, event_date: eventDate,
      event_location: eventLocation, company, hat_style: hatStyle,
      hat_price_per_guest: hatPricePerGuest, guests, hours,
      custom_addons: customAddons.join(', '), custom_line_items: lineItems,
      service_addons: serviceAddons.join(', '), taxable, tax_rate: taxRate,
    };
    generateInvoice(fullLead, { ...calc, amountPaid, balanceDue });
  };

  const Row: React.FC<{ label: string; value: string; sub?: string; bold?: boolean }> = ({ label, value, sub, bold }) => (
    <div className={`flex justify-between items-baseline py-2 border-b border-[#f0e8d8] ${bold ? 'font-bold text-[#2a2018]' : 'text-[#5b5043]'}`}>
      <span className="text-sm">{label}{sub && <span className="text-xs text-[#9a8d78] ml-1">{sub}</span>}</span>
      <span className={`text-sm ${bold ? 'text-lg' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-[#e0d4c0] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-serif text-xl text-[#2a2018]">Edit booking — {lead.name}</h2>
          <div className="flex gap-2">
            <button onClick={handleInvoice}
              className="rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold px-5 py-2 text-sm">
              Generate invoice
            </button>
            <button onClick={onClose} className="text-[#5b5043] hover:text-[#2a2018] text-2xl leading-none ml-2">×</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-0">
          {/* LEFT: form */}
          <div className="p-6 space-y-6 border-r border-[#e0d4c0]">

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

            {/* Event */}
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
                  <label className="block text-xs text-[#7a6e5c] mb-1">Event date</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Location / venue</label>
                  <input value={eventLocation} onChange={e => setEventLocation(e.target.value)}
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Company (if applicable)</label>
                  <input value={company} onChange={e => setCompany(e.target.value)}
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
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
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Consultation date</label>
                  <input type="date" value={consultationDate} onChange={e => setConsultationDate(e.target.value)}
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
              </div>
            </div>

            {/* Pricing inputs */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Event pricing</h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Hat style</label>
                  <input value={hatStyle} onChange={e => setHatStyle(e.target.value)}
                    placeholder="e.g. Wool Felt Western"
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Hat price per guest ($)</label>
                  <input type="number" step="0.01" value={hatPricePerGuest || ''}
                    onChange={e => setHatPricePerGuest(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Number of guests</label>
                  <input type="number" min={1} value={guests || ''}
                    onChange={e => setGuests(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Hours of service</label>
                  <select value={hours} onChange={e => setHours(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]">
                    {[2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} hours</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <p className="text-xs text-[#9a8d78]">
                    Team: <span className="font-semibold text-[#2a2018]">{getTeamSize(guests)} stylists</span>
                  </p>
                </div>
              </div>

              {/* Service add-ons */}
              <div className="bg-[#f6efe4] rounded-xl p-4 mb-3">
                <p className="text-xs uppercase tracking-wider text-[#9a8d78] mb-2">Service add-ons</p>
                {SERVICE_ADDONS_LIST.map(a => {
                  const active = serviceAddons.includes(a.id);
                  const price = a.perBrander ? BRANDING_RATE * getBranderCount(guests)
                    : a.perStaff ? TRAVEL_RATE_PER_STAFF * getTeamSize(guests) : a.price;
                  return (
                    <label key={a.id} className="flex items-center justify-between gap-2 cursor-pointer text-sm text-[#2a2018] py-1">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={active} onChange={() => toggleService(a.id)} />
                        <span>{a.label}</span>
                        {a.id === 'branding' && active && (
                          <span className="text-xs text-[#9a8d78]">({getBranderCount(guests)} brander{getBranderCount(guests) > 1 ? 's' : ''})</span>
                        )}
                        {a.id === 'travel' && active && (
                          <span className="text-xs text-[#9a8d78]">({getTeamSize(guests)} staff)</span>
                        )}
                      </div>
                      {active && <span className="text-[#c9a36a] font-semibold text-xs">{fmt(price)}</span>}
                    </label>
                  );
                })}
              </div>

              {/* Custom add-ons */}
              <div className="bg-[#f6efe4] rounded-xl p-4 mb-3">
                <p className="text-xs uppercase tracking-wider text-[#9a8d78] mb-2">Custom add-ons (per guest)</p>
                <div className="grid sm:grid-cols-2 gap-x-4">
                  {CUSTOM_ADDONS_LIST.map(a => {
                    const active = customAddons.includes(a.id);
                    return (
                      <label key={a.id} className="flex items-center justify-between gap-2 cursor-pointer text-sm text-[#2a2018] py-1">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={active} onChange={() => toggleCustom(a.id)} />
                          <span>{a.label}</span>
                        </div>
                        <span className="text-xs text-[#9a8d78]">${a.pricePerGuest}/guest{active ? ` = ${fmt(a.pricePerGuest * guests)}` : ''}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom line items */}
              <div className="bg-[#f6efe4] rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-[#9a8d78] mb-2">Custom line items</p>
                {lineItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm text-[#2a2018]">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{fmt(item.price)}</span>
                      <button onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)}
                    placeholder="Description (e.g. Extra hour)"
                    className="flex-1 rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  <input type="number" step="0.01" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                    placeholder="$"
                    className="w-24 rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  <button onClick={addLineItem}
                    className="rounded-lg bg-[#2a2018] text-[#f3ead9] px-4 py-2 text-sm hover:bg-[#3a2e22]">Add</button>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Tax</h3>
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#2a2018]">
                  <input type="checkbox" checked={taxable} onChange={e => setTaxable(e.target.checked)} />
                  Charge sales tax
                </label>
                {taxable && (
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-[#2a2018]">
                      <input type="radio" checked={taxRate === 0.0625} onChange={() => setTaxRate(0.0625)} />
                      6.25% (state)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-[#2a2018]">
                      <input type="radio" checked={taxRate === 0.0825} onChange={() => setTaxRate(0.0825)} />
                      8.25% (state + local)
                    </label>
                  </div>
                )}
                {!taxable && <span className="text-xs text-[#9a8d78]">Tax exempt (e.g. non-profit)</span>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Notes</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Event notes, special requests…"
                className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a] resize-none" />
            </div>
          </div>

          {/* RIGHT: live invoice summary */}
          <div className="p-6 bg-[#f6efe4] rounded-br-2xl">
            <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-4">Live estimate</h3>

            <div className="space-y-0">
              {hatPricePerGuest > 0 && guests > 0 && (
                <Row label={`${hatStyle || 'Hat'} × ${guests}`} value={fmt(calc.hatTotal)} />
              )}
              {calc.stylistTotal > 0 && (
                <Row label={`Stylists (${calc.teamSize} × $${STYLIST_HOURLY_RATE}/hr × ${hours}hrs)`} value={fmt(calc.stylistTotal)} />
              )}
              {calc.brandingTotal > 0 && (
                <Row label={`Branding (${calc.branderCount} brander${calc.branderCount > 1 ? 's' : ''} × $${BRANDING_RATE})`} value={fmt(calc.brandingTotal)} />
              )}
              {calc.travelTotal > 0 && (
                <Row label={`Travel (${calc.teamSize} staff × $${TRAVEL_RATE_PER_STAFF})`} value={fmt(calc.travelTotal)} />
              )}
              {CUSTOM_ADDONS_LIST.filter(a => customAddons.includes(a.id)).map(a => (
                <Row key={a.id} label={`${a.label} × ${guests}`} value={fmt(a.pricePerGuest * guests)} />
              ))}
              {lineItems.map((item, i) => (
                <Row key={i} label={item.label} value={fmt(item.price)} />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-[#2a2018] space-y-0">
              <Row label="Subtotal" value={fmt(calc.subtotal)} />
              {taxable ? (
                <Row label={`Sales tax (${(taxRate * 100).toFixed(2)}%)`} value={fmt(calc.taxTotal)} />
              ) : (
                <Row label="Sales tax" value="Exempt" />
              )}
              <Row label="Total" value={fmt(calc.total)} bold />
              <Row label="Deposit (50%)" value={fmt(calc.depositAmount)} />
            </div>

            <div className="mt-4 pt-4 border-t border-[#d8cbb4]">
              <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Payment tracking</h3>
              <div className="mb-3">
                <label className="block text-xs text-[#7a6e5c] mb-1">Amount paid ($)</label>
                <input type="number" step="0.01" value={amountPaid || ''}
                  onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#2a2018] mb-4">
                <input type="checkbox" checked={depositReceived} onChange={e => setDepositReceived(e.target.checked)} />
                Deposit received
              </label>
              <div className={`rounded-xl p-4 text-center ${balanceDue <= 0 ? 'bg-green-100 border border-green-300' : 'bg-[#2a2018]'}`}>
                <p className={`text-xs uppercase tracking-wider mb-1 ${balanceDue <= 0 ? 'text-green-700' : 'text-[#c9a36a]'}`}>Balance due</p>
                <p className={`font-serif text-3xl ${balanceDue <= 0 ? 'text-green-700' : 'text-[#f3ead9]'}`}>
                  {balanceDue <= 0 ? 'Paid in full' : fmt(balanceDue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-[#e0d4c0] px-6 py-4 flex gap-3">
          <button onClick={save} disabled={saving}
            className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-3 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={handleInvoice}
            className="rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold px-8 py-3 transition-colors">
            Generate invoice
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

  useEffect(() => { if (authed) fetchLeads(); }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
    } else {
      setPwError('Incorrect password.');
    }
  };

  const stats = useMemo(() => {
    const totalGuests = leads.reduce((s, l) => s + (l.guests || 0), 0);
    const amountBooked = leads.reduce((s, l) => s + parseMoney(l.final_total || l.estimated_total), 0);
    const amountPaid = leads.reduce((s, l) => s + (l.amount_paid || 0), 0);
    const balanceDue = amountBooked - amountPaid;
    return { totalEvents: leads.length, totalGuests, amountBooked, amountPaid, balanceDue };
  }, [leads]);

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
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Bookings Dashboard</h1>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Total events</p>
            <p className="font-serif text-3xl text-[#2a2018]">{stats.totalEvents}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Total guests</p>
            <p className="font-serif text-3xl text-[#2a2018]">{stats.totalGuests}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Amount booked</p>
            <p className="font-serif text-2xl text-[#2a2018]">{fmtRound(stats.amountBooked)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Amount paid</p>
            <p className="font-serif text-2xl text-green-700">{fmtRound(stats.amountPaid)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-5">
            <p className="text-xs uppercase tracking-wider text-[#7a6e5c]">Balance due</p>
            <p className={`font-serif text-2xl ${stats.balanceDue > 0 ? 'text-[#c9a36a]' : 'text-green-700'}`}>
              {stats.balanceDue > 0 ? fmtRound(stats.balanceDue) : 'All paid'}
            </p>
          </div>
        </div>

        {/* Bookings list */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl text-[#2a2018]">Confirmed Bookings</h2>
            <p className="text-sm text-[#7a6e5c] mt-0.5">{leads.length} event{leads.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={fetchLeads} className="rounded-lg border border-[#d8cbb4] bg-white px-3 py-2 text-sm hover:bg-[#f3ead9]">Refresh</button>
        </div>

        {leadsLoading ? (
          <p className="text-[#5b5043]">Loading…</p>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-8 text-center text-[#7a6e5c]">
            No confirmed bookings yet. Confirm requests from the{' '}
            <Link to="/maddhattery-admin/quotes" className="text-[#c9a36a] hover:underline">Quote requests page</Link>.
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map(lead => {
              const calc = calcTotals(
                lead.guests || 0, lead.hours || 3, lead.hat_price_per_guest || 0,
                lead.service_addons ? lead.service_addons.split(',').map(s => s.trim()) : [],
                lead.custom_addons ? lead.custom_addons.split(',').map(s => s.trim()) : [],
                lead.custom_line_items || [], lead.taxable !== false, lead.tax_rate || 0.0625
              );
              const paid = lead.amount_paid || 0;
              const balance = calc.total - paid;
              return (
                <div key={lead.id} className="bg-white rounded-xl border border-[#e0d4c0] p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold text-[#2a2018]">{lead.name || '—'}</p>
                      <p className="text-sm text-[#5b5043]">{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</p>
                      <p className="text-xs text-[#9a8d78] mt-0.5">
                        {lead.event_type} · {fmtDate(lead.event_date)} · {lead.guests} guests
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-[#9a8d78]">Total</p>
                        <p className="font-bold text-[#2a2018]">{fmt(calc.total)}</p>
                        <p className={`text-xs font-semibold ${balance <= 0 ? 'text-green-700' : 'text-[#c9a36a]'}`}>
                          {balance <= 0 ? '✓ Paid in full' : `Balance: ${fmt(balance)}`}
                        </p>
                      </div>
                      <button onClick={() => setEditingLead(lead)}
                        className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-4 py-2 text-sm">
                        Edit / Invoice
                      </button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#e0d4c0] text-sm">
                    <div>
                      <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Hat style</p>
                      <p className="text-[#2a2018] font-medium">{lead.hat_style || '—'}</p>
                      {lead.hat_price_per_guest ? <p className="text-xs text-[#9a8d78]">${lead.hat_price_per_guest}/guest</p> : null}
                    </div>
                    <div>
                      <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Location</p>
                      <p className="text-[#2a2018] font-medium">{lead.event_location || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Amount paid</p>
                      <p className="text-green-700 font-semibold">{fmt(paid)}</p>
                      {lead.deposit_received && <p className="text-xs text-green-700">✓ Deposit received</p>}
                    </div>
                    <div>
                      <p className="text-xs text-[#9a8d78] uppercase tracking-wider mb-0.5">Status</p>
                      <p className="text-[#2a2018] font-medium capitalize">{lead.status || 'confirmed'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBookings;
