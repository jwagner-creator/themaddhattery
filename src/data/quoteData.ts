// Single source of truth for all pricing & options used across the quote builder.

// ─────────────────────────────────────────────────────────────────────────────
// YOUR CALENDLY LINK
// Replace this with your actual Calendly scheduling link.
// Sign up free at https://calendly.com
// ─────────────────────────────────────────────────────────────────────────────
export const BOOKING_URL =
  import.meta.env.VITE_BOOKING_URL ||
  'https://calendly.com/jwagner-thevinhaus/hat-bar-party-group-6-12';

export const STYLIST_HOURLY_RATE = 25; // $/hr per stylist
export const DEPOSIT_PER_GUEST = 50; // $ applied to total

export interface EventType {
  id: string;
  label: string;
}

export const EVENT_TYPES: EventType[] = [
  { id: 'wedding', label: 'Wedding or bachelorette party' },
  { id: 'girls-night', label: "Girls' night & celebrations" },
  { id: 'corp-employee', label: 'Corporate employee appreciation' },
  { id: 'corp-client', label: 'Corporate client appreciation' },
  { id: 'host-sponsored-guest-paid', label: 'Host-sponsored, guest paid' },
  { id: 'other', label: 'Other private event' },
];

// For these event types the host does NOT cover the per-person hat cost.
export const NO_PER_PERSON_EVENT_TYPES = ['host-sponsored-guest-paid'];

export interface BudgetTier {
  id: string;
  range: string;
  value: number;
  title: string;
  description: string;
  brandable?: boolean;
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    id: 'tier-1',
    range: '$25 – $50',
    value: 50,
    title: 'Sourced Western Hat',
    description: 'Sourced fun western hat that can be designed with our hat bar.',
  },
  {
    id: 'tier-2',
    range: '$50 – $99',
    value: 99,
    title: 'Straw or Faux Suede',
    description: 'Quality straw or faux suede hat, personalization with hat bar.',
  },
  {
    id: 'tier-3',
    range: '$100 – $199',
    value: 199,
    title: 'Premium Straw / Suede',
    description: 'Quality straw or faux suede hat, personalization with hat bar.',
  },
  {
    id: 'tier-4',
    range: '$200 – $250',
    value: 250,
    title: 'Australian Wool Felt',
    description:
      'Premium Australian wool felt — best option for branding and personalization.',
    brandable: true,
  },
];

export const HOURS_OPTIONS = [2, 3, 4];

export const HAT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export interface AddOn {
  id: string;
  label: string;
  price: number;
  note?: string;
}

export const SERVICE_ADDONS: AddOn[] = [
  { id: 'branding', label: 'Branding & burning station', price: 150 },
  {
    id: 'travel',
    label: 'Travel outside DFW area',
    price: 75,
    note: 'Requires a minimum of 10 guests.',
  },
];

export interface CustomAddOn {
  id: string;
  label: string;
  pricePerGuest: number;
  priceLabel: string;
}

export const CUSTOM_ADDONS: CustomAddOn[] = [
  {
    id: 'leather-band',
    label: 'Leather band, personalized branding',
    pricePerGuest: 15,
    priceLabel: '$15 / guest',
  },
  {
    id: 'cards',
    label: 'Playing cards with custom initials or logo',
    pricePerGuest: 5,
    priceLabel: '$5 / guest',
  },
  {
    id: 'hat-clip',
    label: 'Leather hat clip, personalized',
    pricePerGuest: 15,
    priceLabel: '$15 / guest',
  },
];

export function getTeamSize(guests: number): number {
  if (guests <= 10) return 2;
  if (guests <= 50) return 3;
  if (guests <= 100) return 4;
  if (guests <= 200) return 5;
  if (guests <= 400) return 6;
  if (guests <= 700) return 7;
  return 8;
}

export function recommendedHours(guests: number): number {
  return guests <= 10 ? 2 : 3;
}

export interface QuoteState {
  eventType: string;
  budgetTierId: string;
  guests: number;
  hours: number;
  eventDate: string;
  serviceAddons: string[];
  customAddons: string[];
  sizes: string[];
  notes: string;
}

export interface QuoteBreakdown {
  hatTier: BudgetTier;
  teamSize: number;
  hatTotal: number;
  stylistTotal: number;
  addonsTotal: number;
  customAddonsTotal: number;
  total: number;
  deposit: number;
  hasCustom: boolean;
  perPersonCharged: boolean;
}

export function computeQuote(state: QuoteState): QuoteBreakdown {
  const hatTier = BUDGET_TIERS.find((t) => t.id === state.budgetTierId) || BUDGET_TIERS[0];
  const teamSize = getTeamSize(state.guests);
  const perPersonCharged = !NO_PER_PERSON_EVENT_TYPES.includes(state.eventType);
  const hatTotal = perPersonCharged ? hatTier.value * state.guests : 0;
  const stylistTotal = teamSize * STYLIST_HOURLY_RATE * state.hours;
  const addonsTotal = SERVICE_ADDONS.filter((a) =>
    state.serviceAddons.includes(a.id)
  ).reduce((sum, a) => sum + a.price, 0);
  const customAddonsTotal = CUSTOM_ADDONS.filter((a) =>
    state.customAddons.includes(a.id)
  ).reduce((sum, a) => sum + a.pricePerGuest * state.guests, 0);
  const total = hatTotal + stylistTotal + addonsTotal + customAddonsTotal;
  const deposit = perPersonCharged
    ? DEPOSIT_PER_GUEST * state.guests
    : Math.round(total / 2);
  return {
    hatTier,
    teamSize,
    hatTotal,
    stylistTotal,
    addonsTotal,
    customAddonsTotal,
    total,
    deposit,
    hasCustom: state.customAddons.length > 0,
    perPersonCharged,
  };
}

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
