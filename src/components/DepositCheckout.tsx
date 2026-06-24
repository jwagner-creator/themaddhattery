import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { famousPayPromise } from '@/lib/famouspay';
import DepositPaymentForm from '@/components/DepositPaymentForm';
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

type Step = 'details' | 'payment' | 'done';

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
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset when reopened, and prefill the event date chosen in the quote builder
  useEffect(() => {
    if (open) {
      setStep('details');
      setClientSecret('');
      setError('');
      setLoading(false);
      if (initialEventDate) setEventDate(initialEventDate);
    }
  }, [open, initialEventDate]);


  if (!open || !breakdown) return null;

  const depositCents = Math.round(breakdown.deposit * 100);

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    setError('');

    if (!famousPayPromise) {
      setError('Payment processing is being set up. Please use "Get this as a quote" for now.');
      setLoading(false);
      return;
    }

    const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: depositCents,
        currency: 'usd',
        metadata: {
          type: 'hat_bar_deposit',
          email,
          guests: String(guests),
          event_type: eventTypeLabel,
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

  const handleSuccess = async (paymentIntent: { id: string }) => {
    // Record the booking
    try {
      await supabase.from('hat_bar_bookings').insert({
        name,
        email,
        phone: phone || null,
        event_type: eventTypeLabel,
        budget_tier: breakdown.hatTier.range,
        guests,
        hours,
        service_addons: serviceAddons,
        custom_addons: customAddons,
        estimated_total: Math.round(breakdown.total * 100),
        deposit_amount: depositCents,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'deposit_paid',
        event_date: eventDate || null,
        notes: notes || null,
      });
    } catch {
      /* booking recording is best-effort */
    }

    // Add to CRM
    const crmTags = ['hat-bar-booking', 'deposit-paid', eventTypeLabel, `${guests}-guests`];
    if (eventDate) crmTags.push(`event-date:${eventDate}`);

    const messageParts = [
      eventDate ? `Event date: ${eventDate}` : null,
      `Event type: ${eventTypeLabel}`,
      `Guests: ${guests}`,
      `Hours: ${hours}`,
      `Estimated total: ${money(breakdown.total)}`,
      `Deposit paid: ${money(breakdown.deposit)}`,
      serviceAddons.length ? `Add-ons: ${serviceAddons.join(', ')}` : null,
      customAddons.length ? `Custom: ${customAddons.join(', ')}` : null,
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean);
    const crmMessage = messageParts.join('\n');

    fetch('https://famous.ai/api/crm/6a3626102bd450af612d0a20/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: name || undefined,
        phone: phone || undefined,
        sms_opt_in: smsOptIn === true,
        source: 'deposit-checkout',
        tags: crmTags,
        notes: crmMessage,
        message: crmMessage,
        fields: {
          event_date: eventDate || undefined,
          event_type: eventTypeLabel,
          guests: String(guests),
          hours: String(hours),
          deposit_paid: money(breakdown.deposit),
          estimated_total: money(breakdown.total),
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
          {/* Summary header */}
          {step !== 'done' && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">
                Reserve your date
              </p>
              <h3 className="font-serif text-2xl text-[#2a2018]">Pay your deposit</h3>
              <div className="mt-4 rounded-xl bg-white border border-[#e0d4c0] p-4 text-sm space-y-1.5">
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
                  <span className="text-[#5b5043]">Deposit due today ($50/guest)</span>
                  <span className="font-bold text-[#2a2018]">{money(breakdown.deposit)}</span>
                </div>
              </div>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3.5 transition-colors disabled:opacity-60"
              >
                {loading ? 'Loading…' : 'Continue to payment'}
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
                Your {money(breakdown.deposit)} deposit is paid and your date is reserved.
              </p>
              <p className="text-[#5b5043] mb-6">
                We'll email {email} with confirmation and next steps.
              </p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-[#2a2018] text-[#f3ead9] font-semibold px-7 py-3 hover:bg-[#3a2e22] transition-colors"
              >
                Schedule a consultation
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

export default DepositCheckout;
