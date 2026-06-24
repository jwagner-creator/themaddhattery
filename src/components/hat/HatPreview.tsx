import React from 'react';
import { HAT_BASES, BAND_LAYERS, EDGE_OPTIONS, CHAIN_OPTIONS, PERSONALIZATION_OPTIONS, summarizeBandLayers, HatDesignState, type HatBase } from '@/data/hatDesign';
import { SummaryRow } from '@/components/hat/HatBits';
import { resolveImage, type DesignImageMap } from '@/lib/designImages';
import { computeHatPricing } from '@/lib/hatPricing';
import { money } from '@/data/quoteData';

import type { InspirationPick } from '@/components/hat/SaveDesignModal';
interface HatPreviewProps {
  design: HatDesignState;
  /** When provided, shows the "Build my event quote" button. */
  onPlan?: () => void;
  onReset: () => void;
  onSave?: () => void;
  /** When provided, shows the "Reserve & pay deposit" button. */
  onCheckout?: () => void;
  images?: DesignImageMap;
  // Full list of base hats (built-in + admin-added custom bases).
  bases?: HatBase[];
  // Optional inspiration hat the guest started this design from.
  inspiration?: InspirationPick | null;
}



/** The right-hand sticky live preview + summary panel. */
const HatPreview: React.FC<HatPreviewProps> = ({
  design,
  onPlan,
  onReset,
  onSave,
  onCheckout,
  images = {},
  bases = HAT_BASES,
  inspiration = null
}) => {

  const base = bases.find(b => b.id === design.baseId) || bases[0] || HAT_BASES[0];
  const color = base.colors.find(c => c.id === design.colorId) || base.colors[0];
  const edge = EDGE_OPTIONS.find(e => e.id === design.edgeId) || EDGE_OPTIONS[0];
  const chain = CHAIN_OPTIONS.find(c => c.id === design.chainId) || CHAIN_OPTIONS[0];
  const bandLines = summarizeBandLayers(design.bandLayers);
  // Swatch dots for each selected band-layer color (for the preview overlay).
  const bandSwatches = BAND_LAYERS.flatMap(layer => {
    const picked = design.bandLayers?.[layer.id] || [];
    const allColors = layer.groups.flatMap(g => g.colors);
    return picked
      .map(id => allColors.find(c => c.id === id))
      .filter(Boolean)
      .map(c => ({ key: `${layer.id}-${c!.id}`, color: c!.color, title: `${layer.name}: ${c!.name}` }));
  });
  const selectedPersonalization = PERSONALIZATION_OPTIONS.filter(p => design.personalization.includes(p.id));
  const pricing = computeHatPricing(design, bases);



  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-[#3a2e22] rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative bg-[#f3ead9] aspect-[4/3] flex items-center justify-center">
          <img
            src={resolveImage(images, `base-${base.id}`, base.image || 'https://d64gsuwffb70l.cloudfront.net/6a3626102bd450af612d0a20_1782012728731_ee399ef4.jpg')}
            alt={base.name}
            className="h-full w-full object-cover"
          />

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-[80%]">
            {bandSwatches.map(s => (
              <span key={s.key} className="h-6 w-6 rounded-full border-2 border-white shadow" style={{ background: s.color }} title={s.title} />
            ))}
            {edge.color !== 'transparent' && (
              <span className="h-6 w-6 rounded-full border-2 border-white shadow" style={{ background: edge.color }} title={`Edge: ${edge.name}`} />
            )}
            {chain.color !== 'transparent' && (
              <span className="h-6 w-6 rounded-full border-2 border-white shadow" style={{ background: chain.color }} title={`Chain: ${chain.name}`} />
            )}
          </div>

        </div>

        <div className="p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">Your design</p>
          <dl className="space-y-2.5 text-sm">
            {inspiration && <SummaryRow label="Inspiration" value={inspiration.name} />}
            <SummaryRow label="Base hat" value={`${base.name} · ${base.range}`} />
            {color && <SummaryRow label="Color" value={color.name} />}
            <SummaryRow
              label="Band layers"
              value={bandLines.length ? bandLines.join(' · ') : 'None selected'}
            />
            <SummaryRow label="Edge design" value={edge.name} />
            <SummaryRow label="Chain" value={chain.name} />

            <SummaryRow
              label="Personalization"
              value={selectedPersonalization.length ? selectedPersonalization.map(p => p.label).join(', ') : 'None selected'}
            />
          </dl>

          <p className="mt-4 text-xs text-[#9a8d77] leading-relaxed">{base.description}</p>

          {/* Live price + deposit */}
          <div className="mt-5 rounded-xl bg-[#2a2018]/70 border border-[#4a3c2e] p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-[#cbbfa9]">
              <span>Base hat</span>
              <span className="text-[#f3ead9]">{money(pricing.basePrice)}</span>
            </div>
            {pricing.extras.length > 0 && (
              <div className="flex justify-between text-[#cbbfa9]">
                <span>Personalization</span>
                <span className="text-[#f3ead9]">+{money(pricing.extrasTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#4a3c2e] pt-1.5 text-[#cbbfa9]">
              <span>Estimated total</span>
              <span className="font-semibold text-[#f3ead9]">{money(pricing.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c9a36a]">Deposit to reserve</span>
              <span className="font-bold text-[#c9a36a]">{money(pricing.deposit)}</span>
            </div>
          </div>

          {onCheckout && (
            <button
              type="button"
              onClick={onCheckout}
              className="w-full mt-5 rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3.5 transition-colors"
            >
              Reserve &amp; pay deposit — {money(pricing.deposit)}
            </button>
          )}

          {onSave && (
            <button type="button" onClick={onSave} className={`w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3.5 transition-colors ${onCheckout ? 'mt-3' : 'mt-6'}`}>
              Save &amp; email my design
            </button>
          )}
          {onPlan && (
            <button onClick={onPlan} className={`w-full rounded-full border border-[#c9a36a] text-[#c9a36a] hover:bg-[#c9a36a] hover:text-[#2a2018] font-semibold py-3.5 transition-colors ${onSave || onCheckout ? 'mt-3' : 'mt-6'}`}>
              Build my event quote
            </button>
          )}

          <button type="button" onClick={onReset} className="block w-full text-center mt-3 text-sm text-[#9a8d77] hover:text-[#c9a36a] underline underline-offset-4 transition-colors">
            Reset design
          </button>
        </div>
      </div>
    </div>
  );
};
export default HatPreview;
