// Save / load finished custom hat designs.
import { supabase } from '@/lib/supabase';
import { HatDesignState, HAT_BASES } from '@/data/hatDesign';
import { summarizeDesign } from '@/lib/designSummary';

export interface SavedDesignInput {
  email: string;
  name?: string;
  phone?: string;
  smsOptIn?: boolean;
  design: HatDesignState;
  bases?: typeof HAT_BASES;
  inspiration?: string;
}

export interface SavedDesignRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  base_id: string;
  band_id: string;
  accent_id: string;
  personalization: string[];
  summary: ReturnType<typeof summarizeDesign> | null;
  created_at: string;
}

/**
 * Persist a finished design to the `designs` table and save the guest's
 * contact info to the leads table for follow-up.
 * Returns the new design id on success.
 */
export async function saveDesign(input: SavedDesignInput): Promise<string | null> {
  const { email, name, phone, smsOptIn, design, bases, inspiration } = input;
  const summary = summarizeDesign(design, bases);

  const { data, error } = await supabase
    .from('designs')
    .insert({
      email,
      name: name || null,
      phone: phone || null,
      base_id: design.baseId,
      band_id: design.bandId,
      accent_id: design.edgeId,
      personalization: [
        ...design.personalization,
        `__edge:${design.edgeId}`,
        `__chain:${design.chainId}`,
      ],
      summary,
    })
    .select('id')
    .single();

  if (error || !data) return null;

  // Build a readable note of the design for the leads table.
  const noteParts = [
    `Base: ${summary.baseName} (${summary.baseRange})`,
    `Band: ${summary.bandName}`,
    `Accent: ${summary.accentName}`,
    `Personalization: ${
      summary.personalizationLabels.length ? summary.personalizationLabels.join(', ') : 'None'
    }`,
  ];
  if (inspiration) noteParts.unshift(`Inspiration: ${inspiration}`);

  // Save lead to your own Supabase leads table (non-blocking).
  supabase.from('leads').insert({
    email,
    name: name || null,
    phone: phone || null,
    sms_opt_in: smsOptIn ?? false,
    source: 'design-save',
    notes: noteParts.join('\n'),
  }).then(() => {}).catch(() => {});

  return data.id;
}

/** Load a single saved design by id for the shareable summary page. */
export async function fetchSavedDesign(id: string): Promise<SavedDesignRow | null> {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as SavedDesignRow;
}
