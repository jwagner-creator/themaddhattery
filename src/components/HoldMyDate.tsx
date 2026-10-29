import React from 'react';

const CALENDAR_URL =
  'https://calendar.google.com/appointments/schedules/AcZssZ3o57jSOcoanMiW3JEbOEyVSH49Vt9ackAM6N88iOTFg4OoBEWBOdeBudXC2OPOxEhvf_K5fRYk';

interface HoldMyDateProps {
  onBuildQuote?: () => void;
}

const HoldMyDate: React.FC<HoldMyDateProps> = ({ onBuildQuote }) => {
  return (
    <section className="bg-[#f0e8d8] border-y border-[#ddd0b8] py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-5">
        <div className="grid sm:grid-cols-2 gap-8 items-center">

          {/* Left: Build a quote */}
          <div className="bg-[#2a2018] text-[#f3ead9] rounded-2xl p-7 sm:p-8 flex flex-col">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-2">Know what you want?</p>
            <h3 className="font-serif text-2xl mb-3">Build your quote</h3>
            <p className="text-[#cbbfa9] text-sm mb-6 flex-1">
              Customize every detail — event type, guests, hat style, add-ons — and watch your
              estimate update live. We'll follow up to confirm stylist and staff availability
              for your date.
            </p>
            <button
              onClick={onBuildQuote}
              className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3.5 transition-colors"
            >
              Build my quote →
            </button>
          </div>

          {/* Right: Schedule first, then hold */}
          <div className="bg-white border border-[#e0d4c0] rounded-2xl p-7 sm:p-8 flex flex-col">
            <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">Not ready to quote?</p>
            <h3 className="font-serif text-2xl text-[#2a2018] mb-3">Secure your date</h3>
            <p className="text-[#5b5043] text-sm mb-5 flex-1">
              Schedule a consultation to discuss your event and confirm stylist and staff
              availability. Once we've confirmed your date is open,
              you can secure your spot with a <strong>$250 fully refundable hold</strong>.
            </p>

            {/* How it works — 3 steps */}
            <ol className="text-sm text-[#5b5043] space-y-2.5 mb-6">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#f6efe4] border border-[#c9a36a] text-[#c9a36a] text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <span>Schedule a free consultation — we'll discuss your event and check availability</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#f6efe4] border border-[#c9a36a] text-[#c9a36a] text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <span>Once availability is confirmed, secure your date with a $250 refundable hold</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#f6efe4] border border-[#c9a36a] text-[#c9a36a] text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <span>Sign your contract and pay 50% deposit — balance due day of event</span>
              </li>
            </ol>

            <a
              href={CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block text-center rounded-full border-2 border-[#2a2018] text-[#2a2018] hover:bg-[#2a2018] hover:text-[#f3ead9] font-semibold py-3.5 transition-colors"
            >
              Schedule a consultation →
            </a>
            <p className="text-center text-xs text-[#9a8d78] mt-3">
              Hold is fully refundable up to 30 days before your event.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HoldMyDate;
