import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';

const NAV_LINKS = [
  { to: '/', label: 'View site' },
  { to: '/maddhattery-admin', label: 'Gallery' },
  { to: '/maddhattery-admin/quotes', label: 'Quote requests' },
  { to: '/maddhattery-admin/bookings', label: 'Bookings' },
  { to: '/maddhattery-admin/events', label: 'Event manager' },
  { to: '/maddhattery-admin/photos', label: 'Hat-bar photos' },
  { to: '/maddhattery-admin/design', label: 'Hat design' },
  { to: '/maddhattery-admin/addons', label: 'Add-ons' },
  { to: '/maddhattery-admin/testimonials', label: 'Testimonials' },
];

const STATUS_OPTIONS = [
  { id: 'quote_request', label: 'Quote Request', color: 'bg-gray-100 text-gray-700' },
  { id: 'consultation_scheduled', label: 'Consultation', color: 'bg-blue-100 text-blue-700' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'booked', label: 'Booked', color: 'bg-green-100 text-green-700' },
  { id: 'ready', label: 'Ready for Event', color: 'bg-purple-100 text-purple-700' },
  { id: 'completed', label: 'Completed', color: 'bg-[#c9a36a]/20 text-[#b8915a]' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-600' },
];

const HAT_BAR_PACKAGES = [
  {
    id: 'basic',
    label: 'Basic Hat Bar',
    defaultItems: [
      { item: 'Solid fabric bands', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: 'Need to cut and prep' },
      { item: 'Layering bands', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: 'Need to cut and prep' },
      { item: 'Fabric bundles', unit: 'sets', qty: 0, cost: 0, ordered: false, notes: 'Need to prep' },
      { item: 'Playing cards', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: '' },
      { item: 'Hat pins', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: '' },
      { item: 'Basic faux leather hat bands', unit: 'each', qty: 0, cost: 3.50, ordered: false, notes: '$3-4 each' },
      { item: 'Custom branding iron', unit: 'each', qty: 0, cost: 125, ordered: false, notes: 'Starting at $125 — price varies by logo size and detail' },
      { item: 'Retail display table', unit: 'each', qty: 0, cost: 0, ordered: false, notes: 'Retail merchandise table setup' },
      { item: 'Retail merchandise', unit: 'items', qty: 0, cost: 0, ordered: false, notes: 'List retail items to bring' },
    ]
  },
  {
    id: 'premium',
    label: 'Premium Hat Bar',
    defaultItems: [
      { item: 'Feather bands', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: '' },
      { item: 'Beaded bands', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: '' },
      { item: 'Leather bands', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: '' },
      { item: 'Premium hat pins', unit: 'per guest', qty: 2, cost: 0, ordered: false, notes: '' },
      { item: 'Playing cards', unit: 'per guest', qty: 1, cost: 0, ordered: false, notes: '' },
      { item: 'Fabric bundles', unit: 'sets', qty: 0, cost: 0, ordered: false, notes: 'Need to prep' },
    ]
  },
];

const fmtDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const parseMoney = (s: string | null | number): number => {
  if (!s) return 0;
  if (typeof s === 'number') return s;
  return parseFloat(String(s).replace(/[$,]/g, '')) || 0;
};

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  hat_style: string | null;
  hat_price_per_guest: number | null;
  guests: number | null;
  hours: number | null;
  service_addons: string | null;
  custom_addons: string | null;
  estimated_total: string | null;
  final_total: string | null;
  amount_paid: number | null;
  deposit_received: boolean | null;
  status: string | null;
  checklist_status: string | null;
  created_at: string;
}

interface StaffMember { name: string; role: string; rate: number; confirmed: boolean; }
interface HatBarItem { item: string; unit: string; qty: number; cost: number; ordered: boolean; notes: string; }
interface MerchandiseItem { item: string; qty: number; cost: number; ordered: boolean; notes: string; }
interface ShippingItem { item: string; cost: number; carrier: string; tracking: string; }
interface OtherExpense { label: string; amount: number; notes: string; }

interface Task {
  id: string;
  label: string;
  category: string;
  due_date: string;
  completed: boolean;
  completed_date: string;
  assigned_to: string;
  auto_generated: boolean;
}

interface Checklist {
  id?: string;
  booking_id: string;
  status: string;
  agreement_signed: boolean;
  agreement_signed_date: string;
  agreement_file_url: string;
  venue_type: string;
  trailer_needed: boolean;
  trailer_confirmed: boolean;
  venue_notes: string;
  staff: StaffMember[];
  hats_ordered: boolean;
  hats_order_date: string;
  hats_needed_by: string;
  hats_cost: number;
  hat_sizes: Record<string, number>;
  xl_xxl_included: boolean;
  hat_bar_package: string;
  hat_bar_items: HatBarItem[];
  merchandise_items: MerchandiseItem[];
  merchandise_total: number;
  shipping_items: ShippingItem[];
  shipping_total: number;
  hotel_needed: boolean;
  hotel_name: string;
  hotel_nights: number;
  hotel_rooms: number;
  hotel_cost_per_night: number;
  hotel_booked: boolean;
  travel_cost: number;
  mileage: number;
  mileage_rate: number;
  other_expenses: OtherExpense[];
  proposal_sent: boolean;
  proposal_sent_date: string;
  proposal_amount: string;
  proposal_notes: string;
  tasks: Task[];
  follow_up_date: string;
  follow_up_notes: string;
  deposit_received: boolean;
  final_payment_received: boolean;
  testimonial_requested: boolean;
  testimonial_received: boolean;
  task_notes: string;
  total_revenue: number;
  total_costs: number;
  net_profit: number;
}

