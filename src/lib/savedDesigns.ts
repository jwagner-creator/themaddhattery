// Save / load finished custom hat designs, plus CRM email capture.
import { supabase } from '@/lib/supabase';
import { HatDesignState, HAT_BASES } from '@/data/hatDesign';
import { summarizeDesign } from '@/lib/designSummary';

const CRM_PROJECT_ID = '6a3626102bd450af612d0a20';

export interface SavedDesignInput {
  email: string;
  name?: string;
  phone?: string;
  smsOptIn?: boolean;
  design: HatDesignState;
  // The full bases list (built-in + admin-added) so the stored summary uses
  // the correct name/range for custom base hats. Defaults to built-ins.
  bases?: typeof HAT_BASES;
  // Optional inspiration hat name the guest chose from the gallery / looks.
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
 * Persist a finished design to the `designs` table AND add the guest's email
 * to the project CRM so the team can follow up before their consultation.
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

  // Build a readable note of what the guest designed for the CRM contact.
  const noteParts = [
    `Base: ${summary.baseName} (${summary.baseRange})`,
    `Band: ${summary.bandName}`,
    `Accent: ${summary.accentName}`,
    `Personalization: ${
      summary.personalizationLabels.length ? summary.personalizationLabels.join(', ') : 'None'
    }`,
  ];
  if (inspiration) noteParts.unshift(`Inspiration: ${inspiration}`);
  const designNote = noteParts.join('\n');

  const tags = ['custom-design', 'design-saved'];
  if (inspiration) tags.push(`inspiration:${inspiration}`);

  // Add the guest to the CRM contact list (non-blocking — never fail the save).
  fetch(`https://famous.ai/api/crm/${CRM_PROJECT_ID}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: name || undefined,
      phone: phone || undefined,
      sms_opt_in: smsOptIn === true,
      source: 'design-save',
      tags,
      notes: designNote,
      message: designNote,
      fields: {
        base: summary.baseName,
        band: summary.bandName,
        accent: summary.accentName,
        inspiration: inspiration || undefined,
        design_id: data.id,
      },
    }),
  }).catch(() => {});

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
