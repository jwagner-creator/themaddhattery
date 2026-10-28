import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { money, QuoteBreakdown } from '@/data/quoteData';

const CONSULTATION_URL = 'https://calendar.app.google/yfg2ySGbLyUqLxG96';
const EDGE_URL = 'https://hystlehjwpagcktoyoia.supabase.co/functions/v1';

interface DepositCheckoutProps {
  open: boolean;
  onClose: () => void;
  breakdown: QuoteBreakdown | null;
  eventTypeLabel: string;
  guests: number;
  hours: number;
  serviceAddons: string[];
  customAddons: string[];
  initialEventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  hatStyle?: string;
  eventVenue?: string;
  eventCity?: string;
  eventLocation?: string;
  company?: string;
  flexibleDates?: boolean;
  displayTotal?: number;
  displayDeposit?: number;
  hatPricePerGuest?: number;
  hearAboutUs?: string;
  sourceLink?: string;
  // Contact info pre-filled from the builder
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
  initialSmsOptIn?: boolean;
  notes?: string;
}

const DepositCheckout: React.FC<DepositCheckoutProps> = ({
  open,
  onClose,
  breakdown,
  eventTypeLabel,
  guests,
  hours,
  serviceAddons,
  customAddons,
  initialEventDate = '',
  eventStartTime = '',
  eventEndTime = '',
  hatStyle = '',
  eventVenue = '',
  eventCity = '',
  eventLocation = '',
  company = '',
  flexibleDates = false,
  displayTotal,
  displayDeposit,
  hatPricePerGuest = 0,
  hearAboutUs = '',
  sourceLink = '',
  initialName = '',
  initialEmail = '',
  initialPhone = '',
  initialSmsOptIn = true,
  notes = '',
}) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [smsOptIn, setSmsOptIn] = useState(initialSmsOptIn);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (open) {
      setStatus('idle');
      setName(initialName);
      setEmail(initialEmail);
      setPhone(initialPhone);
      setSmsOptIn(initialSmsOptIn);
    }
  }, [open, initialName, initialEmail, initialPhone, initialSmsOptIn]);

  if (!open || !breakdown) return null;

  const estimatedTotal = displayTotal ? money(displayTotal) : money(breakdown.total);
  const estimatedDeposit = displayDeposit ? money(displayDeposit) : money(breakdown.deposit);

  const fmtTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const eventSummaryLines = [
    eventTypeLabel,
    initialEventDate ? new Date(initialEventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null,
    (eventStartTime || eventEndTime) ? `${fmtTime(eventStartTime)}${eventEndTime ? ` – ${fmtTime(eventEndTime)}` : ''}` : null,
    eventVenue || eventCity ? [eventVenue, eventCity].filter(Boolean).join(', ') : (eventLocation || null),
    company || null,
  ].filter(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setStatus('loading');

    try {
      await supabase.from('leads').insert({
        name,
        email,
        phone: phone || null,
        sms_opt_in: smsOptIn,
        source: 'event-quote-request',
        event_type: eventTypeLabel,
        event_date: initialEventDate || null,
        event_start_time: eventStartTime || null,
        event_end_time: eventEndTime || null,
        event_venue: eventVenue || null,
        event_city: eventCity || null,
        event_location: [eventVenue, eventCity].filter(Boolean).join(', ') || eventLocation || null,
        hat_style: hatStyle || null,
        company: company || null,
        flexible_dates: flexibleDates || false,
        guests,
        hours,
        estimated_total: estimatedTotal,
        deposit: estimatedDeposit,
        notes: notes || null,
        source_detail: hearAboutUs || null,
        source_link: sourceLink || null,
        hat_price_per_guest: hatPricePerGuest || null,
        service_addons: serviceAddons.join(', ') || null,
        custom_addons: customAddons.join(', ') || null,
      });
    } catch {
      /* best effort */
    }

    // Send email notification
    try {
      await fetch(`${EDGE_URL}/event-quote-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3RsZWhqd3BhZ2NrdG95b2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjY5MDUsImV4cCI6MjA5Nzg0MjkwNX0.XE3XIxkuJLl5UNyD7L8RH7knNK8_sSZv1qdEg1a0zvs',
        },
        body: JSON.stringify({
          lead: {
            name,
            email,
            phone,
            event_type: eventTypeLabel,
            event_date: initialEventDate,
            event_start_time: eventStartTime,
            event_end_time: eventEndTime,
            event_venue: eventVenue,
            event_city: eventCity,
            event_location: [eventVenue, eventCity].filter(Boolean).join(', ') || eventLocation,
            hat_style: hatStyle,
            company,
            guests,
            hours,
            estimated_total: estimatedTotal,
            deposit: estimatedDeposit,
            notes,
            source_detail: hearAboutUs,
            source_link: sourceLink,
            service_addons: serviceAddons.join(', '),
            custom_addons: customAddons.join(', '),
          },
        }),
      });
    } catch {
      // Non-blocking
    }

    setStatus('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#f6efe4] rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5b5043] hover:text-[#2a2018] text-2xl leading-none z-10"
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-7 sm:p-8">
          {status === 'done' ? (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#c9a36a] flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2018" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-[#2a2018] mb-2">You're all set!</h3>
              <p className="text-[#5b5043] mb-1">
                We've received your quote request for <strong>{eventTypeLabel}</strong> — {guests} guests,
                estimated {estimatedTotal}.
              </p>
              <p className="text-[#5b5043] mb-6">
                We'll be in touch within 1–2 business days to confirm everything and send you
                a deposit link to lock in your date.
              </p>
              <a
                href={CONSULTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-3.5 transition-colors"
              >
                Schedule a consultation →
              </a>
              <button
                onClick={onClose}
                className="block w-full mt-4 text-sm text-[#7a6e5c] hover:text-[#2a2018]"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">Review your quote</p>
              <h3 className="font-serif text-2xl text-[#2a2018] mb-4">Confirm &amp; send</h3>

              {/* Quote summary */}
              <div className="mb-5 rounded-xl bg-white border border-[#e0d4c0] p-4 text-sm space-y-1.5">
                {eventSummaryLines.map((line, i) => (
                  <p key={i} className={i === 0 ? 'font-medium text-[#2a2018]' : 'text-[#5b5043]'}>{line}</p>
                ))}
                <div className="border-t border-[#e0d4c0] pt-2 mt-2 flex justify-between">
                  <span className="text-[#5b5043]">{guests} guests · Estimated total</span>
                  <span className="font-bold text-[#2a2018]">{estimatedTotal}</span>
                </div>
                <div className="flex justify-between text-xs text-[#9a8d78]">
                  <span>Deposit to book (50%)</span>
                  <span className="font-semibold text-[#c9a36a]">{estimatedDeposit}</span>
                </div>
              </div>

              {/* Contact info — pre-filled, still editable */}
              <p className="text-xs text-[#8c8170] mb-3">Confirm your contact info before sending.</p>
              <form onSubmit={submit} className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full rounded-lg border border-[#d8cbb4] bg-white px-4 py-3 text-[#2a2018] outline-none focus:border-[#c9a36a]"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-lg border border-[#d8cbb4] bg-white px-4 py-3 text-[#2a2018] outline-none focus:border-[#c9a36a]"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="w-full rounded-lg border border-[#d8cbb4] bg-white px-4 py-3 text-[#2a2018] outline-none focus:border-[#c9a36a]"
                />
                <label className="flex items-start gap-2 text-sm text-[#5b5043]">
                  <input
                    type="checkbox"
                    checked={smsOptIn}
                    onChange={(e) => setSmsOptIn(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Text me about my event. Msg &amp; data rates may apply. Reply STOP to unsubscribe.
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3.5 transition-colors disabled:opacity-60"
                >
                  {status === 'loading' ? 'Sending…' : 'Confirm & send quote'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositCheckout;
