import { loadStripe } from '@stripe/stripe-js';

// FamousPay (Stripe Connect) configuration for the maddhattery store.
const STRIPE_ACCOUNT_ID = 'acct_1TkIHlHxBLNaYYiq';
const PUBLISHABLE_KEY =
  'pk_live_51OJhJBHdGQpsHqInIzu7c6PzGPSH0yImD4xfpofvxvFZs0VFhPRXZCyEgYkkhOtBOXFWvssYASs851mflwQvjnrl00T6DbUwWZ';

export const famousPayPromise =
  STRIPE_ACCOUNT_ID && STRIPE_ACCOUNT_ID !== 'STRIPE_ACCOUNT_ID'
    ? loadStripe(PUBLISHABLE_KEY, { stripeAccount: STRIPE_ACCOUNT_ID })
    : null;
