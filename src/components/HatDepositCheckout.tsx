import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HAT_BASES, HatDesignState, type HatBase } from '@/data/hatDesign';
import { computeHatPricing } from '@/lib/hatPricing';
import { summarizeDesign } from '@/lib/designSummary';
import { money, BOOKING_URL } from '@/data/quoteData';

interface HatDepositCheckoutProps {
  open: boolean;
  onClose: () => void;
  design: HatDesignState;
  bases?: HatBase[];
}

const HatDepositCheckout: React.FC<HatDepositCheckoutProps> = ({
  open,
  onClose,
  design,
  bases = HAT_BASES,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const pricing = useMemo(() => computeHatPricing(design, bases), [design, bases]);
  const summary = useMemo(() => summarizeDesign(design, bases), [design, bases]);

  useEffect(() => {
    if (open) setStatus('idle');
  }, [open]);

  if (!open) return null;

  const designNote = [
    `Base hat: ${pricing.baseName} (${money(pricing.basePrice)})`,
    summary.colorName ? `Color: ${summary.colorName}` : null,
    summary.sizeName ? `Size: ${summary.sizeName}` : null,
    summary.bandName ? `Band: ${summary.bandName}` : null,
    pricing.extras.length ? `Personalization: ${pricing.extras.map((x) => x.label).join('; ')}` : null,
    `Estimated hat total: ${money(pricing.total)}`,
    `Deposit to reserve (50%): ${money(pricing.deposit)}`,
    notes ? `Customer notes: ${notes}` : null,
  ].filter(Boolean).join('\n');

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
        source: 'custom-hat-inquiry',
        notes: designNote,
      });
    } catch {
      /* best effort */
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
                We've saved your <strong>{pricing.baseName}</strong> design.
              </p>
              <p className="text-[#5b5043] mb-6">
                Schedule a free design consultation and we'll confirm your details and send a
                deposit link to get started on your hat.
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
                Reserve your hat
              </p>
              <h3 className="font-serif text-2xl text-[#2a2018] mb-4">
                Tell us about your design
              </h3>

              {/* Design summary */}
              <div className="mb-5 rounded-xl bg-white border border-[#e0d4c0] p-4 text-sm space-y-1.5">
                <div className="flex justify-between text-[#5b5043]">
                  <span>{pricing.baseName}</span>
                  <span className="font-medium text-[#2a2018]">{money(pricing.basePrice)}</span>
                </div>
                {summary.colorName && (
                  <div className="flex justify-between text-[#5b5043]">
                    <span>Color</span>
                    <span className="font-medium text-[#2a2018]">{summary.colorName}</span>
                  </div>
                )}
                {pricing.extras.map((x) => (
                  <div key={x.id} className="flex justify-between text-[#5b5043]">
                    <span className="pr-3">{x.label}</span>
                    <span className="font-medium text-[#2a2018] whitespace-nowrap">
                      +{money(x.price)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[#e0d4c0] pt-1.5 text-[#5b5043]">
                  <span>Estimated hat total</span>
                  <span className="font-medium text-[#2a2018]">{money(pricing.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5b5043]">Deposit to reserve (50%)</span>
                  <span className="font-bold text-[#2a2018]">{money(pricing.deposit)}</span>
                </div>
              </div>
              <p className="text-xs text-[#8c8170] mb-5">
                We'll send a payment link for the deposit after your consultation to get started on your hat.
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
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Initials, logo, paint ideas, or anything else (optional)"
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
                    Text me about my hat. Msg &amp; data rates may apply. Reply STOP to unsubscribe.
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3.5 transition-colors disabled:opacity-60"
                >
                  {status === 'loading' ? 'Saving…' : 'Send my design & schedule a consultation'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HatDepositCheckout;
