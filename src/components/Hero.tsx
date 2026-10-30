import React from 'react';
import { BOOKING_URL } from '@/data/quoteData';

interface HeroProps {
  onPlan: () => void;
}

const Hero: React.FC<HeroProps> = ({ onPlan }) => {
  return (
    <section className="bg-[#2a2018] pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left: text */}
          <div className="flex-1 max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] mb-5 text-white">
              <span className="h-px w-8 bg-[#c9a36a]" />
              Texas Based · Serving Texas and Beyond
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-[#f3ead9] leading-[1.05]">
              the maddhattery
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#e7dcc9] leading-relaxed max-w-xl">
              A full mobile hat bar brought to your venue — where every guest designs their very own
              personalized hat with our stylists. Bands, pins, feathers &amp; more.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onPlan}
                className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-4 transition-colors shadow-xl"
              >
                Build your event quote
              </button>
              <a
                href="/design"
                className="rounded-full border border-[#e7dcc9]/40 hover:border-[#c9a36a] text-[#f3ead9] font-semibold px-8 py-4 text-center transition-colors"
              >
                View custom hats &amp; builder
              </a>
            </div>

            <div className="mt-10">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#e7dcc9] underline underline-offset-4 hover:text-[#c9a36a] transition-colors"
              >
                Book a free consultation now →
              </a>
            </div>
          </div>

          {/* Right: contained video */}
          <div className="w-full lg:w-auto lg:shrink-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: '480px', margin: '0 auto' }}>
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto block"
              >
                <source src="/hero-video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
