import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HatDesignState } from '@/data/hatDesign';
import { DEFAULT_DESIGN } from '@/data/hatDefaults';
import HatConfigurator from '@/components/hat/HatConfigurator';
import HatPreview from '@/components/hat/HatPreview';
import FeaturedLooks from '@/components/FeaturedLooks';
import DesignGallery from '@/components/DesignGallery';
import SaveDesignModal, { InspirationPick } from '@/components/hat/SaveDesignModal';
import HatDepositCheckout from '@/components/HatDepositCheckout';
import { useDesignImages } from '@/lib/designImages';
import { useHatBases } from '@/lib/customBases';


/**
 * Standalone "Design your hat" page on its own route (/design).
 * The event-quote button is intentionally NOT shown here — the hat designer and
 * the event hat-bar quote are two separate services.
 */
const DesignPage: React.FC = () => {
  const navigate = useNavigate();
  const [design, setDesign] = useState<HatDesignState>(DEFAULT_DESIGN);
  const [saveOpen, setSaveOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [inspiration, setInspiration] = useState<InspirationPick | null>(null);
  const { images } = useDesignImages();
  const { bases } = useHatBases();


  const applyLook = (lookDesign: HatDesignState, pick?: InspirationPick) => {
    setDesign({ ...lookDesign, personalization: [...lookDesign.personalization] });
    if (pick) setInspiration(pick);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#2a2018] font-sans">
      <Header onPlan={() => navigate('/#builder')} />

      <section className="pt-28 pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">Design your own</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#f3ead9]">
              Build your perfect custom hat
            </h1>
            <p className="mt-4 text-[#cbbfa9]">
              Start with a base hat, then add a band, accents, and personalization. Mix and match to
              preview your look — then save it and bring it to your consultation.
            </p>
            <Link
              to="/admin/design"
              className="inline-block mt-5 text-xs text-[#9a8d77] hover:text-[#c9a36a] underline underline-offset-4"
            >
              Manage these photos
            </Link>
          </div>

          {inspiration && (
            <div className="max-w-md mx-auto mb-8 flex items-center gap-3 rounded-2xl bg-[#3a2e22] border border-[#4a3c2e] p-3">
              <img
                src={inspiration.image}
                alt={inspiration.name}
                className="h-14 w-14 rounded-lg object-cover border border-[#4a3c2e]"
              />
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a36a]">Your inspiration</p>
                <p className="text-sm text-[#f3ead9]">{inspiration.name}</p>
              </div>
              <button
                onClick={() => setInspiration(null)}
                className="text-[#9a8d77] hover:text-[#f3ead9] text-xl leading-none px-2"
                aria-label="Clear inspiration"
              >
                ×
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
            <HatConfigurator design={design} setDesign={setDesign} images={images} bases={bases} />
            <HatPreview
              design={design}
              inspiration={inspiration}
              onReset={() => {
                setDesign(DEFAULT_DESIGN);
                setInspiration(null);
              }}
              onSave={() => setSaveOpen(true)}
              onCheckout={() => setCheckoutOpen(true)}
              images={images}
              bases={bases}
            />
          </div>

          <FeaturedLooks onApply={applyLook} images={images} />
        </div>
      </section>

      {/* Custom hat designs gallery lives on this page alongside the builder */}
      <DesignGallery onConsult={() => navigate('/#consultation')} />

      <SaveDesignModal
        open={saveOpen}
        design={design}
        bases={bases}
        inspiration={inspiration}
        onClose={() => setSaveOpen(false)}
        onSaved={(id) => {
          setSaveOpen(false);
          navigate(`/design/saved/${id}`);
        }}
      />

      <HatDepositCheckout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        design={design}
        bases={bases}
      />


      <Footer />
    </div>
  );
};

export default DesignPage;
