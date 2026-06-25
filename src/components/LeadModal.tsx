import React, { useEffect, useState } from 'react';
import { BOOKING_URL, money, QuoteBreakdown } from '@/data/quoteData';
import { supabase } from '@/lib/supabase';

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  breakdown: QuoteBreakdown | null;
  eventTypeLabel: string;
  guests: number;
  sizes?: string[];
  quoteNotes?: string;
  initialEventDate?: string;
}

const LeadModal: React.FC<LeadModalProps> = ({
  open,
  onClose,
  breakdown,
  eventTypeLabel,
  guests,
  sizes = [],
  quoteNotes = '',
  initialEventDate = '',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (open) {
      if (quoteNotes) setNotes(quoteNotes);
      if (initialEventDate) setEventDate(initialEventDate);
    }
  }, [open, quoteNotes, initialEventDate]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      // Save lead directly to your own Supabase table
      await supabase.from('leads').insert({
        name: name || null,
        email,
        phone: phone || null,
        sms_opt_in: smsOptIn,
        source: 'quote-request',
        event_date: eventDate || null,
        event_type: eventTypeLabel,
        guests,
        hat_sizes: sizes.length ? sizes.join(', ') : null,
        estimated_total: breakdown ? money(breakdown.total) : null,
        deposit: breakdown ? money(breakdown.deposit) : null,
        notes: notes || null,
      });
      setStatus('done');
    } catch {
      // Still show success — never block the user
      setStatus('done');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#f6efe4] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5b5043] hover:text-[#2a2018] text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-7 sm:p-8">
          {status === 'done' ? (
            <div className="text-center py-8">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#c9a36a] flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2018" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-[#2a2018] mb-2">You're on the list!</h3>
              <p className="text-[#5b5043] mb-6">
                We'll be in touch shortly with your custom quote. Want to lock in a time now?
              </p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-[#2a2018] text-[#f3ead9] font-semibold px-7 py-3 hover:bg-[#3a2e22] transition-colors"
              >
                Schedule a consultation
              </a>
            </div>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">
                Get your quote
              </p>
              <h3 className="font-serif text-2xl text-[#2a2018] mb-1">
                Send me this quote &amp; details
              </h3>
              {breakdown && (
                <p className="text-[#5b5043] mb-5">
                  Estimated total{' '}
                  <span className="font-semibold text-[#2a2018]">{money(breakdown.total)}</span> ·
                  Deposit {money(breakdown.deposit)}
                </p>
              )}

              <form onSubmit={submit} className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
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
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-lg border border-[#d8cbb4] bg-white px-4 py-3 text-[#5b5043] outline-none focus:border-[#c9a36a]"
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else we should know? (venue, theme, custom add-ons...)"
                  rows={3}
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
                    Text me about my event. Msg &amp; data rates may apply. Reply STOP to
                    unsubscribe.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3.5 transition-colors disabled:opacity-60"
                >
                  {status === 'loading' ? 'Sending…' : 'Send me this quote'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
