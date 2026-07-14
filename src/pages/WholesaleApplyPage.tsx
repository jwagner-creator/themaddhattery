import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const WholesaleApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    location: '',
    storefront_type: '',
    contact_name: '',
    email: '',
    phone: '',
    tax_id: '',
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setLicenseFile(e.target.files[0]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.email || !form.tax_id || !form.storefront_type) {
      setError('Please fill in all required fields.');
      return;
    }
    setStatus('loading');
    setError('');

    let resale_license_url = '';

    // Upload resale license if provided
    if (licenseFile) {
      setUploading(true);
      const ext = licenseFile.name.split('.').pop() || 'pdf';
      const path = `licenses/${Date.now()}-${form.business_name.replace(/[^a-z0-9]/gi, '-')}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('wholesale-docs')
        .upload(path, licenseFile, { cacheControl: '3600', upsert: false });
      setUploading(false);
      if (uploadError) {
        setError('Could not upload your resale license. Please try again.');
        setStatus('error');
        return;
      }
      resale_license_url = path;
    }

    const { error: insertError } = await supabase.from('wholesale_applications').insert({
      ...form,
      resale_license_url,
      status: 'pending',
    });

    if (insertError) {
  setError('Could not submit your application. Please try again.');
  setStatus('error');
  return;
}

// Trigger confirmation emails
try {
  await fetch('https://hystlehjwpagcktoyoia.supabase.co/functions/v1/wholesale-application-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application: { ...form, contact_name: form.contact_name } }),
  });
} catch {
  // Non-blocking — don't fail the submission if email fails
}

setStatus('done');

  return (
    <div className="min-h-screen bg-[#fbf7f0] font-sans">
      <Header onPlan={() => navigate('/#builder')} />

      <section className="pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-5">
          {status === 'done' ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#c9a36a] flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2a2018" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="font-serif text-3xl text-[#2a2018] mb-3">Application received!</h2>
              <p className="text-[#5b5043] mb-8">
                Thank you for applying to the maddhattery wholesale program. We'll review your
                application and be in touch within 1-2 business days.
              </p>
              <button
                onClick={() => navigate('/wholesale')}
                className="rounded-full border border-[#2a2018] text-[#2a2018] px-8 py-3 hover:bg-[#2a2018] hover:text-[#f3ead9] transition-colors"
              >
                Back to wholesale
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-3">Wholesale Program</p>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#2a2018]">Apply for wholesale access</h1>
                <p className="mt-4 text-[#5b5043]">
                  Fill out the form below and we'll review your application within 1-2 business days.
                </p>
              </div>

              <form onSubmit={submit} className="bg-white rounded-2xl border border-[#e0d4c0] p-8 shadow-sm space-y-5">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">Business name *</label>
                  <input
                    required
                    value={form.business_name}
                    onChange={e => set('business_name', e.target.value)}
                    placeholder="Your business name"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">Type of business *</label>
                  <input
                    required
                    value={form.business_type}
                    onChange={e => set('business_type', e.target.value)}
                    placeholder="e.g. Boutique, Gift shop, Hat shop"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">Business location *</label>
                  <input
                    required
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="City, State"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-2">Business type *</label>
                  <div className="flex gap-3 flex-wrap">
                    {['Storefront', 'Online', 'Both'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => set('storefront_type', opt.toLowerCase())}
                        className={`rounded-full px-5 py-2 text-sm font-medium border transition-colors ${
                          form.storefront_type === opt.toLowerCase()
                            ? 'bg-[#c9a36a] border-[#c9a36a] text-[#2a2018]'
                            : 'border-[#d8cbb4] text-[#5b5043] hover:border-[#c9a36a]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">Contact name *</label>
                  <input
                    required
                    value={form.contact_name}
                    onChange={e => set('contact_name', e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">Email address *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">Phone number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="(optional)"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">Tax ID / EIN *</label>
                  <input
                    required
                    value={form.tax_id}
                    onChange={e => set('tax_id', e.target.value)}
                    placeholder="XX-XXXXXXX"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2018] mb-1">
                    Resale license <span className="text-[#8c8170] font-normal">(PDF, JPG, or PNG)</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={onFilePick}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="cursor-pointer rounded-lg border-2 border-dashed border-[#d8cbb4] hover:border-[#c9a36a] px-4 py-6 text-center transition-colors"
                  >
                    {licenseFile ? (
                      <p className="text-sm text-[#2a2018] font-medium">{licenseFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-[#5b5043]">Click to upload your resale license</p>
                        <p className="text-xs text-[#8c8170] mt-1">PDF, JPG, or PNG</p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-4 transition-colors disabled:opacity-60"
                >
                  {status === 'loading' ? (uploading ? 'Uploading license…' : 'Submitting…') : 'Submit application'}
                </button>

                <p className="text-xs text-center text-[#8c8170]">
                  Already approved?{' '}
                  <a href="/wholesale/login" className="text-[#c9a36a] hover:underline">
                    Log in here
                  </a>
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WholesaleApplyPage;
