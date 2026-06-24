import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BOOKING_URL } from '@/data/quoteData';
interface HeaderProps {
  onPlan: () => void;
}
const Header: React.FC<HeaderProps> = ({
  onPlan
}) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#2a2018]/95 backdrop-blur shadow-lg py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">
        <Link to="/" className="text-left">
          <span className="block font-serif text-xl sm:text-2xl tracking-wide leading-none text-center text-white">
            the maddhattery
          </span>
          <span className="block text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white">
            by VinHaus Hat Bar
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#e7dcc9]">
          <Link to="/#builder" className="hover:text-[#c9a36a] transition-colors">Event quote</Link>
          <Link to="/design" className="hover:text-[#c9a36a] transition-colors">Custom hats &amp; builder</Link>
          <Link to="/#consultation" className="hover:text-[#c9a36a] transition-colors">Consultation</Link>
        </nav>


        <div className="flex items-center gap-3">
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-block text-sm text-[#e7dcc9] hover:text-[#c9a36a] transition-colors">
            Book now
          </a>
          <button onClick={onPlan} className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold text-sm px-5 py-2.5 transition-colors">
            Schedule a consultation
          </button>
        </div>

      </div>
    </header>;
};
export default Header;