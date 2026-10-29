import React from 'react';

const CALENDAR_URL =
  'https://calendar.google.com/appointments/schedules/AcZssZ3o57jSOcoanMiW3JEbOEyVSH49Vt9ackAM6N88iOTFg4OoBEWBOdeBudXC2OPOxEhvf_K5fRYk';

const HoldMyDate: React.FC = () => {
  return (
    <div className="mt-6 rounded-2xl border border-[#ddd0b8] bg-[#fdf8f1] p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[#b8915a] font-semibold mb-1">
        Not sure what you want or not ready for a quote?
      </p>
      <p className="text-sm text-[#5b5043] mb-4">
        Schedule a consultation to discuss your event and we'll curate a package just for you.
        Once we've confirmed your date is open, you can secure your spot with a{' '}
        <strong className="text-[#2a2018]">$250 fully refundable hold</strong>.
      </p>

      <ol className="text-sm text-[#5b5043] space-y-2 mb-5">
        <li className="flex items-start gap-3">
          <span className="shrink-0 w-5 h-5 rounded-full bg-[#f6efe4] border border-[#c9a36a] text-[#c9a36a] text-xs font-bold flex items-center justify-center mt-0.5">
            1
          </span>
          <span>Schedule a free consultation — we'll discuss your event and check availability</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="shrink-0 w-5 h-5 rounded-full bg-[#f6efe4] border border-[#c9a36a] text-[#c9a36a] text-xs font-bold flex items-center justify-center mt-0.5">
            2
          </span>
          <span>Once availability is confirmed, secure your date with a $250 refundable hold</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="shrink-0 w-5 h-5 rounded-full bg-[#f6efe4] border border-[#c9a36a] text-[#c9a36a] text-xs font-bold flex items-center justify-center mt-0.5">
            3
          </span>
          <span>Sign your contract and pay 50% deposit — balance due day of event</span>
        </li>
      </ol>

      <a
        href={CALENDAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full border-2 border-[#2a2018] text-[#2a2018] hover:bg-[#2a2018] hover:text-[#f3ead9] font-semibold text-sm px-6 py-2.5 transition-colors"
      >
        Schedule a consultation →
      </a>
      <p className="text-xs text-[#9a8d78] mt-3">
        Hold is fully refundable up to 45 days before your event.
      </p>
    </div>
  );
};

export default HoldMyDate;