const defaultChecklist = (bookingId: string): Checklist => ({
  booking_id: bookingId,
  status: 'quote_request',
  agreement_signed: false,
  agreement_signed_date: '',
  agreement_file_url: '',
  venue_type: 'indoor',
  trailer_needed: false,
  trailer_confirmed: false,
  venue_notes: '',
  staff: [],
  hats_ordered: false,
  hats_order_date: '',
  hats_needed_by: '',
  hats_cost: 0,
  hat_sizes: { 'O/S': 0, XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
  xl_xxl_included: false,
  hat_bar_package: 'basic',
  hat_bar_items: HAT_BAR_PACKAGES[0].defaultItems,
  merchandise_items: [],
  merchandise_total: 0,
  shipping_items: [],
  shipping_total: 0,
  hotel_needed: false,
  hotel_name: '',
  hotel_nights: 0,
  hotel_rooms: 0,
  hotel_cost_per_night: 0,
  hotel_booked: false,
  travel_cost: 0,
  mileage: 0,
  mileage_rate: 0.67,
  other_expenses: [],
  proposal_sent: false,
  proposal_sent_date: '',
  proposal_amount: '',
  proposal_notes: '',
  tasks: [],
  follow_up_date: '',
  follow_up_notes: '',
  deposit_received: false,
  final_payment_received: false,
  testimonial_requested: false,
  testimonial_received: false,
  task_notes: '',
  total_revenue: 0,
  total_costs: 0,
  net_profit: 0,
});


// Generate tasks based on status and event date
function generateTasks(booking: Booking, checklist: Checklist, currentStatus: string): Task[] {
  const existing = checklist.tasks || [];
  const eventDate = booking.event_date ? new Date(booking.event_date + 'T00:00:00') : null;
  
  const makeDate = (daysBefore: number): string => {
    if (!eventDate) return '';
    const d = new Date(eventDate);
    d.setDate(d.getDate() - daysBefore);
    return d.toISOString().split('T')[0];
  };

  const futureDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const allTasks: Omit<Task, 'id'>[] = [];

  // ── QUOTE REQUEST stage ──────────────────────────────
  if (currentStatus === 'quote_request') {
    allTasks.push(
      { label: 'Schedule consultation with client', category: 'consultation', due_date: futureDate(3), completed: false, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Send initial quote to client', category: 'quote', due_date: futureDate(1), completed: checklist.proposal_sent, completed_date: checklist.proposal_sent_date || '', assigned_to: '', auto_generated: true },
    );
  }

  // ── CONSULTATION SCHEDULED stage ────────────────────
  if (currentStatus === 'consultation_scheduled') {
    allTasks.push(
      { label: 'Complete consultation with client', category: 'consultation', due_date: futureDate(2), completed: false, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Send updated proposal after consultation', category: 'proposal', due_date: futureDate(3), completed: checklist.proposal_sent, completed_date: checklist.proposal_sent_date || '', assigned_to: '', auto_generated: true },
    );
  }

  // ── PROPOSAL SENT stage ──────────────────────────────
  if (currentStatus === 'proposal_sent') {
    allTasks.push(
      { label: 'Follow up on proposal (3 days)', category: 'follow_up', due_date: checklist.follow_up_date || futureDate(3), completed: false, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Get service agreement signed', category: 'agreement', due_date: futureDate(5), completed: checklist.agreement_signed, completed_date: checklist.agreement_signed_date || '', assigned_to: '', auto_generated: true },
      { label: 'Collect deposit payment', category: 'payment', due_date: futureDate(5), completed: checklist.deposit_received, completed_date: '', assigned_to: '', auto_generated: true },
    );
  }

  // ── BOOKED stage ─────────────────────────────────────
  if (currentStatus === 'booked') {
    allTasks.push(
      { label: 'Order hats (4-5 week lead time) ⚠ Order by: ' + (makeDate(35) || 'set event date'), category: 'hats', due_date: makeDate(35), completed: checklist.hats_ordered, completed_date: checklist.hats_order_date || '', assigned_to: '', auto_generated: true },
      { label: 'Confirm XL and XXL sizes included in order', category: 'hats', due_date: makeDate(35), completed: checklist.xl_xxl_included, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Order hat bar merchandise and supplies', category: 'merchandise', due_date: makeDate(21), completed: checklist.merchandise_items.length > 0 && checklist.merchandise_items.every(i => i.ordered), completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Book staff members', category: 'staff', due_date: makeDate(21), completed: checklist.staff.length > 0, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Confirm venue details (indoor/outdoor/trailer)', category: 'venue', due_date: makeDate(14), completed: checklist.trailer_needed ? checklist.trailer_confirmed : !!checklist.venue_type, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Book hotel if needed', category: 'hotel', due_date: makeDate(14), completed: checklist.hotel_needed ? checklist.hotel_booked : true, completed_date: '', assigned_to: '', auto_generated: true },
    );
  }

  // ── IN PREP stage ────────────────────────────────────
  if (currentStatus === 'ready') {
    allTasks.push(
      { label: 'Confirm hat order received', category: 'hats', due_date: makeDate(14), completed: checklist.hats_ordered, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Confirm XL and XXL sizes included', category: 'hats', due_date: makeDate(14), completed: checklist.xl_xxl_included, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Prep hat bar items (cut bands, prep fabric bundles)', category: 'prep', due_date: makeDate(5), completed: checklist.hat_bar_items.length > 0 && checklist.hat_bar_items.every(i => i.ordered), completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Confirm all staff booked and confirmed', category: 'staff', due_date: makeDate(5), completed: checklist.staff.length > 0 && checklist.staff.every(s => s.confirmed), completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Confirm merchandise and supplies received', category: 'merchandise', due_date: makeDate(5), completed: checklist.merchandise_items.length > 0 && checklist.merchandise_items.every(i => i.ordered), completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Confirm trailer/venue logistics', category: 'venue', due_date: makeDate(3), completed: checklist.trailer_needed ? checklist.trailer_confirmed : true, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Final pack and prep for event', category: 'prep', due_date: makeDate(1), completed: false, completed_date: '', assigned_to: '', auto_generated: true },
    );
  }

  // ── COMPLETED stage ──────────────────────────────────
  if (currentStatus === 'completed') {
    allTasks.push(
      { label: 'Collect final payment', category: 'payment', due_date: makeDate(-1), completed: checklist.final_payment_received, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Send thank you note to client', category: 'follow_up', due_date: makeDate(-2), completed: false, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Request testimonial from client', category: 'testimonial', due_date: makeDate(-3), completed: checklist.testimonial_requested, completed_date: '', assigned_to: '', auto_generated: true },
      { label: 'Add event photos to testimonials gallery', category: 'testimonial', due_date: makeDate(-7), completed: checklist.testimonial_received, completed_date: '', assigned_to: '', auto_generated: true },
    );
  }

  // Preserve manually added tasks
  const manualTasks = existing.filter(t => !t.auto_generated);
  const autoTasks = allTasks.map((t, i) => ({ ...t, id: `auto-${i}-${t.category}-${currentStatus}` }));

  return [...autoTasks, ...manualTasks];
}

// Auto-determine status based on checklist state
// Auto-determine status based on checklist state
function autoStatus(checklist: Checklist, currentStatus: string): string {
  if (currentStatus === 'cancelled') return 'cancelled';
  if (currentStatus === 'completed') return 'completed';
  if (checklist.final_payment_received) return 'completed';
  if (checklist.agreement_signed && checklist.deposit_received) return 'booked';
  if (checklist.hats_ordered) return 'ready';
  if (checklist.proposal_sent) return 'proposal_sent';
  if (currentStatus === 'consultation_scheduled') return 'consultation_scheduled';
  return currentStatus;
}

// ── Event Detail Modal ──────────────────────────────────────────────────────

const EventModal: React.FC<{
  booking: Booking;
  onClose: () => void;
  onSaved: (b: Booking, c: Checklist) => void;
  flash: (type: 'ok' | 'err', text: string) => void;
}> = ({ booking, onClose, onSaved, flash }) => {
  const [tab, setTab] = useState<'overview' | 'financials' | 'staff' | 'hats' | 'logistics' | 'checklist' | 'tasks'>('overview');
  const [checklist, setChecklist] = useState<Checklist>(defaultChecklist(booking.id));
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(booking.checklist_status || 'quote_request');

  useEffect(() => {
    supabase.from('event_checklist').select('*').eq('booking_id', booking.id).single().then(({ data }) => {
      if (data) {
        const loaded = data as Checklist;
        setChecklist(loaded);
        setChecklistId(data.id);
        const s = data.status || 'quote_request';
        setStatus(s);
      } else {
        // New checklist - generate initial tasks
        const initialTasks = generateTasks(booking, defaultChecklist(booking.id), 'quote_request');
        setChecklist(c => ({ ...c, tasks: initialTasks }));
      }
    });
  }, [booking.id]);

  const set = (patch: Partial<Checklist>) => {
    setChecklist(c => {
      const updated = { ...c, ...patch };
      // Auto-update status
      const newStatus = autoStatus(updated, status);
      if (newStatus !== status) setStatus(newStatus);
      // Regenerate tasks
      const newTasks = generateTasks(booking, updated, newStatus);
      return { ...updated, tasks: newTasks };
    });
  };

  // ── Cost calculations ──────────────────────────────────────────────────
  const staffTotal = useMemo(() =>
    checklist.staff.reduce((s, m) => s + m.rate * (booking.hours || 3), 0),
    [checklist.staff, booking.hours]
  );

  const hatBarTotal = useMemo(() =>
    checklist.hat_bar_items.reduce((s, i) => s + i.cost * i.qty, 0),
    [checklist.hat_bar_items]
  );

  const mercTotal = useMemo(() =>
    checklist.merchandise_items.reduce((s, i) => s + i.cost * i.qty, 0),
    [checklist.merchandise_items]
  );

  const shipTotal = useMemo(() =>
    checklist.shipping_items.reduce((s, i) => s + i.cost, 0),
    [checklist.shipping_items]
  );

  const hotelTotal = useMemo(() =>
    checklist.hotel_needed ? checklist.hotel_nights * checklist.hotel_rooms * checklist.hotel_cost_per_night : 0,
    [checklist.hotel_needed, checklist.hotel_nights, checklist.hotel_rooms, checklist.hotel_cost_per_night]
  );

  const mileageTotal = useMemo(() =>
    checklist.mileage * checklist.mileage_rate,
    [checklist.mileage, checklist.mileage_rate]
  );

  const otherTotal = useMemo(() =>
    checklist.other_expenses.reduce((s, e) => s + e.amount, 0),
    [checklist.other_expenses]
  );

  const totalCosts = staffTotal + checklist.hats_cost + hatBarTotal + mercTotal + shipTotal + hotelTotal + mileageTotal + checklist.travel_cost + otherTotal;
  const revenue = parseMoney(booking.final_total || booking.estimated_total);
  const netProfit = revenue - totalCosts;

  const save = async () => {
    setSaving(true);
    const patch = {
      booking_id: booking.id,
      status,
      agreement_signed: checklist.agreement_signed,
      agreement_signed_date: checklist.agreement_signed_date || null,
      agreement_file_url: checklist.agreement_file_url || null,
      venue_type: checklist.venue_type,
      trailer_needed: checklist.trailer_needed,
      trailer_confirmed: checklist.trailer_confirmed,
      venue_notes: checklist.venue_notes || null,
      staff: checklist.staff,
      hats_ordered: checklist.hats_ordered,
      hats_order_date: checklist.hats_order_date || null,
      hats_needed_by: checklist.hats_needed_by || null,
      hats_cost: checklist.hats_cost,
      hat_sizes: checklist.hat_sizes,
      xl_xxl_included: checklist.xl_xxl_included,
      hat_bar_package: checklist.hat_bar_package,
      hat_bar_items: checklist.hat_bar_items,
      merchandise_items: checklist.merchandise_items,
      merchandise_total: checklist.merchandise_total,
      shipping_items: checklist.shipping_items,
      shipping_total: checklist.shipping_total,
      hotel_needed: checklist.hotel_needed,
      hotel_name: checklist.hotel_name || null,
      hotel_nights: checklist.hotel_nights,
      hotel_rooms: checklist.hotel_rooms,
      hotel_cost_per_night: checklist.hotel_cost_per_night,
      hotel_booked: checklist.hotel_booked,
      travel_cost: checklist.travel_cost,
      mileage: checklist.mileage,
      mileage_rate: checklist.mileage_rate,
      other_expenses: checklist.other_expenses,
      proposal_sent: checklist.proposal_sent,
      proposal_sent_date: checklist.proposal_sent_date || null,
      proposal_amount: checklist.proposal_amount || null,
      proposal_notes: checklist.proposal_notes || null,
      tasks: checklist.tasks || [],
      follow_up_date: checklist.follow_up_date || null,
      follow_up_notes: checklist.follow_up_notes || null,
      deposit_received: checklist.deposit_received,
      final_payment_received: checklist.final_payment_received,
      testimonial_requested: checklist.testimonial_requested,
      testimonial_received: checklist.testimonial_received,
      task_notes: (checklist as any).task_notes || null,
      task_notes: checklist.task_notes || null,
      total_revenue: revenue,
      total_costs: totalCosts,
      net_profit: netProfit,
      updated_at: new Date().toISOString(),
    };

    let saveError = null;
    if (checklistId) {
      const { error } = await supabase.from('event_checklist').update(patch).eq('id', checklistId);
      saveError = error;
    } else {
      const { data, error } = await supabase.from('event_checklist').insert(patch).select().single();
      if (data) setChecklistId(data.id);
      saveError = error;
    }

    // Update booking status
    const { error: bookingError } = await supabase.from('bookings').update({ checklist_status: status }).eq('id', booking.id);

    setSaving(false);
    if (saveError) { flash('err', 'Could not save checklist: ' + saveError.message); return; }
    if (bookingError) { flash('err', 'Could not save status: ' + bookingError.message); return; }
    setChecklist(patch);
    onSaved({ ...booking, checklist_status: status }, patch);
    flash('ok', 'Saved!');
  };

  // ── Generate proposal PDF ──────────────────────────────────────────────
  const generateProposal = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Proposal — ${booking.name}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #2a2018; padding: 20px; }
      h1 { font-size: 28px; margin: 0 0 4px; }
      .gold { color: #c9a36a; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      thead tr { background: #2a2018; color: #f3ead9; }
      thead td { padding: 10px 12px; font-size: 13px; }
      tbody tr { border-bottom: 1px solid #e0d4c0; }
      tbody td { padding: 10px 12px; font-size: 14px; }
      .r { text-align: right; }
      .total-row td { font-size: 18px; font-weight: bold; border-top: 2px solid #2a2018; }
      .section { background: #f6efe4; border-radius: 12px; padding: 20px; margin: 20px 0; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>the maddhattery</h1>
    <p style="color:#7a6e5c;margin:0 0 8px">by VinHaus Boutique & Hat Bar · hello@thevinhaus.com</p>
    <h2 class="gold">Event Proposal</h2>
    <p>Prepared for: <strong>${booking.name}</strong>${booking.company ? ` · ${booking.company}` : ''}</p>
    <p>Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    
    <div class="section">
      <p><strong>Event:</strong> ${booking.event_type || '—'}</p>
      <p><strong>Date:</strong> ${fmtDate(booking.event_date)}</p>
      <p><strong>Location:</strong> ${booking.event_location || '—'}</p>
      <p><strong>Guests:</strong> ${booking.guests || '—'}</p>
      <p><strong>Hours of service:</strong> ${booking.hours || 3} hours</p>
    </div>

    ${checklist.proposal_notes ? `<div class="section"><p>${checklist.proposal_notes}</p></div>` : ''}

    <table>
      <thead><tr><td>Description</td><td class="r">Amount</td></tr></thead>
      <tbody>
        ${booking.hat_price_per_guest && booking.guests ? `<tr><td>${booking.hat_style || 'Hat'} × ${booking.guests} guests</td><td class="r">${fmt(booking.hat_price_per_guest * booking.guests)}</td></tr>` : ''}
        <tr><td>Hat bar service & styling team</td><td class="r">${fmt(parseMoney(booking.estimated_total))}</td></tr>
        ${booking.service_addons ? `<tr><td>Service add-ons: ${booking.service_addons}</td><td class="r"></td></tr>` : ''}
        ${booking.custom_addons ? `<tr><td>Custom add-ons: ${booking.custom_addons}</td><td class="r"></td></tr>` : ''}
      </tbody>
      <tfoot>
        <tr class="total-row"><td>Estimated total</td><td class="r">${booking.estimated_total || '—'}</td></tr>
        <tr><td>50% deposit to book</td><td class="r">${booking.estimated_total ? fmt(parseMoney(booking.estimated_total) / 2) : '—'}</td></tr>
      </tfoot>
    </table>

    <div class="section">
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Review and sign the service agreement</li>
        <li>Submit 50% deposit to confirm your date</li>
        <li>Final balance due day of event</li>
      </ol>
    </div>
    <script>window.print();</script>
    </body></html>`);
    w.document.close();
  };

  const tabClass = (t: string) => `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? 'bg-white text-[#2a2018] border-t border-l border-r border-[#e0d4c0]' : 'text-[#7a6e5c] hover:text-[#2a2018]'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8">

        {/* Header */}
        <div className="sticky top-0 bg-[#2a2018] text-[#f3ead9] rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-serif text-xl">{booking.name}</p>
            <p className="text-sm text-[#c9a36a]">{booking.event_type} · {fmtDate(booking.event_date)} · {booking.guests} guests</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="rounded-full bg-[#3a2e22] border border-[#5b5043] text-[#f3ead9] text-sm px-4 py-2 outline-none">
              {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button onClick={onClose} className="text-[#cbbfa9] hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        {/* Net profit banner */}
        <div className={`px-6 py-3 flex items-center justify-between text-sm ${netProfit >= 0 ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'}`}>
          <div className="flex gap-6">
            <span className="text-[#5b5043]">Revenue: <strong className="text-[#2a2018]">{fmt(revenue)}</strong></span>
            <span className="text-[#5b5043]">Total costs: <strong className="text-[#2a2018]">{fmt(totalCosts)}</strong></span>
          </div>
          <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            Net profit: {fmt(netProfit)}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 bg-[#f6efe4] border-b border-[#e0d4c0]">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'financials', label: 'Financials' },
            { id: 'staff', label: 'Staff' },
            { id: 'hats', label: 'Hats & Hat Bar' },
            { id: 'logistics', label: 'Logistics' },
            { id: 'checklist', label: 'Checklist' },
            { id: 'tasks', label: 'Tasks' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={tabClass(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6 min-h-[400px]">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold">Event details</h3>
                <div className="bg-[#f6efe4] rounded-xl p-4 space-y-2 text-sm">
                  {[
                    ['Type', booking.event_type],
                    ['Date', fmtDate(booking.event_date)],
                    ['Location', booking.event_location],
                    ['Company', booking.company],
                    ['Guests', String(booking.guests || '—')],
                    ['Hours', `${booking.hours || 3} hours`],
                    ['Hat style', booking.hat_style],
                    ['Service add-ons', booking.service_addons],
                    ['Custom add-ons', booking.custom_addons],
                  ].map(([label, value]) => value ? (
                    <div key={label} className="flex gap-2">
                      <span className="text-[#9a8d78] w-32 shrink-0">{label}</span>
                      <span className="text-[#2a2018] font-medium">{value}</span>
                    </div>
                  ) : null)}
                </div>

                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold">Agreement</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={checklist.agreement_signed}
                      onChange={e => set({ agreement_signed: e.target.checked })} />
                    Service agreement signed
                  </label>
                  {checklist.agreement_signed && (
                    <input type="date" value={checklist.agreement_signed_date}
                      onChange={e => set({ agreement_signed_date: e.target.value })}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  )}
                  <input value={checklist.agreement_file_url}
                    onChange={e => set({ agreement_file_url: e.target.value })}
                    placeholder="Agreement file URL (upload to storage and paste link)"
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold">Payment status</h3>
                <div className="bg-[#f6efe4] rounded-xl p-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a6e5c]">Total</span>
                    <span className="font-semibold text-[#2a2018]">{fmt(revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a6e5c]">Deposit (50%)</span>
                    <span className="font-semibold text-[#2a2018]">{fmt(revenue / 2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a6e5c]">Amount paid</span>
                    <span className="font-semibold text-green-700">{fmt(booking.amount_paid || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-[#e0d4c0] pt-2">
                    <span className="text-[#7a6e5c]">Balance due</span>
                    <span className={`font-bold text-lg ${revenue - (booking.amount_paid || 0) <= 0 ? 'text-green-700' : 'text-[#c9a36a]'}`}>
                      {revenue - (booking.amount_paid || 0) <= 0 ? '✓ Paid in full' : fmt(revenue - (booking.amount_paid || 0))}
                    </span>
                  </div>
                  {booking.deposit_received && (
                    <p className="text-xs text-green-700 font-medium">✓ Deposit received</p>
                  )}
                </div>

                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold">Proposal</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={checklist.proposal_sent}
                      onChange={e => set({ proposal_sent: e.target.checked })} />
                    Proposal sent
                  </label>
                  {checklist.proposal_sent && (
                    <input type="date" value={checklist.proposal_sent_date}
                      onChange={e => set({ proposal_sent_date: e.target.value })}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  )}
                  <input value={checklist.proposal_amount}
                    onChange={e => set({ proposal_amount: e.target.value })}
                    placeholder="Proposal amount (e.g. $5,500)"
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  <textarea value={checklist.proposal_notes}
                    onChange={e => set({ proposal_notes: e.target.value })}
                    placeholder="Proposal notes — what's included, special terms…"
                    rows={4}
                    className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a] resize-none" />
                  <button onClick={generateProposal}
                    className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-2.5 text-sm">
                    Generate proposal PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FINANCIALS */}
          {tab === 'financials' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-[#f6efe4] rounded-xl p-4">
                  <p className="text-xs text-[#9a8d78] uppercase tracking-wider">Revenue</p>
                  <p className="font-serif text-2xl text-[#2a2018]">{fmt(revenue)}</p>
                </div>
                <div className="bg-[#f6efe4] rounded-xl p-4">
                  <p className="text-xs text-[#9a8d78] uppercase tracking-wider">Total costs</p>
                  <p className="font-serif text-2xl text-[#2a2018]">{fmt(totalCosts)}</p>
                </div>
                <div className={`rounded-xl p-4 ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-[#9a8d78] uppercase tracking-wider">Net profit</p>
                  <p className={`font-serif text-2xl ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(netProfit)}</p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f3ead9] text-[#5b5043] text-left">
                    <th className="px-4 py-2">Cost item</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Staff ({checklist.staff.length} people × {booking.hours || 3} hrs)</td>
                    <td className="px-4 py-2 text-right">{fmt(staffTotal)}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Hats <span className="text-xs text-[#9a8d78]">(enter cost in Hats tab)</span></td>
                    <td className="px-4 py-2 text-right font-medium">{checklist.hats_cost > 0 ? fmt(checklist.hats_cost) : <span className="text-[#9a8d78] text-xs">Enter in Hats tab →</span>}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Hat bar items</td>
                    <td className="px-4 py-2 text-right">{fmt(hatBarTotal)}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Merchandise</td>
                    <td className="px-4 py-2 text-right">{fmt(mercTotal)}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Shipping</td>
                    <td className="px-4 py-2 text-right">{fmt(shipTotal)}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Hotel</td>
                    <td className="px-4 py-2 text-right">{fmt(hotelTotal)}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">
                      Mileage ({checklist.mileage} mi × ${checklist.mileage_rate}/mi)
                    </td>
                    <td className="px-4 py-2 text-right">{fmt(mileageTotal)}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Travel <span className="text-xs text-[#9a8d78]">(enter in Logistics tab)</span></td>
                    <td className="px-4 py-2 text-right font-medium">{checklist.travel_cost > 0 ? fmt(checklist.travel_cost) : <span className="text-[#9a8d78] text-xs">Enter in Logistics tab →</span>}</td>
                  </tr>
                  <tr className="border-b border-[#e0d4c0]">
                    <td className="px-4 py-2">Other expenses</td>
                    <td className="px-4 py-2 text-right">{fmt(otherTotal)}</td>
                  </tr>
                  <tr className="bg-[#f3ead9] font-bold">
                    <td className="px-4 py-3">Total costs</td>
                    <td className="px-4 py-3 text-right">{fmt(totalCosts)}</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 font-bold text-green-800">Net profit</td>
                    <td className={`px-4 py-3 text-right font-bold text-lg ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* STAFF */}
          {tab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#2a2018]">Staff for {booking.hours || 3} hours</h3>
                  <p className="text-sm text-[#7a6e5c]">Total staff cost: <strong>{fmt(staffTotal)}</strong></p>
                </div>
                <button onClick={() => set({ staff: [...checklist.staff, { name: '', role: '', rate: 0, confirmed: false }] })}
                  className="rounded-full bg-[#2a2018] text-[#f3ead9] text-sm px-4 py-2 hover:bg-[#3a2e22]">
                  + Add staff member
                </button>
              </div>

              {checklist.staff.length === 0 ? (
                <div className="bg-[#f6efe4] rounded-xl p-8 text-center text-[#7a6e5c]">No staff added yet.</div>
              ) : (
                <div className="space-y-2">
                  {checklist.staff.map((m, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_120px_100px_40px] gap-2 items-center">
                      <input value={m.name} onChange={e => { const s = [...checklist.staff]; s[i] = { ...s[i], name: e.target.value }; set({ staff: s }); }}
                        placeholder="Name"
                        className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                      <input value={m.role} onChange={e => { const s = [...checklist.staff]; s[i] = { ...s[i], role: e.target.value }; set({ staff: s }); }}
                        placeholder="Role (e.g. Lead stylist)"
                        className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-[#9a8d78] text-sm">$</span>
                        <input type="number" step="0.01" value={m.rate || ''}
                          onChange={e => { const s = [...checklist.staff]; s[i] = { ...s[i], rate: parseFloat(e.target.value) || 0 }; set({ staff: s }); }}
                          placeholder="Rate/hr"
                          className="w-full rounded-lg border border-[#d8cbb4] pl-6 pr-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                      </div>
                      <div className="text-sm text-[#5b5043] text-right font-medium">
                        {fmt(m.rate * (booking.hours || 3))}
                      </div>
                      <button onClick={() => { const s = checklist.staff.filter((_, idx) => idx !== i); set({ staff: s }); }}
                        className="text-red-400 hover:text-red-600 text-lg">×</button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t border-[#e0d4c0]">
                    <p className="text-sm font-bold text-[#2a2018]">Total: {fmt(staffTotal)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HATS & HAT BAR */}
          {tab === 'hats' && (
            <div className="space-y-6">
              {/* Hat sizes */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Hat sizes needed</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                  {Object.entries(checklist.hat_sizes).map(([size, qty]) => (
                    <div key={size} className="text-center">
                      <label className="block text-xs text-[#7a6e5c] mb-1">{size}</label>
                      <input type="number" min={0} value={qty}
                        onChange={e => set({ hat_sizes: { ...checklist.hat_sizes, [size]: parseInt(e.target.value) || 0 } })}
                        className="w-full rounded-lg border border-[#d8cbb4] px-2 py-2 text-center text-sm outline-none focus:border-[#c9a36a]" />
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={checklist.xl_xxl_included}
                    onChange={e => set({ xl_xxl_included: e.target.checked })} />
                  XL and XXL included in order ✓
                </label>
                <div className="flex gap-3 mt-3">
                  <div className="flex-1">
                    <label className="block text-xs text-[#7a6e5c] mb-1">Order date</label>
                    <input type="date" value={checklist.hats_order_date}
                      onChange={e => set({ hats_order_date: e.target.value })}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#7a6e5c] mb-1">Needed by (4-5 wk lead time)</label>
                    <input type="date" value={checklist.hats_needed_by}
                      onChange={e => set({ hats_needed_by: e.target.value })}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#7a6e5c] mb-1">Hat cost ($)</label>
                    <input type="number" step="0.01" value={checklist.hats_cost || ''}
                      onChange={e => set({ hats_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="Total cost"
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                  <input type="checkbox" checked={checklist.hats_ordered}
                    onChange={e => set({ hats_ordered: e.target.checked })} />
                  Hats ordered ✓
                </label>
              </div>

              {/* Hat bar package */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Hat bar package</h3>
                <div className="flex gap-3 mb-4">
                  {HAT_BAR_PACKAGES.map(p => (
                    <button key={p.id} onClick={() => set({ hat_bar_package: p.id, hat_bar_items: p.defaultItems })}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${checklist.hat_bar_package === p.id ? 'bg-[#c9a36a] text-[#2a2018]' : 'border border-[#d8cbb4] text-[#5b5043] hover:border-[#c9a36a]'}`}>
                      {p.label}
                    </button>
                  ))}
                  <button onClick={() => set({ hat_bar_package: 'custom' })}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${checklist.hat_bar_package === 'custom' ? 'bg-[#c9a36a] text-[#2a2018]' : 'border border-[#d8cbb4] text-[#5b5043] hover:border-[#c9a36a]'}`}>
                    Custom
                  </button>
                </div>

                {/* Hat bar items table */}
                <div className="bg-[#f6efe4] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#2a2018] text-[#f3ead9]">
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-center">Unit</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Cost ea.</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2 text-center">Ordered</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklist.hat_bar_items.map((item, i) => (
                        <tr key={i} className="border-b border-[#e0d4c0]">
                          <td className="px-3 py-2">
                            <input value={item.item} onChange={e => { const items = [...checklist.hat_bar_items]; items[i] = { ...items[i], item: e.target.value }; set({ hat_bar_items: items }); }}
                              className="w-full bg-transparent outline-none text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <input value={item.unit} onChange={e => { const items = [...checklist.hat_bar_items]; items[i] = { ...items[i], unit: e.target.value }; set({ hat_bar_items: items }); }}
                              className="w-full bg-transparent outline-none text-sm text-center" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={item.qty} onChange={e => { const items = [...checklist.hat_bar_items]; items[i] = { ...items[i], qty: parseInt(e.target.value) || 0 }; set({ hat_bar_items: items }); }}
                              className="w-16 bg-transparent outline-none text-sm text-center border border-[#d8cbb4] rounded px-1" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" step="0.01" value={item.cost} onChange={e => { const items = [...checklist.hat_bar_items]; items[i] = { ...items[i], cost: parseFloat(e.target.value) || 0 }; set({ hat_bar_items: items }); }}
                              className="w-20 bg-transparent outline-none text-sm text-right border border-[#d8cbb4] rounded px-1" />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{fmt(item.cost * item.qty)}</td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={item.ordered} onChange={e => { const items = [...checklist.hat_bar_items]; items[i] = { ...items[i], ordered: e.target.checked }; set({ hat_bar_items: items }); }} />
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => set({ hat_bar_items: checklist.hat_bar_items.filter((_, idx) => idx !== i) })}
                              className="text-red-400 hover:text-red-600">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#f3ead9]">
                        <td colSpan={4} className="px-3 py-2 font-bold text-[#2a2018]">Total hat bar items</td>
                        <td className="px-3 py-2 text-right font-bold">{fmt(hatBarTotal)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <button onClick={() => set({ hat_bar_items: [...checklist.hat_bar_items, { item: '', unit: 'each', qty: 0, cost: 0, ordered: false, notes: '' }] })}
                  className="mt-2 text-sm text-[#c9a36a] hover:underline">+ Add item</button>
              </div>
            </div>
          )}

          {/* LOGISTICS */}
          {tab === 'logistics' && (
            <div className="space-y-6">
              {/* Venue */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Venue</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#7a6e5c] mb-1">Venue type</label>
                    <select value={checklist.venue_type} onChange={e => set({ venue_type: e.target.value })}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]">
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="both">Indoor + Outdoor</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 justify-end pb-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={checklist.trailer_needed}
                        onChange={e => set({ trailer_needed: e.target.checked })} />
                      Horse trailer needed
                    </label>
                    {checklist.trailer_needed && (
                      <label className="flex items-center gap-2 text-sm cursor-pointer ml-4">
                        <input type="checkbox" checked={checklist.trailer_confirmed}
                          onChange={e => set({ trailer_confirmed: e.target.checked })} />
                        Trailer confirmed ✓
                      </label>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[#7a6e5c] mb-1">Venue notes</label>
                    <textarea value={checklist.venue_notes} onChange={e => set({ venue_notes: e.target.value })}
                      rows={2} placeholder="Parking, setup area, load-in time…"
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a] resize-none" />
                  </div>
                </div>
              </div>

              {/* Hotel */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Hotel</h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                  <input type="checkbox" checked={checklist.hotel_needed}
                    onChange={e => set({ hotel_needed: e.target.checked })} />
                  Hotel needed
                </label>
                {checklist.hotel_needed && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={checklist.hotel_name} onChange={e => set({ hotel_name: e.target.value })}
                      placeholder="Hotel name"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Nights</label>
                        <input type="number" min={0} value={checklist.hotel_nights}
                          onChange={e => set({ hotel_nights: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">Rooms</label>
                        <input type="number" min={0} value={checklist.hotel_rooms}
                          onChange={e => set({ hotel_rooms: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#7a6e5c] mb-1">$/night</label>
                        <input type="number" step="0.01" value={checklist.hotel_cost_per_night}
                          onChange={e => set({ hotel_cost_per_night: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={checklist.hotel_booked}
                          onChange={e => set({ hotel_booked: e.target.checked })} />
                        Hotel booked ✓
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={(checklist as any).hotel_client_paid || false}
                          onChange={e => set({ ...checklist, hotel_client_paid: e.target.checked } as any)} />
                        Paid by client
                      </label>
                      <p className="text-sm font-semibold text-[#2a2018]">Hotel total: {fmt(hotelTotal)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mileage */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Mileage & travel</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#7a6e5c] mb-1">Miles</label>
                    <input type="number" step="0.1" value={checklist.mileage || ''}
                      onChange={e => set({ mileage: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6e5c] mb-1">Rate per mile ($)</label>
                    <input type="number" step="0.01" value={checklist.mileage_rate}
                      onChange={e => set({ mileage_rate: parseFloat(e.target.value) || 0.67 })}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  </div>
                  <div className="flex items-end pb-1">
                    <p className="text-sm font-semibold text-[#2a2018]">Mileage cost: {fmt(mileageTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Shipping</h3>
                {checklist.shipping_items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_100px_40px] gap-2 mb-2">
                    <input value={item.item} onChange={e => { const s = [...checklist.shipping_items]; s[i] = { ...s[i], item: e.target.value }; set({ shipping_items: s }); }}
                      placeholder="Item description"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <input value={item.carrier} onChange={e => { const s = [...checklist.shipping_items]; s[i] = { ...s[i], carrier: e.target.value }; set({ shipping_items: s }); }}
                      placeholder="Carrier / tracking"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <input type="number" step="0.01" value={item.cost || ''} onChange={e => { const s = [...checklist.shipping_items]; s[i] = { ...s[i], cost: parseFloat(e.target.value) || 0 }; set({ shipping_items: s }); }}
                      placeholder="$"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <button onClick={() => set({ shipping_items: checklist.shipping_items.filter((_, idx) => idx !== i) })}
                      className="text-red-400 hover:text-red-600 text-lg">×</button>
                  </div>
                ))}
                <button onClick={() => set({ shipping_items: [...checklist.shipping_items, { item: '', cost: 0, carrier: '', tracking: '' }] })}
                  className="text-sm text-[#c9a36a] hover:underline">+ Add shipping item</button>
                {checklist.shipping_items.length > 0 && (
                  <p className="text-sm font-semibold text-[#2a2018] mt-2">Shipping total: {fmt(shipTotal)}</p>
                )}
              </div>

              {/* Other expenses */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Other expenses</h3>
                {checklist.other_expenses.map((exp, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_100px_40px] gap-2 mb-2">
                    <input value={exp.label} onChange={e => { const o = [...checklist.other_expenses]; o[i] = { ...o[i], label: e.target.value }; set({ other_expenses: o }); }}
                      placeholder="Description (e.g. Parking)"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <input value={exp.notes} onChange={e => { const o = [...checklist.other_expenses]; o[i] = { ...o[i], notes: e.target.value }; set({ other_expenses: o }); }}
                      placeholder="Notes"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <input type="number" step="0.01" value={exp.amount || ''} onChange={e => { const o = [...checklist.other_expenses]; o[i] = { ...o[i], amount: parseFloat(e.target.value) || 0 }; set({ other_expenses: o }); }}
                      placeholder="$"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <button onClick={() => set({ other_expenses: checklist.other_expenses.filter((_, idx) => idx !== i) })}
                      className="text-red-400 hover:text-red-600 text-lg">×</button>
                  </div>
                ))}
                <button onClick={() => set({ other_expenses: [...checklist.other_expenses, { label: '', amount: 0, notes: '' }] })}
                  className="text-sm text-[#c9a36a] hover:underline">+ Add expense</button>
              </div>

              {/* Merchandise */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-3">Merchandise</h3>
                {checklist.merchandise_items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-2 mb-2 items-center">
                    <input value={item.item} onChange={e => { const m = [...checklist.merchandise_items]; m[i] = { ...m[i], item: e.target.value }; set({ merchandise_items: m }); }}
                      placeholder="Item"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <input type="number" min={0} value={item.qty} onChange={e => { const m = [...checklist.merchandise_items]; m[i] = { ...m[i], qty: parseInt(e.target.value) || 0 }; set({ merchandise_items: m }); }}
                      placeholder="Qty"
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a] text-center" />
                    <input type="number" step="0.01" value={item.cost || ''} onChange={e => { const m = [...checklist.merchandise_items]; m[i] = { ...m[i], cost: parseFloat(e.target.value) || 0 }; set({ merchandise_items: m }); }}
                      placeholder="Cost ea."
                      className="rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="checkbox" checked={item.ordered} onChange={e => { const m = [...checklist.merchandise_items]; m[i] = { ...m[i], ordered: e.target.checked }; set({ merchandise_items: m }); }} />
                      Ordered
                    </label>
                    <button onClick={() => set({ merchandise_items: checklist.merchandise_items.filter((_, idx) => idx !== i) })}
                      className="text-red-400 hover:text-red-600 text-lg">×</button>
                  </div>
                ))}
                <button onClick={() => set({ merchandise_items: [...checklist.merchandise_items, { item: '', qty: 0, cost: 0, ordered: false, notes: '' }] })}
                  className="text-sm text-[#c9a36a] hover:underline">+ Add merchandise item</button>
              </div>
            </div>
          )}

          {/* CHECKLIST */}
          {tab === 'checklist' && (
            <div className="space-y-3">
              <p className="text-sm text-[#7a6e5c]">Track all action items for this event.</p>
              {[
                { key: 'agreement_signed', label: 'Signed service agreement', note: checklist.agreement_signed_date ? `Signed ${fmtDate(checklist.agreement_signed_date)}` : '', checked: checklist.agreement_signed },
                { key: 'proposal_sent', label: 'Proposal sent to client', note: checklist.proposal_sent_date ? `Sent ${fmtDate(checklist.proposal_sent_date)}` : '', checked: checklist.proposal_sent },
                { key: 'hats_ordered', label: `Hats ordered (4-5 week lead time)`, note: checklist.hats_needed_by ? `Needed by ${fmtDate(checklist.hats_needed_by)}` : '⚠ Set needed-by date in Hats tab', checked: checklist.hats_ordered },
                { key: 'xl_xxl_included', label: 'XL and XXL sizes included in hat order', note: '', checked: checklist.xl_xxl_included },
                { key: 'trailer_confirmed', label: 'Horse trailer confirmed', note: !checklist.trailer_needed ? 'Mark trailer needed in Logistics tab if required' : '', checked: !checklist.trailer_needed ? false : checklist.trailer_confirmed, skip: !checklist.trailer_needed },
                { key: 'hotel_booked', label: 'Hotel booked', note: !checklist.hotel_needed ? 'Mark hotel needed in Logistics tab if required' : (checklist.hotel_name || ''), checked: !checklist.hotel_needed ? false : checklist.hotel_booked, skip: !checklist.hotel_needed },
              ].filter(item => !('skip' in item && item.skip)).map(item => (
                <div key={item.key} className={`flex items-center gap-3 p-4 rounded-xl border ${item.checked ? 'bg-green-50 border-green-200' : 'bg-white border-[#e0d4c0]'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.checked ? 'bg-green-500' : 'border-2 border-[#d8cbb4]'}`}>
                    {item.checked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.checked ? 'text-green-800 line-through' : 'text-[#2a2018]'}`}>{item.label}</p>
                    {item.note && <p className="text-xs text-[#9a8d78]">{item.note}</p>}
                  </div>
                </div>
              ))}

              {/* Hat bar items checklist */}
              {checklist.hat_bar_items.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mt-4 mb-2">Hat bar items</p>
                  {checklist.hat_bar_items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border mb-2 ${item.ordered ? 'bg-green-50 border-green-200' : 'bg-white border-[#e0d4c0]'}`}>
                      <input type="checkbox" checked={item.ordered}
                        onChange={e => { const items = [...checklist.hat_bar_items]; items[i] = { ...items[i], ordered: e.target.checked }; set({ hat_bar_items: items }); }} />
                      <p className={`text-sm flex-1 ${item.ordered ? 'line-through text-[#9a8d78]' : 'text-[#2a2018]'}`}>
                        {item.item} — {item.qty} {item.unit}
                        {item.cost > 0 ? ` (${fmt(item.cost * item.qty)})` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Merchandise checklist */}
              {checklist.merchandise_items.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mt-4 mb-2">Merchandise</p>
                  {checklist.merchandise_items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border mb-2 ${item.ordered ? 'bg-green-50 border-green-200' : 'bg-white border-[#e0d4c0]'}`}>
                      <input type="checkbox" checked={item.ordered}
                        onChange={e => { const m = [...checklist.merchandise_items]; m[i] = { ...m[i], ordered: e.target.checked }; set({ merchandise_items: m }); }} />
                      <p className={`text-sm flex-1 ${item.ordered ? 'line-through text-[#9a8d78]' : 'text-[#2a2018]'}`}>
                        {item.item} × {item.qty} {item.cost > 0 ? `(${fmt(item.cost * item.qty)})` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TASKS */}
          {tab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#2a2018]">Task list</h3>
                  <p className="text-sm text-[#7a6e5c]">
                    {checklist.tasks.filter(t => t.completed).length} of {checklist.tasks.length} completed
                    {' · '}Auto-updates as you complete checklist items
                  </p>
                </div>
                <button onClick={() => {
                  const newTask: Task = { id: `manual-${Date.now()}`, label: 'New task', category: 'custom', due_date: '', completed: false, completed_date: '', assigned_to: '', auto_generated: false };
                  set({ tasks: [...checklist.tasks, newTask] });
                }} className="rounded-full bg-[#2a2018] text-[#f3ead9] text-sm px-4 py-2 hover:bg-[#3a2e22]">
                  + Add task
                </button>
              </div>

              {/* Group by category */}
              {['consultation', 'quote', 'proposal', 'follow_up', 'agreement', 'payment', 'hats', 'merchandise', 'staff', 'venue', 'hotel', 'prep', 'testimonial', 'custom'].map(cat => {
                const catTasks = checklist.tasks.filter(t => t.category === cat);
                if (catTasks.length === 0) return null;
                const catLabels: Record<string, string> = {
                  consultation: 'Consultation', quote: 'Quote', proposal: 'Proposal',
                  follow_up: 'Follow up', agreement: 'Agreement', payment: 'Payment',
                  hats: 'Hats', merchandise: 'Merchandise', staff: 'Staff',
                  venue: 'Venue', hotel: 'Hotel', prep: 'Prep', testimonial: 'Testimonial', custom: 'Custom'
                };
                return (
                  <div key={cat}>
                    <p className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-2">{catLabels[cat]}</p>
                    <div className="space-y-2">
                      {catTasks.map((task, i) => (
                        <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-[#e0d4c0]'}`}>
                          <input type="checkbox" checked={task.completed}
                            onChange={e => {
                              const newTasks = checklist.tasks.map(t => t.id === task.id ? { ...t, completed: e.target.checked, completed_date: e.target.checked ? new Date().toISOString().split('T')[0] : '' } : t);
                              set({ tasks: newTasks });
                            }}
                            className="mt-0.5" />
                          <div className="flex-1">
                            {task.auto_generated ? (
                              <p className={`text-sm font-medium ${task.completed ? 'text-green-800 line-through' : 'text-[#2a2018]'}`}>{task.label}</p>
                            ) : (
                              <input value={task.label} onChange={e => {
                                const newTasks = checklist.tasks.map(t => t.id === task.id ? { ...t, label: e.target.value } : t);
                                set({ tasks: newTasks });
                              }} className={`w-full bg-transparent text-sm font-medium outline-none ${task.completed ? 'text-green-800 line-through' : 'text-[#2a2018]'}`} />
                            )}
                            <div className="flex gap-3 mt-1 flex-wrap">
                              {task.due_date && (
                                <span className="text-xs text-[#9a8d78]">
                                  Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {!task.auto_generated && (
                                <input type="date" value={task.due_date}
                                  onChange={e => {
                                    const newTasks = checklist.tasks.map(t => t.id === task.id ? { ...t, due_date: e.target.value } : t);
                                    set({ tasks: newTasks });
                                  }}
                                  className="text-xs border border-[#d8cbb4] rounded px-2 py-0.5 outline-none" />
                              )}
                              <input value={task.assigned_to} onChange={e => {
                                const newTasks = checklist.tasks.map(t => t.id === task.id ? { ...t, assigned_to: e.target.value } : t);
                                set({ tasks: newTasks });
                              }} placeholder="Assign to…"
                                className="text-xs border border-[#d8cbb4] rounded px-2 py-0.5 outline-none bg-transparent w-24" />
                              {!task.auto_generated && (
                                <button onClick={() => set({ tasks: checklist.tasks.filter(t => t.id !== task.id) })}
                                  className="text-xs text-red-400 hover:text-red-600">Remove</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Task notes */}
              <div className="border-t border-[#e0d4c0] pt-4">
                <p className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-2">Event notes</p>
                <textarea value={(checklist as any).task_notes || ''} 
                  onChange={e => set({ task_notes: e.target.value } as any)}
                  rows={4} placeholder="Internal notes for this event — anything the team needs to know…"
                  className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a] resize-none" />
              </div>

              {/* Follow up section */}
              <div className="border-t border-[#e0d4c0] pt-4">
                <p className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-2">Follow up reminder</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-[#7a6e5c] mb-1">Follow up date</label>
                    <input type="date" value={checklist.follow_up_date}
                      onChange={e => set({ follow_up_date: e.target.value })}
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#7a6e5c] mb-1">Notes</label>
                    <input value={checklist.follow_up_notes}
                      onChange={e => set({ follow_up_notes: e.target.value })}
                      placeholder="What to follow up on…"
                      className="w-full rounded-lg border border-[#d8cbb4] px-3 py-2 text-sm outline-none focus:border-[#c9a36a]" />
                  </div>
                </div>
              </div>

              {/* Payment tracking */}
              <div className="border-t border-[#e0d4c0] pt-4">
                <p className="text-xs uppercase tracking-wider text-[#9a8d78] font-semibold mb-2">Payment milestones</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={checklist.deposit_received}
                      onChange={e => set({ deposit_received: e.target.checked })} />
                    Deposit received ✓
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={checklist.final_payment_received}
                      onChange={e => set({ final_payment_received: e.target.checked })} />
                    Final payment received ✓
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={checklist.testimonial_requested}
                      onChange={e => set({ testimonial_requested: e.target.checked })} />
                    Testimonial requested from client
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={checklist.testimonial_received}
                      onChange={e => set({ testimonial_received: e.target.checked })} />
                    Testimonial received ✓
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-[#e0d4c0] px-6 py-4 flex gap-3">
          <button onClick={save} disabled={saving}
            className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-3 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={generateProposal}
            className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-6 py-3 text-sm hover:bg-[#f6efe4]">
            Generate proposal
          </button>
          <button onClick={onClose}
            className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-6 py-3 hover:bg-[#f6efe4]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Admin Events Page ──────────────────────────────────────────────────

const AdminEvents: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [checklists, setChecklists] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'event_date' | 'created_at' | 'name' | 'status'>('event_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    if (authed) {
      supabase.from('bookings').select('*').order('event_date', { ascending: true }).then(({ data }) => {
        setBookings((data || []) as Booking[]);
        setLoading(false);
      });
      supabase.from('event_checklist').select('*').then(({ data }) => {
        const map: Record<string, any> = {};
        (data || []).forEach((c: any) => { map[c.booking_id] = c; });
        setChecklists(map);
      });
    }
  }, [authed]);

  const stats = useMemo(() => {
    const byStatus = STATUS_OPTIONS.reduce((acc, s) => {
      acc[s.id] = bookings.filter(b => (b.checklist_status || 'quote_request') === s.id).length;
      return acc;
    }, {} as Record<string, number>);
    // Force recalc when bookings change

    const getRevenue = (b: Booking) => parseMoney(b.final_total || b.estimated_total);
    const getPaid = (b: Booking) => b.amount_paid || 0;

    const quoteRevenue = bookings.filter(b => (b.checklist_status || 'quote_request') === 'quote_request').reduce((s, b) => s + getRevenue(b), 0);
    const bookedRevenue = bookings.filter(b => ['booked','in_prep'].includes(b.checklist_status || 'quote_request')).reduce((s, b) => s + getRevenue(b), 0);
    const paidTotal = bookings.reduce((s, b) => s + getPaid(b), 0);
    const pastDue = bookings.filter(b => {
      const eventDate = b.event_date ? new Date(b.event_date) : null;
      return eventDate && eventDate < new Date() && (b.amount_paid || 0) < parseMoney(b.final_total || b.estimated_total);
    }).reduce((s, b) => s + (parseMoney(b.final_total || b.estimated_total) - (b.amount_paid || 0)), 0);
    const totalRevenue = bookings.reduce((s, b) => s + getRevenue(b), 0);
    const totalCosts = bookings.reduce((s, b) => s + parseMoney(b.final_total || b.estimated_total) * 0.4, 0); // rough estimate until checklist costs loaded

    return { byStatus, quoteRevenue, bookedRevenue, paidTotal, pastDue, totalRevenue };
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = filterStatus === 'all' ? [...bookings] : bookings.filter(b => (b.checklist_status || 'quote_request') === filterStatus);
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortBy === 'event_date') { av = a.event_date || '9999'; bv = b.event_date || '9999'; }
      else if (sortBy === 'created_at') { av = a.created_at; bv = b.created_at; }
      else if (sortBy === 'name') { av = a.name || ''; bv = b.name || ''; }
      else if (sortBy === 'status') { av = a.checklist_status || ''; bv = b.checklist_status || ''; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [bookings, filterStatus, sortBy, sortDir]);

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


  // Generate upcoming tasks from all bookings
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasks: { booking: Booking; task: string; dueDate: Date; urgency: 'overdue' | 'today' | 'this_week' | 'next_week' | 'upcoming'; assignedTo?: string; }[] = [];

    bookings.forEach(b => {
      if (!b.event_date || ['completed', 'cancelled'].includes(b.checklist_status || '')) return;
      const eventDate = new Date(b.event_date + 'T00:00:00');
      const daysUntil = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const cl = checklists[b.id];
      const status = b.checklist_status || 'quote_request';

      const getUrgency = (dueDate: Date) => {
        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue < 0) return 'overdue' as const;
        if (daysUntilDue === 0) return 'today' as const;
        if (daysUntilDue <= 7) return 'this_week' as const;
        if (daysUntilDue <= 14) return 'next_week' as const;
        return 'upcoming' as const;
      };

      const addTask = (task: string, daysBefore: number, assignedTo?: string) => {
        const d = new Date(eventDate);
        d.setDate(d.getDate() - daysBefore);
        tasks.push({ booking: b, task, dueDate: d, urgency: getUrgency(d), assignedTo });
      };

      // Agreement - show if not signed
      if (!cl?.agreement_signed) {
        addTask(`Get signed agreement — ${b.name}`, 42);
      }

      // Hats - show if not ordered and event is booked/in_prep
      if (!cl?.hats_ordered && ['booked', 'ready'].includes(status)) {
        addTask(`Order hats — ${b.name} (4-5 wk lead time)`, 28);
      }

      // Staff - show if no staff added and event is booked/in_prep
      if ((!cl?.staff || cl.staff.length === 0) && ['booked', 'ready'].includes(status)) {
        addTask(`Confirm staff — ${b.name}`, 14);
      }

      // Final prep - show if in_prep and event is upcoming
      if (daysUntil > 0 && daysUntil <= 7 && ['ready', 'booked'].includes(status)) {
        addTask(`Final prep — ${b.name} at ${b.event_location || ''}`, 3);
      }

      // Event day
      if (daysUntil === 0) {
        tasks.push({ booking: b, task: `EVENT TODAY: ${b.name} — ${b.event_location}`, dueDate: today, urgency: 'today' });
      }

      // Custom tasks from checklist
      if (cl?.tasks) {
        cl.tasks.filter((t: any) => !t.completed && !t.auto_generated && t.due_date).forEach((t: any) => {
          const d = new Date(t.due_date + 'T00:00:00');
          tasks.push({ booking: b, task: `${t.label} — ${b.name}`, dueDate: d, urgency: getUrgency(d), assignedTo: t.assigned_to || undefined });
        });
      }
    });

    return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [bookings, checklists]);

  const urgencyConfig = {
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' },
    today: { label: 'Today', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    this_week: { label: 'This week', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    next_week: { label: 'Next week', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    upcoming: { label: 'Upcoming', color: 'bg-[#f6efe4] text-[#5b5043] border-[#e0d4c0]' },
  };

  const signOut = () => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); };

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      {selectedBooking && (
        <EventModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSaved={(updatedBooking, updatedChecklist) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setChecklists(prev => ({ ...prev, [updatedBooking.id]: updatedChecklist }));
            setSelectedBooking(updatedBooking);
          }}
          flash={flash}
        />
      )}

      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Event Manager</h1>
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

        {/* Stage filter buttons */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => setFilterStatus('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${filterStatus === 'all' ? 'bg-[#2a2018] text-[#f3ead9] border-[#2a2018]' : 'bg-white border-[#d8cbb4] text-[#5b5043] hover:border-[#2a2018]'}`}>
            All ({bookings.length})
          </button>
          {STATUS_OPTIONS.map(s => (
            <button key={s.id} onClick={() => setFilterStatus(filterStatus === s.id ? 'all' : s.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${filterStatus === s.id ? 'bg-[#2a2018] text-[#f3ead9] border-[#2a2018]' : 'bg-white border-[#d8cbb4] text-[#5b5043] hover:border-[#2a2018]'}`}>
              {s.label} {stats[s.id] > 0 ? `(${stats[s.id]})` : ''}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-sm text-[#5b5043]">Sort by</span>
          {[
            { id: 'event_date', label: 'Event date' },
            { id: 'name', label: 'Client name' },
            { id: 'status', label: 'Status' },
            { id: 'created_at', label: 'Date added' },
          ].map(s => (
            <button key={s.id} onClick={() => { if (sortBy === s.id) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(s.id as any); setSortDir('asc'); } }}
              className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${sortBy === s.id ? 'bg-[#2a2018] text-[#f3ead9] border-[#2a2018]' : 'bg-white border-[#d8cbb4] text-[#5b5043] hover:border-[#2a2018]'}`}>
              {s.label} {sortBy === s.id ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>


        {/* Financial summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-4">
            <p className="text-xs uppercase tracking-wider text-[#9a8d78]">Quote requests</p>
            <p className="font-serif text-xl text-[#2a2018]">{fmt(stats.quoteRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-4">
            <p className="text-xs uppercase tracking-wider text-[#9a8d78]">Booked</p>
            <p className="font-serif text-xl text-[#2a2018]">{fmt(stats.bookedRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-4">
            <p className="text-xs uppercase tracking-wider text-[#9a8d78]">Paid</p>
            <p className="font-serif text-xl text-green-700">{fmt(stats.paidTotal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-4">
            <p className="text-xs uppercase tracking-wider text-[#9a8d78]">Past due</p>
            <p className={`font-serif text-xl ${stats.pastDue > 0 ? 'text-red-600' : 'text-green-700'}`}>
              {stats.pastDue > 0 ? fmt(stats.pastDue) : 'None'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-4">
            <p className="text-xs uppercase tracking-wider text-[#9a8d78]">Total revenue</p>
            <p className="font-serif text-xl text-[#2a2018]">{fmt(stats.totalRevenue)}</p>
          </div>
          <div className="bg-[#2a2018] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-[#c9a36a]">Balance due</p>
            <p className="font-serif text-xl text-[#f3ead9]">{fmt(stats.totalRevenue - stats.paidTotal)}</p>
          </div>
        </div>

        {/* Events list */}
        {loading ? (
          <p className="text-[#5b5043]">Loading events…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e0d4c0] p-10 text-center text-[#7a6e5c]">
            No events found.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(booking => {
              const status = STATUS_OPTIONS.find(s => s.id === (booking.checklist_status || 'quote_request'));
              const revenue = parseMoney(booking.final_total || booking.estimated_total);
              return (
                <div key={booking.id} className="bg-white rounded-xl border border-[#e0d4c0] p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#2a2018]">{booking.name}</p>
                        {status && (
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${status.color}`}>{status.label}</span>
                        )}
                      </div>
                      <p className="text-sm text-[#5b5043]">{booking.event_type} · {fmtDate(booking.event_date)}</p>
                      <p className="text-xs text-[#9a8d78]">{booking.event_location} · {booking.guests} guests · {booking.hours || 3} hrs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#9a8d78]">Revenue</p>
                      <p className="font-bold text-[#2a2018]">{fmt(revenue)}</p>
                      <p className="text-xs text-[#c9a36a] mt-0.5">Click to manage →</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-6 self-start">
          <div className="bg-white rounded-xl border border-[#e0d4c0] overflow-hidden">
            <div className="bg-[#2a2018] text-[#f3ead9] px-4 py-3">
              <p className="font-serif text-lg">Upcoming tasks</p>
              <p className="text-xs text-[#c9a36a]">{upcomingTasks.filter(t => t.urgency !== 'upcoming').length} need attention</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {upcomingTasks.length === 0 ? (
                <p className="p-4 text-sm text-[#7a6e5c]">No upcoming tasks.</p>
              ) : (
                <div className="divide-y divide-[#f0e8d8]">
                  {upcomingTasks.map((t, i) => {
                    const cfg = urgencyConfig[t.urgency];
                    return (
                      <div key={i} className={`p-3 cursor-pointer hover:bg-[#f6efe4] ${t.urgency === 'overdue' ? 'bg-red-50' : t.urgency === 'today' ? 'bg-amber-50' : ''}`}
                        onClick={() => setSelectedBooking(t.booking)}>
                        <div className="flex items-start gap-2">
                          <span className={`text-xs rounded-full px-2 py-0.5 border font-medium shrink-0 mt-0.5 ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <div>
                            <p className="text-sm text-[#2a2018] font-medium leading-snug">{t.task}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-xs text-[#9a8d78]">
                                Due {t.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {t.urgency === 'overdue' ? ' ⚠ OVERDUE' : ''}
                              </p>
                              {t.assignedTo && (
                                <span className="text-xs bg-[#f3ead9] text-[#5b5043] rounded-full px-2 py-0.5">
                                  👤 {t.assignedTo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEvents;
