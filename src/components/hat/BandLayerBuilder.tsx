import React from 'react';
import { BAND_LAYERS, type HatDesignState } from '@/data/hatDesign';
import { StepHeading } from '@/components/hat/HatBits';

interface BandLayerBuilderProps {
  design: HatDesignState;
  setDesign: React.Dispatch<React.SetStateAction<HatDesignState>>;
}

/** Step 03 — layered band builder. Guests can stack fabric, leather, suede,
 *  and (multi-select) beaded layers, each with their own color/print choices. */
const BandLayerBuilder: React.FC<BandLayerBuilderProps> = ({ design, setDesign }) => {
  const selected = design.bandLayers || {};

  const toggleLayer = (layerId: string, colorId: string, multi: boolean) => {
    setDesign((d) => {
      const current = { ...(d.bandLayers || {}) };
      const picked = current[layerId] || [];
      if (multi) {
        current[layerId] = picked.includes(colorId)
          ? picked.filter((id) => id !== colorId)
          : [...picked, colorId];
      } else {
        // single-select: tapping the active one clears the layer
        current[layerId] = picked[0] === colorId ? [] : [colorId];
      }
      // drop empty layers to keep state tidy
      if (current[layerId].length === 0) delete current[layerId];
      return { ...d, bandLayers: current };
    });
  };

  const activeCount = Object.keys(selected).filter((k) => (selected[k] || []).length).length;

  return (
    <div className="border-t border-[#4a3c2e] pt-8">
      <div className="flex justify-center mb-6">
        <div className="rounded-2xl border-2 border-[#c9a36a] bg-[#2a2018]/80 px-8 py-3">
          <h3 className="text-center text-xl font-bold uppercase tracking-[0.25em] text-[#c9a36a]">
            Hat Bar Menu
          </h3>
        </div>
      </div>

      <StepHeading
        step="03"
        title="Build your band — layer it up"
        subtitle="Stack as many band layers as you like. Pick a color or print for each."
      />

      <div className="space-y-6">
        {BAND_LAYERS.map((layer) => {
          const picked = selected[layer.id] || [];
          return (
            <div
              key={layer.id}
              className={`rounded-2xl border p-5 transition-colors ${
                picked.length ? 'border-[#c9a36a] bg-[#2a2018]/70' : 'border-[#4a3c2e] bg-[#2a2018]/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <h4 className="text-base font-semibold text-[#f3ead9]">
                  {layer.name} band
                  {layer.multi && (
                    <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-[#c9a36a] border border-[#c9a36a]/50 rounded-full px-2 py-0.5">
                      pick multiple
                    </span>
                  )}
                </h4>
                {picked.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDesign((d) => {
                      const next = { ...(d.bandLayers || {}) };
                      delete next[layer.id];
                      return { ...d, bandLayers: next };
                    })}
                    className="text-xs text-[#9a8d77] hover:text-[#c9a36a] underline underline-offset-2"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-[#9a8d77] mb-4">{layer.blurb}</p>

              <div className="space-y-4">
                {layer.groups.map((group, gi) => (
                  <div key={gi}>
                    {group.label && (
                      <p className="text-[11px] uppercase tracking-wider text-[#c9a36a] mb-2">
                        {group.label}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {group.colors.map((c) => {
                        const isActive = picked.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            title={c.name}
                            onClick={() => toggleLayer(layer.id, c.id, !!layer.multi)}
                            className="group flex flex-col items-center gap-1.5 focus:outline-none"
                          >
                            <span
                              className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                                isActive
                                  ? 'border-[#c9a36a] scale-110 shadow-md'
                                  : 'border-[#4a3c2e] group-hover:border-[#c9a36a]/70'
                              }`}
                              style={{ background: c.color }}
                            >
                              {isActive && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#c9a36a] text-[#2a2018] text-[10px] font-bold flex items-center justify-center shadow">
                                  ✓
                                </span>
                              )}
                            </span>
                            <span
                              className={`text-[11px] leading-tight text-center w-14 ${
                                isActive ? 'text-[#f3ead9]' : 'text-[#9a8d77]'
                              }`}
                            >
                              {c.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeCount === 0 && (
        <p className="mt-4 text-xs text-[#9a8d77] italic">
          No band layers selected yet — your hat will be left bare unless you add one.
        </p>
      )}
    </div>
  );
};

export default BandLayerBuilder;
