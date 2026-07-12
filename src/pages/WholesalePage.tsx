import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'feathers', label: 'Feathers', icon: '🪶' },
  { id: 'hat-bands', label: 'Hat Bands', icon: '🎀' },
  { id: 'beaded-hat-bands', label: 'Beaded Hat Bands', icon: '✨' },
  { id: 'layered-band-sets', label: 'Layered Band Sets', icon: '🎨' },
  { id: 'hat-band-accessories', label: 'Hat Band Accessories', icon: '💎' },
  { id: 'hat-pins', label: 'Hat Pins', icon: '📌' },
];

const WholesalePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fbf7f0] font-sans">
      <Header onPlan={() => navigate('/#builder')} />

      {/* Hero */}
      <section className="relative pt-28 pb-20 bg-[#2a2018]">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a] mb-3">Wholesale Program</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#f3ead9] mb-6">
            Partner with the maddhattery
          </h1>
          <p className="text-[#cbbfa9] text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Bring our premium hat bar supplies to your store. We offer a curated selection of
            feathers, hat bands, beaded bands, layered sets, accessories and pins — everything
            your customers need to personalize their perfect hat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/wholesale/apply"
              className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-4 transition-colors"
            >
              Apply for wholesale access
            </Link>
            <Link
              to="/wholesale/login"
              className="rounded-full border border-[#c9a36a]/50 text-[#f3ead9] hover:bg-[#c9a36a] hover:text-[#2a2018] font-semibold px-8 py-4 transition-colors"
            >
              Retailer login
            </Link>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="py-20 bg-[#f6efe4]">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-3">Our catalog</p>
            <h2 className="font-serif text-3xl text-[#2a2018]">What we offer</h2>
            <p className="mt-4 text-[#5b5043] max-w-xl mx-auto">
              Approved retailers get access to our full wholesale catalog across six categories.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl border border-[#e0d4c0] p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">{cat.icon}</div>
                <p className="font-serif text-lg text-[#2a2018]">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-3">Getting started</p>
            <h2 className="font-serif text-3xl text-[#2a2018]">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Apply', text: 'Submit your wholesale application with your business info and resale license.' },
              { n: '02', title: 'Get approved', text: 'We review your application and set up your account within 1-2 business days.' },
              { n: '03', title: 'Shop & order', text: 'Log in to browse our full catalog, add items to your cart, and place orders.' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <span className="font-serif text-3xl text-[#c9a36a]">{step.n}</span>
                <h3 className="font-serif text-xl text-[#2a2018] mt-2 mb-2">{step.title}</h3>
                <p className="text-[#5b5043] text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/wholesale/apply"
              className="inline-block rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold px-10 py-4 transition-colors"
            >
              Apply now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WholesalePage;
