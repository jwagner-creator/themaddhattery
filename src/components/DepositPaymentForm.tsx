import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { money } from '@/data/quoteData';

interface DepositPaymentFormProps {
  depositCents: number;
  onSuccess: (paymentIntent: { id: string }) => void;
}

const DepositPaymentForm: React.FC<DepositPaymentFormProps> = ({ depositCents, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    } else {
      setError('Payment could not be completed.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3.5 transition-colors disabled:opacity-60"
      >
        {loading ? 'Processing…' : `Pay deposit ${money(depositCents / 100)}`}
      </button>
      <p className="text-center text-[11px] text-[#8c8170]">
        Secured by FamousPay. Your deposit is applied to your event total.
      </p>
    </form>
  );
};

export default DepositPaymentForm;
