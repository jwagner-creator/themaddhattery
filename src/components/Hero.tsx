import React from 'react';
import { BOOKING_URL } from '@/data/quoteData';
import { useBucketImages } from '@/lib/bucketImages';
const FALLBACK_HERO = 'https://d64gsuwffb70l.cloudfront.net/6a3626102bd450af612d0a20_1781936601900_7cc125f0.jpg';
interface HeroProps {
  onPlan: () => void;
}
const Hero: React.FC<HeroProps> = ({
  onPlan
}) => {
  // Use the first bucket photo as the hero if any are uploaded
  const {
    images
  } = useBucketImages([FALLBACK_HERO]);
  const heroImg = images[0] || FALLBACK_HERO;
  return <section className="relative min-h-screen flex items-center">
      <div className="absolute inset-0">
        <img src="https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1781995236953_0f5c7d2a.jpg" alt="Mobile hat bar setup" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a2018]/90 via-[#2a2018]/70 to-[#2a2018]/30" />
      </div>


      <div className="relative max-w-7xl mx-auto px-5 w-full pt-28 pb-16">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] mb-5 text-white">
            <span className="h-px w-8 bg-[#c9a36a]" />
            Plano &amp; Austin · Serving all of Texas
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-[#f3ead9] leading-[1.05]">
            the maddhattery
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[#e7dcc9] leading-relaxed max-w-xl">A full mobile hat bar brought to your venue — where every guest designs their very own personalized hat with our stylists. Bands, pins, feathers & more.

Girls night, Bachelorette party, Wedding gift, client or employee appreciation, or pop up at an event you are hosting!</p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4">
            <button onClick={onPlan} className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-4 transition-colors shadow-xl">
              Build your event quote
            </button>
            <a href="/design" className="rounded-full border border-[#e7dcc9]/40 hover:border-[#c9a36a] text-[#f3ead9] font-semibold px-8 py-4 text-center transition-colors">
              View custom hats &amp; builder
            </a>
          </div>


          <div className="mt-10">
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-[#e7dcc9] underline underline-offset-4 hover:text-[#c9a36a] transition-colors">
              Book a free consultation now →
            </a>
          </div>

        </div>
      </div>
    </section>;
};
export default Hero;