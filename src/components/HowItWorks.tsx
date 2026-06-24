import React from 'react';
const STATION_IMG = 'https://d64gsuwffb70l.cloudfront.net/6a3626102bd450af612d0a20_1781936654776_89540522.png';
const supplies = ['Fabric & suede bands', 'Pins', 'Matches', 'Playing cards', 'Feathers'];
const steps = [{
  n: '01',
  title: 'We bring the bar',
  text: 'Our team arrives and sets up a full hat bar at any venue you choose across Texas.'
}, {
  n: '02',
  title: 'Guests get styled',
  text: 'Each guest picks a hat and works with our stylists to design a one-of-a-kind piece.'
}, {
  n: '03',
  title: 'They take it home',
  text: 'Everyone leaves with a personalized hat — a keepsake far better than any party favor.'
}];
const HowItWorks: React.FC = () => {
  return <section id="how" className="bg-[#f6efe4] py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <img src="https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1781995277250_abb8660d.JPG" alt="Hat bar crafting station" className="rounded-2xl shadow-2xl w-full object-cover" />
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-[#2a2018] text-[#f3ead9] rounded-xl px-6 py-4 shadow-xl">
              <p className="text-xs uppercase tracking-widest text-[#c9a36a]">The Hat Bar</p>
              <p className="font-serif text-lg">Everything included</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-3">How it works</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2a2018] mb-6">
              A custom hat experience for every guest
            </h2>

            <div className="space-y-6">
              {steps.map(s => <div key={s.n} className="flex gap-4">
                  <span className="font-serif text-2xl text-[#c9a36a] w-10 shrink-0">{s.n}</span>
                  <div>
                    <h3 className="font-semibold text-[#2a2018] text-lg">{s.title}</h3>
                    <p className="text-[#5b5043]">{s.text}</p>
                  </div>
                </div>)}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {supplies.map(item => <span key={item} className="rounded-full bg-white border border-[#e0d4c0] text-[#5b5043] text-sm px-4 py-1.5">
                  {item}
                </span>)}
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HowItWorks;