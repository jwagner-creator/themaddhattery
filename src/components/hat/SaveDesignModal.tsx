import React, { useState } from 'react';
import { HatDesignState, HAT_BASES } from '@/data/hatDesign';
import { summarizeDesign } from '@/lib/designSummary';
import { saveDesign } from '@/lib/savedDesigns';

export interface InspirationPick {
  name: string;
  image: string;
}

interface SaveDesignModalProps {
  open: boolean;
  design: HatDesignState;
  onClose: () => void;
  onSaved: (id: string) => void;
  // Full bases list (built-in + admin-added custom bases).
  bases?: typeof HAT_BASES;
  // Optional inspiration hat the guest selected from the gallery / looks.
  inspiration?: InspirationPick | null;
}

/**
 * Captures a guest's email (+ optional phone / name) and saves their finished
 * custom hat design. On success the parent navigates to the shareable summary.
 */
const SaveDesignModal: React.FC<SaveDesignModalProps> = ({
  open,
  design,
  onClose,
  onSaved,
  bases = HAT_BASES,
  inspiration = null,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const summary = summarizeDesign(design, bases);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email so we can send your design.');
      return;
    }
    setLoading(true);
    setError('');
    const id = await saveDesign({
      email,
      name,
      phone,
      smsOptIn,
      design,
      bases,
      inspiration: inspiration?.name,
    });
    setLoading(false);
    if (!id) {
      setError('Something went wrong saving your design. Please try again.');
      return;
    }
    onSaved(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#3a2e22] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">Save your design</p>
            <button
              type="button"
              onClick={onClose}
              className="text-[#9a8d77] hover:text-[#f3ead9] text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <h2 className="font-serif text-2xl text-[#f3ead9]">Email me my custom hat</h2>
          <p className="mt-2 text-sm text-[#cbbfa9]">
            We'll save your look and send it over so you can bring it to your event consultation.
          </p>

          {/* Inspiration hat the guest chose */}
          {inspiration && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#2a2018] p-3">
              <img
                src={inspiration.image}
                alt={inspiration.name}
                className="h-14 w-14 rounded-lg object-cover border border-[#4a3c2e]"
              />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a36a]">My inspiration</p>
                <p className="text-sm text-[#f3ead9]">{inspiration.name}</p>
              </div>
            </div>
          )}

          {/* Design recap */}
          <div className="mt-4 rounded-xl bg-[#2a2018] p-4 text-sm space-y-1.5">
            <p className="text-[#f3ead9]">
              <span className="text-[#9a8d77]">Base:</span> {summary.baseName} · {summary.baseRange}
            </p>
            <p className="text-[#f3ead9]">
              <span className="text-[#9a8d77]">Band:</span> {summary.bandName}
            </p>
            <p className="text-[#f3ead9]">
              <span className="text-[#9a8d77]">Accent:</span> {summary.accentName}
            </p>
            <p className="text-[#f3ead9]">
              <span className="text-[#9a8d77]">Personalization:</span>{' '}
              {summary.personalizationLabels.length
                ? summary.personalizationLabels.join(', ')
                : 'None'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]"
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]"
            />
            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg bg-[#2a2018] border border-[#4a3c2e] text-[#f3ead9] placeholder-[#9a8d77] px-4 py-2.5 focus:outline-none focus:border-[#c9a36a]"
            />
            <label className="flex items-start gap-2 text-xs text-[#9a8d77]">
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Text me about my design &amp; event planning. Msg &amp; data rates may apply. Reply
                STOP to unsubscribe.
              </span>
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3 transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save & email my design'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SaveDesignModal;
