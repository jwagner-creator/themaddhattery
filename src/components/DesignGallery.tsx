import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomDesigns } from '@/lib/customGallery';
interface Props {
  onConsult: () => void;
}
const DesignGallery: React.FC<Props> = ({
  onConsult
}) => {
  const [active, setActive] = useState<string | null>(null);
  const {
    designs
  } = useCustomDesigns();
  return <section id="gallery" className="bg-[#2a2018] py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">What we offer</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#f3ead9]">The Custom Personalized Hat Bar and Branding Experience</h2>
          <p className="mt-4 text-[#cbbfa9]">the maddhattery and The VinHaus hat bar will provide a unique and personalized experience by customizing quality hats as a personal gift for your customers and clients. Our fully stocked mobile hat bar will be set up at the event, offering guests the opportunity to design their own hats with a staff of experts to assist each and every client bring their hat design to life. Our branding station is a fun way to personalize hats and leather hat bands with your guests initials. Your guests will have a forever gift and  an experience they will always remember.</p>
          <Link to="/maddhattery-admin" className="inline-block mt-5 text-xs text-[#9a8d77] hover:text-[#c9a36a] underline underline-offset-4">
            Edit each photo's title &amp; caption
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">{designs.map(d => <button key={d.id} onClick={() => setActive(d.src)} className="group text-left rounded-2xl overflow-hidden bg-[#1f1812] border border-[#3a2e22] hover:border-[#c9a36a] transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#c9a36a]">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={d.src} alt={d.title} loading="lazy" onError={e => {
              const img = e.currentTarget;
              if (!img.dataset.retried) {
                img.dataset.retried = '1';
                img.src = d.src + (d.src.includes('?') ? '&' : '?') + 'r=' + Date.now();
              }
            }} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <p className="font-serif text-[#f3ead9] text-sm sm:text-base leading-snug sr-only">{d.title}</p>
              </div>
            </button>)}{/* CTA tile */}<div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#c9a36a] to-[#a8814d] flex flex-col items-center justify-center text-center p-6">
            <p className="font-serif text-2xl text-[#2a2018] leading-tight">Interested in learning more?</p>
            <p className="mt-2 text-sm text-[#2a2018]/80">Tell us your vision and we'll personalize it for you.</p>
            <button onClick={onConsult} className="mt-5 rounded-full bg-[#2a2018] text-[#f3ead9] font-semibold text-sm px-6 py-3 hover:bg-[#1f1812] transition-colors">
              Book a consultation
            </button>
          </div>Personalized branding</div>
      </div>
      {/* Lightbox */}
      {active && <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <button onClick={() => setActive(null)} className="absolute top-5 right-5 text-white/80 hover:text-white text-3xl leading-none" aria-label="Close">
            ×
          </button>
          <img src={active} alt="Custom hat design" className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>}
    </section>;
};
export default DesignGallery;
