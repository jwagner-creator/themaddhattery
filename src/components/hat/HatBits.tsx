import React from 'react';

/** Small shared UI pieces for the hat configurator. Kept tiny so the
 *  visual editor can instrument them quickly without choking. */

export const Swatch: React.FC<{
  active: boolean;
  color: string;
  name: string;
  onClick: () => void;
}> = ({
  active,
  color,
  name,
  onClick
}) => {
  const isNone = color === 'transparent';
  return <button type="button" onClick={onClick} title={name} className="group flex flex-col items-center gap-1.5 focus:outline-none">
      <span className={`relative h-10 w-10 rounded-full border-2 transition-all ${active ? 'border-[#c9a36a] scale-110 shadow-md' : 'border-[#4a3c2e] group-hover:border-[#c9a36a]/70'}`} style={{
      background: isNone ? 'repeating-linear-gradient(45deg,#3a2e22,#3a2e22 5px,#2a2018 5px,#2a2018 10px)' : color
    }}>
        {isNone && <span className="absolute inset-0 flex items-center justify-center text-[9px] text-[#cbbfa9]">
            none
          </span>}
      </span>
      <span className={`text-[11px] leading-tight text-center w-14 ${active ? 'text-[#f3ead9]' : 'text-[#9a8d77]'}`}>
        {name}
      </span>
    </button>;
};
export const SummaryRow: React.FC<{
  label: string;
  value: string;
}> = ({
  label,
  value
}) => <div className="flex items-start justify-between gap-4">
    <dt className="text-[#9a8d77] shrink-0">{label}</dt>
    <dd className="text-[#f3ead9] text-right font-medium">{value}</dd>
  </div>;
export const StepHeading: React.FC<{
  step: string;
  title: string;
  subtitle?: string;
}> = ({
  step,
  title,
  subtitle
}) => <div className="flex items-baseline gap-3 mb-4">
    <span className="font-serif text-lg text-[#c9a36a]">{step}</span>
    <div className="text-[#2f1f01]">
      <h3 className="font-semibold text-lg text-[#5f4310]">{title}</h3>
      {subtitle && <p className="text-sm text-[#9a8d77]">{subtitle}</p>}
    </div>
  </div>;