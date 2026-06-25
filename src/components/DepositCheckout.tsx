import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { money, QuoteBreakdown, BOOKING_URL } from '@/data/quoteData';

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
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (open) {
      setStatus('idle');
      if (initialEventDate) setEventDate(initialEventDate);
    }
  }, [open, initialEventDate]);

  if (!open || !breakdown) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setStatus('loading');

    // Save the lead to your own Supabase
    try {
      await supabase.from('leads').insert({
        name,
        email,
        phone: phone || null,
        sms_opt_in: smsOptIn,
        source: 'event-quote-request',
        event_type: eventTypeLabel,
        event_date: eventDate || null,
        guests,
        estimated_total: money(breakdown.total),
        deposit: money(breakdown.deposit),
        notes: [
          notes,
          `Hours: ${hours}`,
          serviceAddons.length ? `Add-ons: ${serviceAddons.join(', ')}` : null,
          customAddons.length ? `Custom add-ons: ${customAddons.join(', ')}` : null,
        ].filter(Boolean).join('\n') || null,
      });
    } catch {
      /* best effort — never block the user */
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
                We've received your quote for <strong>{eventTypeLabel}</strong> — {guests} guests,
                estimated {money(breakdown.total)}.
              </p>
              <p className="text-[#5b5043] mb-6">
                Schedule a free consultation and we'll confirm everything and send you a deposit
                link to lock in your date.
              </p>
              <a
                href={BOOKING_URL}
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
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">
                Reserve your date
              </p>
              <h3 className="font-serif text-2xl text-[#2a2018] mb-4">
                Tell us about your event
              </h3>

              {/* Quote summary */}
              <div className="mb-5 rounded-xl bg-white border border-[#e0d4c0] p-4 text-sm space-y-1.5">
                <div className="flex justify-between text-[#5b5043]">
                  <span>Event</span>
                  <span className="font-medium text-[#2a2018]">{eventTypeLabel}</span>
                </div>
                <div className="flex justify-between text-[#5b5043]">
                  <span>Guests</span>
                  <span className="font-medium text-[#2a2018]">{guests}</span>
                </div>
                <div className="flex justify-between text-[#5b5043]">
                  <span>Estimated total</span>
                  <span className="font-medium text-[#2a2018]">{money(breakdown.total)}</span>
                </div>
                <div className="flex justify-between border-t border-[#e0d4c0] pt-1.5">
                  <span className="text-[#5b5043]">Deposit to reserve ($50/guest)</span>
                  <span className="font-bold text-[#2a2018]">{money(breakdown.deposit)}</span>
                </div>
              </div>
              <p className="text-xs text-[#8c8170] mb-5">
                We'll send you a payment link for the deposit after your consultation to lock in your date.
              </p>

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
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1 ml-1">Event date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-lg border border-[#d8cbb4] bg-white px-4 py-3 text-[#5b5043] outline-none focus:border-[#c9a36a]"
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Venue, theme, or anything else (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-[#d8cbb4] bg-white px-4 py-3 text-[#2a2018] outline-none focus:border-[#c9a36a] resize-none"
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
                  {status === 'loading' ? 'Saving…' : 'Send my quote & schedule a consultation'}
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
