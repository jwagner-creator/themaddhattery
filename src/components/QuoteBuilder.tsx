import React, { useEffect, useMemo, useState } from 'react';
import { EVENT_TYPES, BUDGET_TIERS, HOURS_OPTIONS, SERVICE_ADDONS, CUSTOM_ADDONS, STYLIST_HOURLY_RATE, computeQuote, getTeamSize, recommendedHours, money, BOOKING_URL, QuoteState } from '@/data/quoteData';
import { HAT_BASES } from '@/data/hatDesign';
import { fetchCustomBases } from '@/lib/customBases';
import type { HatBase } from '@/data/hatDesign';

export interface QuoteDetails {
  breakdown: ReturnType<typeof computeQuote>;
  eventTypeLabel: string;
  guests: number;
  hours: number;
  eventDate: string;
  serviceAddons: string[];
  customAddons: string[];
  sizes: string[];
  notes: string;
}

interface QuoteBuilderProps {
  onRequestQuote: (args: QuoteDetails) => void;
  onPayDeposit: (args: QuoteDetails) => void;
}

const Section: React.FC<{
  step: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}> = ({ step, title, sub, children }) => (
  <div className="border-t border-[#e0d4c0] pt-7">
    <div className="flex items-baseline gap-3 mb-4">
      <span className="font-serif text-lg text-[#c9a36a]">{step}</span>
      <div>
        <h3 className="font-semibold text-[#2a2018] text-lg">{title}</h3>
        {sub && <p className="text-sm text-[#7a6e5c]">{sub}</p>}
      </div>
    </div>
    {children}
  </div>
);

// Parse price from range string like "$77" or "$50-$99"
function parsePriceFromRange(range: string): number {
  const nums = range.match(/\d+/g);
  if (!nums) return 0;
  // Use last number as the price (upper end of range)
  return parseInt(nums[nums.length - 1]);
}

