import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchSavedDesign, SavedDesignRow } from '@/lib/savedDesigns';
import { summarizeDesign } from '@/lib/designSummary';
import { resolveImage, useDesignImages } from '@/lib/designImages';
import { HAT_BASES } from '@/data/hatDesign';

/**
 * Shareable summary of a saved custom hat design (/design/saved/:id).
 * Guests can bookmark or share this and bring it to their event consultation.
 */
const SavedDesignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { images } = useDesignImages();
  const [row, setRow] = useState<SavedDesignRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchSavedDesign(id).then((r) => {
      setRow(r);
      setLoading(false);
    });
  }, [id]);

  const goPlan = () => navigate('/#builder');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Build a summary from the stored fields (fall back to live summarize).
  const summary =
    row?.summary ||
    (row
      ? summarizeDesign({
          baseId: row.base_id,
          bandId: row.band_id,
          accentId: row.accent_id,
          personalization: row.personalization || [],
        })
      : null);

  const base = row ? HAT_BASES.find((b) => b.id === row.base_id) || HAT_BASES[0] : null;

  return (
    <div className="min-h-screen bg-[#2a2018] font-sans">
      <Header onPlan={goPlan} />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-5">
          {loading ? (
            <p className="text-center text-[#cbbfa9]">Loading your design…</p>
          ) : !row || !summary ? (
            <div className="text-center">
              <h1 className="font-serif text-3xl text-[#f3ead9] mb-3">Design not found</h1>
              <p className="text-[#cbbfa9] mb-6">
                This saved design link is invalid or has expired.
              </p>
              <Link
                to="/design"
                className="inline-block rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-6 py-3"
              >
                Design a new hat
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">
                  Saved design
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#f3ead9]">
                  {row.name ? `${row.name}'s custom hat` : 'Your custom hat'}
                </h1>
                <p className="mt-3 text-[#cbbfa9]">
                  Bring this summary to your event consultation — we'll bring it to life at the hat
                  bar.
                </p>
              </div>

              <div className="bg-[#3a2e22] rounded-2xl shadow-2xl overflow-hidden">
                {base && (
                  <div className="bg-[#f3ead9] aspect-[16/9] overflow-hidden">
                    <img
                      src={resolveImage(images, `base-${base.id}`, base.image)}
                      alt={summary.baseName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 sm:p-8">
                  <dl className="divide-y divide-[#4a3c2e] text-sm">
                    {[
                      ['Base hat', `${summary.baseName} · ${summary.baseRange}`],
                      ['Band', summary.bandName],
                      ['Accent', summary.accentName],
                      [
                        'Personalization',
                        summary.personalizationLabels.length
                          ? summary.personalizationLabels.join(', ')
                          : 'None selected',
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 py-3">
                        <dt className="text-[#9a8d77]">{label}</dt>
                        <dd className="text-[#f3ead9] text-right font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-5 text-xs text-[#9a8d77] leading-relaxed">
                    {summary.baseDescription}
                  </p>

                  <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={goPlan}
                      className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3 transition-colors"
                    >
                      Build my event quote
                    </button>
                    <button
                      onClick={copyLink}
                      className="rounded-full border border-[#4a3c2e] text-[#cbbfa9] hover:border-[#c9a36a] hover:text-[#f3ead9] font-medium py-3 transition-colors"
                    >
                      {copied ? 'Link copied!' : 'Copy shareable link'}
                    </button>
                  </div>

                  <Link
                    to="/design"
                    className="block text-center mt-4 text-sm text-[#9a8d77] hover:text-[#c9a36a] underline underline-offset-4"
                  >
                    Design another hat
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SavedDesignPage;
