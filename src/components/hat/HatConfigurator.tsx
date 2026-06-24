import React from 'react';
import { HAT_BASES, EDGE_OPTIONS, CHAIN_OPTIONS, PERSONALIZATION_OPTIONS, SIZE_CHART, sizesForBase, HatDesignState, type HatBase } from '@/data/hatDesign';
import { Swatch, StepHeading } from '@/components/hat/HatBits';
import BandLayerBuilder from '@/components/hat/BandLayerBuilder';
import { resolveImage, type DesignImageMap } from '@/lib/designImages';

interface HatConfiguratorProps {
  design: HatDesignState;
  setDesign: React.Dispatch<React.SetStateAction<HatDesignState>>;
  images?: DesignImageMap;
  // Full list of base hats (built-in + admin-added custom bases).
  bases?: HatBase[];
}

/** The left column of the "Design your own" section: steps 01–05. */
const HatConfigurator: React.FC<HatConfiguratorProps> = ({
  design,
  setDesign,
  images = {},
  bases = HAT_BASES
}) => {
  const togglePersonalization = (id: string) => setDesign(d => ({
    ...d,
    personalization: d.personalization.includes(id) ? d.personalization.filter(x => x !== id) : [...d.personalization, id]
  }));

  // When a base hat is picked, also reset color + default size for that base.
  const selectBase = (b: HatBase, colorId?: string) => setDesign(d => ({
    ...d,
    baseId: b.id,
    colorId: colorId ?? b.colors?.[0]?.id,
    sizeId: b.sizes && b.sizes[0] || 'os'
  }));

  // Sizes available for the currently selected base.
  const sizeOptions = sizesForBase(design.baseId, bases);
  const activeSizeId = design.sizeId || sizeOptions[0]?.id;
  return <div className="space-y-9 bg-[url('https://d64gsuwffb70l.cloudfront.net/6834789ecdd892bd5a829aa2_1782011379549_0f843853.JPG')] bg-cover bg-center">
      {/* Base hat */}
      <div>
        <StepHeading step="01" title="Choose your base hat & color" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {bases.map(b => {
          const active = design.baseId === b.id;
          const colors = b.colors || [];
          const selectedColor = active ? colors.find(c => (design.colorId || colors[0]?.id) === c.id) : undefined;
          const cardImage = selectedColor?.image || resolveImage(images, `base-${b.id}`, b.image);
          return <div key={b.id} className={`rounded-2xl overflow-hidden border-2 transition-all bg-[#3a2e22] ${active ? 'border-[#c9a36a] shadow-lg' : 'border-transparent hover:border-[#c9a36a]/50'}`}>
                <button type="button" onClick={() => selectBase(b)} className="block w-full text-left">
                  <div className="aspect-square overflow-hidden">
                    <img src={cardImage} alt={b.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 pt-3">
                    <p className="text-sm font-medium text-[#f3ead9] leading-tight">
                      {b.name}
                    </p>
                    <p className="text-xs text-[#c9a36a] mt-0.5">{b.range}</p>
                  </div>
                </button>

                {/* Per-hat color options */}
                {colors.length > 0 && <div className="flex flex-wrap gap-2 px-3 pb-3 pt-2.5">
                    {colors.map(c => {
                const colorActive = active && (design.colorId || colors[0]?.id) === c.id;
                if (c.image) {
                  return <button key={c.id} type="button" title={c.name} onClick={() => selectBase(b, c.id)} className={`h-9 w-9 rounded-lg overflow-hidden border-2 transition-all ${colorActive ? 'border-[#c9a36a] scale-105 shadow' : 'border-[#5a4a38] hover:border-[#c9a36a]/70'}`}>
                            <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                          </button>;
                }
                return <button key={c.id} type="button" title={c.name} onClick={() => selectBase(b, c.id)} className={`h-6 w-6 rounded-full border-2 transition-all ${colorActive ? 'border-[#c9a36a] scale-110 shadow' : 'border-[#5a4a38] hover:border-[#c9a36a]/70'}`} style={{
                  background: c.color
                }} />;
              })}
                  </div>}
              </div>;
        })}
        </div>
      </div>

      {/* Size */}
      <div className="border-t border-[#4a3c2e] pt-8">
        <StepHeading step="02" title="Choose your size" subtitle="Sizing depends on the base hat you selected above." />
        <div className="flex flex-wrap gap-3">
          {sizeOptions.map(s => {
          const sizeActive = activeSizeId === s.id;
          return <button key={s.id} type="button" onClick={() => setDesign(d => ({
            ...d,
            sizeId: s.id
          }))} className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${sizeActive ? 'border-[#c9a36a] bg-[#c9a36a] text-[#2a2018]' : 'border-[#4a3c2e] text-[#cbbfa9] hover:border-[#c9a36a]'}`}>
                {s.name}
              </button>;
        })}
        </div>

        {/* Measurement chart */}
        <div className="mt-5 rounded-2xl border border-[#4a3c2e] bg-[#2a2018]/70 overflow-hidden">
          <p className="px-4 py-2.5 text-xs uppercase tracking-wider text-[#c9a36a] border-b border-[#4a3c2e]">
            Size chart
          </p>
          <table className="w-full text-sm text-[#e8dcc4]">
            <thead>
              <tr className="text-left text-[#9c8c70]">
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Circumference</th>
                <th className="px-4 py-2 font-medium">Inches</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map(row => <tr key={row.size} className="border-t border-[#4a3c2e]/60">
                  <td className="px-4 py-2 font-semibold text-[#f3ead9]">
                    {row.size}
                  </td>
                  <td className="px-4 py-2">{row.cm}</td>
                  <td className="px-4 py-2">{row.inches}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Band — layered builder */}
      <BandLayerBuilder design={design} setDesign={setDesign} />


      {/* Edge design */}
      <div className="border-t border-[#4a3c2e] pt-8">
        <StepHeading step="04" title="Edge design" subtitle="Grommets or branded edges along the brim." />
        <div className="flex flex-wrap gap-4">
          {EDGE_OPTIONS.map(e => <Swatch key={e.id} active={design.edgeId === e.id} color={e.color} name={e.name} onClick={() => setDesign(d => ({
          ...d,
          edgeId: e.id
        }))} />)}
        </div>
      </div>

      {/* Chain */}
      <div className="border-t border-[#4a3c2e] pt-8">
        <StepHeading step="05" title="Chain" subtitle="Add a silver, gold, or combo chain detail." />
        <div className="flex flex-wrap gap-4">
          {CHAIN_OPTIONS.map(c => <Swatch key={c.id} active={design.chainId === c.id} color={c.color} name={c.name} onClick={() => setDesign(d => ({
          ...d,
          chainId: c.id
        }))} />)}
        </div>
      </div>

      {/* Personalization */}
      <div className="border-t border-[#4a3c2e] pt-8">
        <StepHeading step="06" title="More personalized design options" subtitle="Choose any extras — pricing is confirmed in your quote." />
        <div className="flex flex-wrap gap-2.5">
          {PERSONALIZATION_OPTIONS.map(p => {
          const active = design.personalization.includes(p.id);
          return <button key={p.id} type="button" onClick={() => togglePersonalization(p.id)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${active ? 'border-[#c9a36a] bg-[#c9a36a] text-[#2a2018] font-medium' : 'border-[#4a3c2e] text-[#cbbfa9] hover:border-[#c9a36a]'}`}>
                {p.label}
              </button>;
        })}
        </div>
      </div>

    </div>;
};
export default HatConfigurator;