const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ onRequestQuote, onPayDeposit }) => {
  const [allBases, setAllBases] = useState<HatBase[]>(HAT_BASES);

  useEffect(() => {
    fetchCustomBases().then(custom => {
      setAllBases([...HAT_BASES, ...custom]);
    });
  }, []);

  const [state, setState] = useState<QuoteState>({
    eventType: EVENT_TYPES[0].id,
    budgetTierId: BUDGET_TIERS[1].id,
    selectedHatId: '',
    selectedHatPrice: 0,
    selectedHatName: '',
    guests: 20,
    hours: 3,
    eventDate: '',
    serviceAddons: [],
    customAddons: [],
    sizes: [],
    notes: '',
  });

  const breakdown = useMemo(() => computeQuote(state), [state]);
  const eventTypeLabel = EVENT_TYPES.find(e => e.id === state.eventType)?.label || '';
  const recHours = recommendedHours(state.guests);

  const detailsPayload = (): QuoteDetails => ({
    breakdown,
    eventTypeLabel,
    guests: state.guests,
    hours: state.hours,
    eventDate: state.eventDate,
    serviceAddons: state.serviceAddons,
    customAddons: state.customAddons,
    sizes: state.sizes,
    notes: state.notes,
  });

  const toggle = (key: 'serviceAddons' | 'customAddons' | 'sizes', id: string) =>
    setState(s => ({
      ...s,
      [key]: s[key].includes(id) ? s[key].filter(x => x !== id) : [...s[key], id],
    }));

  const selectHat = (hat: HatBase) => {
    const price = parsePriceFromRange(hat.range);
    setState(s => ({
      ...s,
      selectedHatId: hat.id,
      selectedHatPrice: price,
      selectedHatName: hat.name,
    }));
  };

  return (
    <section id="builder" className="bg-[#fbf7f0] py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-3">Plan your event</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#2a2018]">Build your hat bar event quote</h2>
          <p className="mt-4 text-[#5b5043]">
            Customize every detail and watch your estimate update live. No payment required to see your quote.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* LEFT: builder */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-7">

            {/* Event type */}
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-serif text-lg text-[#c9a36a]">01</span>
                <h3 className="font-semibold text-[#2a2018] text-lg">Event type</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {EVENT_TYPES.map(et => (
                  <button key={et.id} onClick={() => setState(s => ({ ...s, eventType: et.id }))}
                    className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${state.eventType === et.id ? 'border-[#c9a36a] bg-[#faf3e6] text-[#2a2018] font-medium' : 'border-[#e0d4c0] text-[#5b5043] hover:border-[#c9a36a]'}`}>
                    {et.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hat style selector */}
            {breakdown.perPersonCharged && (
              <Section step="02" title="Choose a hat style"
                sub="Select one hat style for your event. We recommend one style to ensure enough inventory for all guests.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allBases.map(hat => {
                    const price = parsePriceFromRange(hat.range);
                    const active = state.selectedHatId === hat.id;
                    return (
                      <button key={hat.id} onClick={() => selectHat(hat)}
                        className={`text-left rounded-xl border overflow-hidden transition-colors ${active ? 'border-[#c9a36a] ring-2 ring-[#c9a36a]/30' : 'border-[#e0d4c0] hover:border-[#c9a36a]'}`}>
                        <div className="aspect-[4/3] overflow-hidden bg-[#f6efe4]">
                          <img src={hat.image} alt={hat.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-[#2a2018] text-sm leading-snug">{hat.name}</p>
                          {price > 0 && (
                            <p className="text-[#c9a36a] font-semibold text-sm mt-0.5">{money(price)} / guest</p>
                          )}
                          {hat.range && price === 0 && (
                            <p className="text-[#7a6e5c] text-xs mt-0.5">{hat.range}</p>
                          )}
                        </div>
                        {active && (
                          <div className="bg-[#c9a36a] text-[#2a2018] text-xs font-semibold text-center py-1">
                            Selected ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!state.selectedHatId && (
                  <p className="text-xs text-[#b8915a] mt-3">
                    Please select a hat style to calculate your per-guest cost.
                  </p>
                )}
              </Section>
            )}

            {!breakdown.perPersonCharged && (
              <div className="border-t border-[#e0d4c0] pt-7">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-serif text-lg text-[#c9a36a]">02</span>
                  <h3 className="font-semibold text-[#2a2018] text-lg">Per-person hat cost</h3>
                </div>
                <p className="text-sm text-[#7a6e5c]">
                  Guests pay for their own hats at this event, so your quote covers only the stylist fee and branding station fee.
                </p>
              </div>
            )}

            {/* Guests */}
            <Section step="03" title="Guest count" sub="Scale up to 1,000 guests.">
              <div className="flex items-center gap-4">
                <input type="range" min={5} max={1000} value={state.guests}
                  onChange={e => setState(s => ({ ...s, guests: Number(e.target.value) }))}
                  className="flex-1 accent-[#c9a36a]" />
                <div className="w-20 shrink-0">
                  <input type="number" min={5} max={1000} value={state.guests}
                    onChange={e => setState(s => ({ ...s, guests: Math.max(5, Math.min(1000, Number(e.target.value) || 5)) }))}
                    className="w-full rounded-lg border border-[#e0d4c0] px-3 py-2 text-center font-semibold text-[#2a2018] outline-none focus:border-[#c9a36a]" />
                </div>
              </div>
              <p className="text-sm text-[#7a6e5c] mt-3">
                Team needed: <span className="font-semibold text-[#2a2018]">{getTeamSize(state.guests)} stylists &amp; assistants</span>
              </p>
            </Section>

            {/* Hours */}
            <Section step="04" title="Hours of service" sub={`Recommended: ${recHours} hour${recHours > 1 ? 's' : ''} for ${state.guests} guests.`}>
              <div className="flex gap-3">
                {HOURS_OPTIONS.map(h => (
                  <button key={h} onClick={() => setState(s => ({ ...s, hours: h }))}
                    className={`flex-1 rounded-lg border py-3 font-medium transition-colors ${state.hours === h ? 'border-[#c9a36a] bg-[#faf3e6] text-[#2a2018]' : 'border-[#e0d4c0] text-[#5b5043] hover:border-[#c9a36a]'}`}>
                    {h} hrs
                  </button>
                ))}
              </div>
              <p className="text-sm text-[#7a6e5c] mt-3">
                {getTeamSize(state.guests)} team × {money(STYLIST_HOURLY_RATE)}/hr × {state.hours} hrs = <span className="font-semibold text-[#2a2018]">{money(breakdown.stylistTotal)}</span>
              </p>
            </Section>

            {/* Event date */}
            <Section step="05" title="Event date" sub="When is your event? Pick a date so we can confirm availability.">
              <input type="date" value={state.eventDate}
                onChange={e => setState(s => ({ ...s, eventDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full sm:w-auto rounded-lg border border-[#e0d4c0] px-4 py-3 text-[#2a2018] outline-none focus:border-[#c9a36a]" />
              {state.eventDate && (
                <p className="text-sm text-[#7a6e5c] mt-3">
                  Selected: <span className="font-semibold text-[#2a2018]">
                    {new Date(state.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </p>
              )}
            </Section>

        {/* Service add-ons */}
<Section step="06" title="Service add-ons">
  <div className="space-y-2">
    {SERVICE_ADDONS.map(a => {
      const active = state.serviceAddons.includes(a.id);
      return (
        <button key={a.id} onClick={() => toggle('serviceAddons', a.id)}
          className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${active ? 'border-[#c9a36a] bg-[#faf3e6]' : 'border-[#e0d4c0] hover:border-[#c9a36a]'}`}>
          <span>
            <span className="font-medium text-[#2a2018]">{a.label}</span>
            {a.note && <span className="block text-xs text-[#7a6e5c]">{a.note}</span>}
          </span>
          <span className="font-semibold text-[#2a2018] ml-3">+{money(a.price)}</span>
        </button>
      );
    })}
  </div>
</Section>

            {/* Custom add-ons */}
            <Section step="07" title="Custom add-ons" sub="Priced per guest and added straight into your estimated total.">
              <div className="space-y-2">
                {CUSTOM_ADDONS.map(a => {
                  const active = state.customAddons.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggle('customAddons', a.id)}
                      className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${active ? 'border-[#c9a36a] bg-[#faf3e6]' : 'border-[#e0d4c0] hover:border-[#c9a36a]'}`}>
                      <span className="font-medium text-[#2a2018]">{a.label}</span>
                      <span className="text-sm text-[#7a6e5c] ml-3">
                        {a.priceLabel}
                        {active && <span className="block text-xs font-semibold text-[#2a2018]">+{money(a.pricePerGuest * state.guests)}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Notes */}
            <Section step="08" title="Notes & personalized requests" sub="Tell us anything that will help us create a personalized experience.">
              <textarea value={state.notes}
                onChange={e => setState(s => ({ ...s, notes: e.target.value }))}
                rows={5}
                placeholder="Guests, men and women? Date, location, type of venue, themes, ideas for the event such as company logo, monogram, initials of the bride and groom..."
                className="w-full rounded-lg border border-[#e0d4c0] px-4 py-3 text-[#2a2018] outline-none focus:border-[#c9a36a] resize-none" />
            </Section>
          </div>

          {/* RIGHT: sticky summary */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-[#2a2018] text-[#f3ead9] rounded-2xl shadow-xl p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-4">Your estimate</p>

              <div className="space-y-3 text-sm">
                {breakdown.perPersonCharged && state.selectedHatId && (
                  <Row
                    label={`${breakdown.selectedHatName} — ${money(breakdown.selectedHatPrice)} × ${state.guests}`}
                    value={money(breakdown.hatTotal)}
                  />
                )}
                {breakdown.perPersonCharged && !state.selectedHatId && (
                  <p className="text-[#9a8d77] text-xs italic">Select a hat style to see hat total</p>
                )}
                <Row label={`Stylist team (${breakdown.teamSize})`} value={money(breakdown.stylistTotal)} />
                {breakdown.addonsTotal > 0 && <Row label="Service add-ons" value={money(breakdown.addonsTotal)} />}
                {breakdown.customAddonsTotal > 0 && <Row label={`Custom add-ons (× ${state.guests})`} value={money(breakdown.customAddonsTotal)} />}
              </div>

              <div className="border-t border-white/15 mt-5 pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[#cbbfa9]">Estimated total</span>
                  <span className="font-serif text-3xl">{money(breakdown.total)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-[#cbbfa9]">
                  Deposit to book event (50% of total)
                  </span>
                  <span className="font-semibold text-[#c9a36a]">{money(breakdown.deposit)}</span>
                </div>
              </div>

              {breakdown.hasCustom && (
                <p className="mt-4 text-xs bg-[#3a2e22] rounded-lg px-3 py-2 text-[#cbbfa9]">
                  Custom add-ons are included in your estimated total above.
                </p>
              )}

          
              <button onClick={() => onRequestQuote(detailsPayload())}
                className="w-full mt-6 rounded-full border border-[#c9a36a]/50 text-[#f3ead9] hover:bg-white/5 font-semibold py-3 transition-colors">
                Get this as a quote
              </button>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
                className="block text-center mt-6 text-sm text-[#cbbfa9] hover:text-[#c9a36a] underline underline-offset-4 transition-colors">
                Or schedule a consultation
              </a>

              <p className="mt-4 text-[11px] text-[#8c8170] leading-relaxed">
                Estimate is a guide. Final pricing confirmed in your custom quote based on venue, travel, and selected add-ons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-[#cbbfa9]">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default QuoteBuilder;
