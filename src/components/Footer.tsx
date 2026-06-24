import React, { useState } from 'react';
import { BOOKING_URL } from '@/data/quoteData';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch('https://famous.ai/api/crm/6a3626102bd450af612d0a20/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: phone || undefined,
          sms_opt_in: smsOptIn === true,
          source: 'footer-signup',
          tags: ['newsletter'],
        }),
      });
    } catch {
      /* ignore */
    }
    setDone(true);
    setEmail('');
    setPhone('');
  };

  return (
    <footer className="bg-[#1f1812] text-[#cbbfa9]">
      <div className="max-w-7xl mx-auto px-5 py-16 grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-serif text-2xl text-[#f3ead9]">the maddhattery</p>
          <p className="text-sm text-[#8c8170] mt-1">by VinHaus Boutique &amp; Hat Bar</p>
          <p className="text-sm mt-4 leading-relaxed">
            A mobile hat bar bringing custom hat experiences to events across Texas. Plano &amp;
            Austin based.
          </p>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-5 rounded-full border border-[#c9a36a]/50 text-[#f3ead9] px-5 py-2.5 text-sm hover:bg-[#c9a36a] hover:text-[#2a2018] transition-colors"
          >
            Schedule a consultation
          </a>
        </div>

        <div>
          <p className="text-[#f3ead9] font-semibold mb-4">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><a href="#gallery" className="hover:text-[#c9a36a] transition-colors">Custom hat designs</a></li>
            <li><a href="#consultation" className="hover:text-[#c9a36a] transition-colors">Schedule a consultation</a></li>
          </ul>

          <p className="text-[#f3ead9] font-semibold mt-6 mb-2">Serving</p>
          <p className="text-sm">Plano · Austin · all of Texas</p>
        </div>

        <div>
          <p className="text-[#f3ead9] font-semibold mb-4">Stay in the loop</p>
          {done ? (
            <p className="text-sm text-[#c9a36a]">Thanks — we'll be in touch soon!</p>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-lg bg-[#2a2018] border border-[#3a2e22] px-4 py-2.5 text-[#f3ead9] outline-none focus:border-[#c9a36a]"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="w-full rounded-lg bg-[#2a2018] border border-[#3a2e22] px-4 py-2.5 text-[#f3ead9] outline-none focus:border-[#c9a36a]"
              />
              <label className="flex items-start gap-2 text-xs text-[#8c8170]">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
              </label>
              <button
                type="submit"
                className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-2.5 transition-colors"
              >
                Sign up
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-[#2a2018] py-6 text-center text-xs text-[#8c8170]">
        © {new Date().getFullYear()} the maddhattery · VinHaus Boutique &amp; Hat Bar. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
