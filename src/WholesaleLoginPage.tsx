import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'maddhattery_wholesale_retailer';

const WholesaleLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Look up retailer by email
    const { data, error: dbError } = await supabase
      .from('wholesale_retailers')
      .select('id, business_name, email, password_hash, active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (dbError || !data) {
      setError('No account found with that email address.');
      setLoading(false);
      return;
    }

    if (!data.active) {
      setError('Your account has been deactivated. Please contact us.');
      setLoading(false);
      return;
    }

    // Simple password check (password stored as plain text for now)
    if (data.password_hash !== password) {
      setError('Incorrect password. Please try again.');
      setLoading(false);
      return;
    }

    // Save session
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      id: data.id,
      business_name: data.business_name,
      email: data.email,
    }));

    navigate('/wholesale/catalog');
  };

  return (
    <div className="min-h-screen bg-[#fbf7f0] font-sans">
      <Header onPlan={() => navigate('/#builder')} />

      <section className="pt-28 pb-20">
        <div className="max-w-md mx-auto px-5">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-3">Wholesale Portal</p>
            <h1 className="font-serif text-3xl text-[#2a2018]">Retailer login</h1>
            <p className="mt-3 text-[#5b5043] text-sm">
              Log in to access the wholesale catalog and place orders.
            </p>
          </div>

          <form onSubmit={submit} className="bg-white rounded-2xl border border-[#e0d4c0] p-8 shadow-sm space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#2a2018] mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2a2018] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-4 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-xs text-center text-[#8c8170]">
              Not yet a retailer?{' '}
              <a href="/wholesale/apply" className="text-[#c9a36a] hover:underline">
                Apply for access
              </a>
            </p>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export { SESSION_KEY };
export default WholesaleLoginPage;
