import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Testimonial {
  id: string;
  image_url: string;
  quote: string | null;
  client_name: string | null;
  event_type: string | null;
  sort_order: number;
}

const TestimonialsCarousel: React.FC = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.from('testimonials').select('*').eq('active', true).order('sort_order').then(({ data }) => {
      if (data && data.length > 0) setItems(data as Testimonial[]);
    });
  }, []);

  const startAuto = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % items.length);
    }, 4000);
  };

  useEffect(() => {
    if (items.length > 1) startAuto();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [items]);

  const go = (dir: number) => {
    setCurrent(c => (c + dir + items.length) % items.length);
    startAuto();
  };

  if (items.length === 0) return null;

  // Show 3 visible cards on desktop, 1 on mobile
  const getVisible = () => {
    const count = Math.min(3, items.length);
    const visible = [];
    for (let i = 0; i < count; i++) {
      visible.push(items[(current + i) % items.length]);
    }
    return visible;
  };

  const visible = getVisible();

  return (
    <section className="bg-[#f6efe4] py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-5">
                <div className="text-center mb-8">
      
          <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">Happy Clients</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2018]">Past Hat Bar Activations</h2>
                   <p className="mt-3 text-[#5b5043] max-w-xl mx-auto">We love giving your guests an unforgettable experience and a gift —<br />Texas style!</p>
        </div>

        <div className="relative">
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {visible.map((item, i) => (
              <div key={item.id + i}
                className={`rounded-2xl overflow-hidden bg-white shadow-md transition-all duration-500 ${i === 0 ? 'opacity-100' : items.length < 2 ? 'hidden' : i === 2 && items.length < 3 ? 'hidden' : 'opacity-90'}`}>
                <div className="aspect-[4/3] overflow-hidden bg-[#f3ead9]">
                  <img src={item.image_url} alt={item.client_name || 'Event photo'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                {(item.quote || item.client_name) && (
                  <div className="p-4">
                    {item.quote && (
                      <p className="text-sm text-[#5b5043] italic leading-relaxed mb-2">"{item.quote}"</p>
                    )}
                    {item.client_name && (
                      <p className="text-xs font-semibold text-[#c9a36a] uppercase tracking-wider">
                        — {item.client_name}
                        {item.event_type && <span className="text-[#9a8d78] font-normal normal-case tracking-normal"> · {item.event_type}</span>}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Arrows */}
          {items.length > 1 && (
            <>
              <button onClick={() => go(-1)}
                className="absolute left-0 top-1/3 -translate-x-4 -translate-y-1/2 w-10 h-10 rounded-full bg-[#2a2018] text-[#f3ead9] flex items-center justify-center shadow-lg hover:bg-[#c9a36a] hover:text-[#2a2018] transition-colors z-10">
                ‹
              </button>
              <button onClick={() => go(1)}
                className="absolute right-0 top-1/3 translate-x-4 -translate-y-1/2 w-10 h-10 rounded-full bg-[#2a2018] text-[#f3ead9] flex items-center justify-center shadow-lg hover:bg-[#c9a36a] hover:text-[#2a2018] transition-colors z-10">
                ›
              </button>
            </>
          )}

          {/* Dots */}
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {items.map((_, i) => (
                <button key={i} onClick={() => { setCurrent(i); startAuto(); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-[#c9a36a] w-6' : 'bg-[#d8cbb4]'}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
