import React, { useState } from 'react';
import { HatDesignState } from '@/data/hatDesign';
import { DEFAULT_DESIGN } from '@/data/hatDefaults';
import HatConfigurator from '@/components/hat/HatConfigurator';
import HatPreview from '@/components/hat/HatPreview';
import HatDepositCheckout from '@/components/HatDepositCheckout';
import FeaturedLooks from '@/components/FeaturedLooks';
import { useDesignImages } from '@/lib/designImages';
import { useHatBases } from '@/lib/customBases';

interface CustomHatsProps {
  onPlan: () => void;
}

/** "Design your own custom hat" section. This file is intentionally a thin
 *  composition shell — the heavy UI lives in small sub-components so the
 *  visual editor can instrument each piece quickly. Pictures are loaded from
 *  the design_images overrides so they stay in sync with the /design page. */
const CustomHats: React.FC<CustomHatsProps> = ({ onPlan }) => {
  const [design, setDesign] = useState<HatDesignState>(DEFAULT_DESIGN);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { images } = useDesignImages();
  const { bases } = useHatBases();


  const applyLook = (lookDesign: HatDesignState) => {
    setDesign({ ...lookDesign, personalization: [...lookDesign.personalization] });
    document.getElementById('design')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="design" className="bg-[#2a2018] py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">Design your own</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#f3ead9]">
            Build your perfect custom hat
          </h2>
          <p className="mt-4 text-[#cbbfa9]">
            Start with a base hat, then add a band, accents, and personalization. Mix and match to
            preview your look — then reserve it with a deposit or bring it to life at your event hat bar.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          <HatConfigurator design={design} setDesign={setDesign} images={images} bases={bases} />
          <HatPreview
            design={design}
            onPlan={onPlan}
            onCheckout={() => setCheckoutOpen(true)}
            onReset={() => setDesign(DEFAULT_DESIGN)}
            images={images}
            bases={bases}
          />
        </div>


        <FeaturedLooks onApply={applyLook} images={images} />
      </div>

      <HatDepositCheckout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        design={design}
        bases={bases}
      />
    </section>
  );
};

export default CustomHats;
