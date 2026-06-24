import React from 'react';
import { BAND_OPTIONS, EDGE_OPTIONS, CHAIN_OPTIONS, FEATURED_LOOKS, HatDesignState } from '@/data/hatDesign';
import { resolveImage, type DesignImageMap } from '@/lib/designImages';
import type { InspirationPick } from '@/components/hat/SaveDesignModal';
interface FeaturedLooksProps {
  /** Loads the look into the configurator. The second arg is the picked look so
   *  the design form can show which style inspired the guest. */
  onApply: (design: HatDesignState, inspiration?: InspirationPick) => void;
  images?: DesignImageMap;
}
const FeaturedLooks: React.FC<FeaturedLooksProps> = ({
  onApply,
  images = {}
}) => {
  return <div className="mt-20 border-t border-[#4a3c2e] pt-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">Need inspiration?</p>
        <h3 className="font-serif text-2xl sm:text-3xl text-[#f3ead9]">Custom Designs</h3>
        <p className="mt-3 text-[#cbbfa9]">Choose one of our current or previous hat designs and will load into the configurator above, then tweak it to make it yours. We have A LOT more in our hat bar to choose from but this will give us an idea of your style. 

Each and every hat is one-of-a-kind and will use these as inspiration to design a personalized hat as unique as the individual who wears it! 

Are you ready? Let's design a hat that is all YOU!</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURED_LOOKS.map(look => {
        const lband = BAND_OPTIONS.find(b => b.id === look.design.bandId);
        const ledge = EDGE_OPTIONS.find(e => e.id === look.design.edgeId);
        const lchain = CHAIN_OPTIONS.find(c => c.id === look.design.chainId);
        const chips = [lband, ledge, lchain].filter((s): s is NonNullable<typeof s> => !!s && s.color !== 'transparent');
        const resolvedImage = resolveImage(images, `look-${look.id}`, look.image);
        return <button key={look.id} type="button" onClick={() => onApply(look.design, {
          name: look.name,
          image: resolvedImage
        })} className="group text-left rounded-2xl overflow-hidden border-2 border-transparent bg-[#3a2e22] hover:border-[#c9a36a] shadow-lg transition-all">
              <div className="aspect-[4/3] overflow-hidden bg-[#2c2118]">
                <img src={resolvedImage} alt={look.name} loading="lazy" onError={e => {
              const img = e.currentTarget;
              if (img.src !== look.image) img.src = look.image;
            }} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2 min-h-[1rem]">
                  {chips.map((s, i) => <span key={i} className="h-4 w-4 rounded-full border border-[#5a4a38]" style={{
                background: s.color
              }} />)}
                </div>
                <p className="font-serif text-lg text-[#f3ead9]">{look.name}</p>
                <p className="text-sm text-[#cbbfa9] mt-1 leading-relaxed">
                  {look.description ?? look.tagline}
                </p>
                {look.material && <p className="text-sm font-medium text-[#e7d3a8] mt-3">{look.material}</p>}
                {look.totalCost && <p className="text-xs text-[#c9a36a] mt-1">{look.totalCost}</p>}

                <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[#c9a36a] group-hover:gap-2 transition-all">
                  Start from this look
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </button>;
      })}
      </div>
    </div>;
};
export default FeaturedLooks;