import React from 'react';
import { BOOKING_URL } from '@/data/quoteData';

const OFFERINGS: { title: string; desc: string }[] = [
  {
    title: 'Custom designed hats',
    desc: 'One-of-a-kind, hand-painted & embellished hats made just for you or your event.',
  },
  {
    title: 'Mobile hat bar',
    desc: 'We bring the experience to your venue so guests design their own hat with our stylists.',
  },
  {
    title: 'Private events & parties',
    desc: 'Bachelorette, girls night, weddings, client & employee appreciation pop-ups.',
  },
];

const ConsultationCTA: React.FC = () => {
  return (
    <section id="consultation" className="bg-[#fbf7f0] py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-5">
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {OFFERINGS.map((o) => (
            <div key={o.title} className="rounded-2xl bg-white border border-[#e7ddc9] p-6 shadow-sm">
              <h3 className="font-serif text-xl text-[#2a2018]">{o.title}</h3>
              <p className="mt-2 text-sm text-[#6b5e4d] leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-[#2a2018] text-center px-6 py-14 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">Let's create together</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#f3ead9]">
            Schedule a consultation
          </h2>
          <p className="mt-4 text-[#cbbfa9] max-w-xl mx-auto">
            Book a free consultation to talk through your custom hat, an event hat bar, or a group
            order. We'll bring inspiration and answer all your questions.
          </p>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-10 py-4 transition-colors shadow-lg"
          >
            Book your consultation
          </a>
        </div>
      </div>
    </section>
  );
};

export default ConsultationCTA;
