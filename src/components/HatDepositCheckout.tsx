import React, { useEffect, useMemo, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { famousPayPromise } from '@/lib/famouspay';
import DepositPaymentForm from '@/components/DepositPaymentForm';
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

type Step = 'details' | 'payment' | 'done';

/** Reserve-your-custom-hat checkout. Takes a real FamousPay deposit computed
 *  from the selected base price + personalization options. */
const HatDepositCheckout: React.FC<HatDepositCheckoutProps> = ({
  open,
  onClose,
  design,
  bases = HAT_BASES,
}) => {
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [notes, setNotes] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pricing = useMemo(() => computeHatPricing(design, bases), [design, bases]);
  const summary = useMemo(() => summarizeDesign(design, bases), [design, bases]);
  const depositCents = Math.round(pricing.deposit * 100);

  useEffect(() => {
    if (open) {
      setStep('details');
      setClientSecret('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    setError('');

    if (!famousPayPromise) {
      setError('Payment processing is being set up. Please try again soon.');
      setLoading(false);
      return;
    }

    const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: depositCents,
        currency: 'usd',
        metadata: {
          type: 'custom_hat_deposit',
          email,
          base_hat: pricing.baseName,
          hat_color: summary.colorName,
          hat_total: String(pricing.total),
          deposit: String(pricing.deposit),
        },
      },
    });

    if (fnError || data?.error || !data?.clientSecret) {
      setError('Unable to initialize payment. Please try again.');
      setLoading(false);
      return;
    }

    setClientSecret(data.clientSecret);
    setStep('payment');
    setLoading(false);
  };

  const designLines = [
    `Base hat: ${pricing.baseName} (${money(pricing.basePrice)})`,
    summary.colorName ? `Color: ${summary.colorName}` : null,
    summary.sizeName ? `Size: ${summary.sizeName}` : null,
    summary.bandName ? `Band: ${summary.bandName}` : null,
    summary.edgeName ? `Edge: ${summary.edgeName}` : null,
    summary.chainName ? `Chain: ${summary.chainName}` : null,
    pricing.extras.length ? `Personalization: ${pricing.extras.map((x) => x.label).join('; ')}` : null,
    `Estimated hat total: ${money(pricing.total)}`,
    `Deposit paid: ${money(pricing.deposit)}`,
  ].filter(Boolean) as string[];

  const handleSuccess = async (paymentIntent: { id: string }) => {
    // Best-effort booking record.
    try {
      await supabase.from('hat_bar_bookings').insert({
        name,
        email,
        phone: phone || null,
        event_type: `Custom hat — ${pricing.baseName}`,
        budget_tier: pricing.base.range,
        guests: 1,
        hours: 0,
        service_addons: [],
        custom_addons: pricing.extras.map((x) => x.id),
        estimated_total: Math.round(pricing.total * 100),
        deposit_amount: depositCents,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'deposit_paid',
        notes: [notes, ...designLines].filter(Boolean).join('\n'),
      });
    } catch {
      /* best effort */
    }

    const crmMessage = [notes ? `Customer notes: ${notes}` : null, ...designLines]
      .filter(Boolean)
      .join('\n');

    fetch('https://famous.ai/api/crm/6a3626102bd450af612d0a20/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: name || undefined,
        phone: phone || undefined,
        sms_opt_in: smsOptIn === true,
        source: 'custom-hat-deposit',
        tags: ['custom-hat-order', 'deposit-paid', pricing.baseName],
        notes: crmMessage,
        message: crmMessage,
        fields: {
          base_hat: pricing.baseName,
          hat_color: summary.colorName || undefined,
          hat_size: summary.sizeName || undefined,
          hat_total: money(pricing.total),
          deposit_paid: money(pricing.deposit),
          personalization: pricing.extras.map((x) => x.label).join('; ') || undefined,
          customer_notes: notes || undefined,
        },
      }),
    }).catch(() => {});

    setStep('done');
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
          {step !== 'done' && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">
                Reserve your hat
              </p>
              <h3 className="font-serif text-2xl text-[#2a2018]">Pay your deposit</h3>
              <div className="mt-4 rounded-xl bg-white border border-[#e0d4c0] p-4 text-sm space-y-1.5">
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
                  <span className="text-[#5b5043]">Deposit due today (50%)</span>
                  <span className="font-bold text-[#2a2018]">{money(pricing.deposit)}</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-[#8c8170]">
                Your deposit reserves your build and is applied to your final hat total. Hand-painted &amp; branded work is priced “starting at” — final pricing is confirmed before completion.
              </p>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={startPayment} className="space-y-3">
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3.5 transition-colors disabled:opacity-60"
              >
                {loading ? 'Loading…' : `Continue to payment — ${money(pricing.deposit)}`}
              </button>
            </form>
          )}

          {step === 'payment' && clientSecret && famousPayPromise && (
            <Elements
              stripe={famousPayPromise}
              options={{ clientSecret, appearance: { theme: 'stripe' } }}
            >
              <DepositPaymentForm depositCents={depositCents} onSuccess={handleSuccess} />
            </Elements>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#c9a36a] flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2018" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-[#2a2018] mb-2">Deposit received!</h3>
              <p className="text-[#5b5043] mb-1">
                Your {money(pricing.deposit)} deposit on the {pricing.baseName} is paid.
              </p>
              <p className="text-[#5b5043] mb-6">
                We'll email {email} to confirm your design details and finish your hat.
              </p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-[#2a2018] text-[#f3ead9] font-semibold px-7 py-3 hover:bg-[#3a2e22] transition-colors"
              >
                Book a design consultation
              </a>
              <button
                onClick={onClose}
                className="block w-full mt-3 text-sm text-[#7a6e5c] hover:text-[#2a2018]"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HatDepositCheckout;
