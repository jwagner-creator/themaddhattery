import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { SESSION_KEY } from './WholesaleLoginPage';

const CATEGORIES = [
  { id: 'all', label: 'All products' },
  { id: 'feathers', label: 'Feathers' },
  { id: 'hat-bands', label: 'Hat Bands' },
  { id: 'beaded-hat-bands', label: 'Beaded Hat Bands' },
  { id: 'layered-band-sets', label: 'Layered Band Sets' },
  { id: 'hat-band-accessories', label: 'Hat Band Accessories' },
  { id: 'hat-pins', label: 'Hat Pins' },
];

interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  variations: string;
  image: string;
  in_stock: boolean;
}

interface CartItem {
  product_id: string;
  quantity: number;
  notes: string;
}

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const WholesaleCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [retailer, setRetailer] = useState<{ id: string; business_name: string; email: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) { navigate('/wholesale/login'); return; }
    setRetailer(JSON.parse(session));

    supabase
      .from('wholesale_products')
      .select('*')
      .order('category')
      .order('sort_order')
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [navigate]);

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filtered.filter(p => p.category === cat.id);
    if (items.length) acc[cat.id] = { label: cat.label, items };
    return acc;
  }, {} as Record<string, { label: string; items: Product[] }>);

  const addToCart = (product: Product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        product_id: product.id,
        quantity: (prev[product.id]?.quantity || 0) + 1,
        notes: prev[product.id]?.notes || '',
      }
    }));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => { const next = { ...prev }; delete next[productId]; return next; });
    } else {
      setCart(prev => ({ ...prev, [productId]: { ...prev[productId], quantity: qty } }));
    }
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, item]) => {
    const product = products.find(p => p.id === id);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (!retailer || cartCount === 0) return;
    setSubmitting(true);

    const items = Object.entries(cart).map(([product_id, item]) => ({
      retailer_id: retailer.id,
      product_id,
      quantity: item.quantity,
      notes: item.notes,
    }));

    // Save cart to Supabase
    await supabase.from('wholesale_cart').upsert(items, { onConflict: 'retailer_id,product_id' });

    // Save lead to leads table for notification
    const orderSummary = Object.entries(cart).map(([id, item]) => {
      const p = products.find(x => x.id === id);
      return `${p?.name} x${item.quantity} = ${money((p?.price || 0) * item.quantity)}`;
    }).join('\n');

    await supabase.from('leads').insert({
      name: retailer.business_name,
      email: retailer.email,
      source: 'wholesale-order',
      notes: `Wholesale order request:\n${orderSummary}\n\nTotal: ${money(cartTotal)}`,
    });

    setSubmitting(false);
    setOrderDone(true);
    setCart({});
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/wholesale/login');
  };

  if (!retailer) return null;

  return (
    <div className="min-h-screen bg-[#fbf7f0] font-sans">
      <Header onPlan={() => navigate('/#builder')} />

      <section className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-5">
          {/* Header bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-1">Wholesale Catalog</p>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#2a2018]">
                Welcome, {retailer.business_name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCartOpen(true)}
                className="relative rounded-full bg-[#2a2018] text-[#f3ead9] px-5 py-2.5 text-sm font-medium hover:bg-[#3a2e22] transition-colors"
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#c9a36a] text-[#2a2018] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button onClick={logout} className="text-sm text-[#8c8170] hover:text-[#2a2018]">
                Sign out
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                  activeCategory === cat.id
                    ? 'bg-[#2a2018] border-[#2a2018] text-[#f3ead9]'
                    : 'border-[#d8cbb4] text-[#5b5043] hover:border-[#2a2018] bg-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-[#5b5043]">Loading catalog…</p>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-[#2a2018] mb-3">Catalog coming soon</p>
              <p className="text-[#5b5043]">We're adding products to the catalog. Check back soon!</p>
            </div>
          ) : (
            Object.entries(grouped).map(([catId, { label, items }]) => (
              <div key={catId} className="mb-12">
                <h2 className="font-serif text-2xl text-[#2a2018] mb-5 pb-2 border-b border-[#e0d4c0]">
                  {label}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {items.map(product => {
                    const inCart = cart[product.id];
                    return (
                      <div key={product.id} className="bg-white rounded-2xl border border-[#e0d4c0] overflow-hidden shadow-sm">
                        {/* Image */}
                        <div className="aspect-square bg-[#f6efe4] overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-[#c9b896] text-xs text-center px-4">No photo yet</p>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-serif text-[#2a2018] font-medium leading-snug">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-[#7a6e5c] mt-1 leading-relaxed">{product.description}</p>
                          )}
                          {product.variations && (
                            <p className="text-xs text-[#9a8d78] mt-1">{product.variations}</p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <p className="font-semibold text-[#2a2018]">{money(product.price)}</p>
                              <p className="text-xs text-[#9a8d78]">per {product.unit}</p>
                            </div>
                            {product.in_stock ? (
                              inCart ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateQty(product.id, inCart.quantity - 1)}
                                    className="w-7 h-7 rounded-full border border-[#d8cbb4] text-[#2a2018] hover:bg-[#f6efe4] flex items-center justify-center text-lg leading-none"
                                  >−</button>
                                  <span className="w-6 text-center text-sm font-medium text-[#2a2018]">{inCart.quantity}</span>
                                  <button
                                    onClick={() => updateQty(product.id, inCart.quantity + 1)}
                                    className="w-7 h-7 rounded-full border border-[#d8cbb4] text-[#2a2018] hover:bg-[#f6efe4] flex items-center justify-center text-lg leading-none"
                                  >+</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product)}
                                  className="rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] text-xs font-medium px-3 py-1.5 transition-colors"
                                >
                                  Add
                                </button>
                              )
                            ) : (
                              <span className="text-xs text-[#9a8d78]">Out of stock</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-[#e0d4c0] flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#2a2018]">Your cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-2xl text-[#5b5043] hover:text-[#2a2018]">×</button>
            </div>

            {orderDone ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#c9a36a] flex items-center justify-center mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2018" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl text-[#2a2018] mb-2">Order received!</h3>
                  <p className="text-[#5b5043] text-sm">We'll be in touch to confirm your order and arrange payment.</p>
                  <button onClick={() => { setOrderDone(false); setCartOpen(false); }} className="mt-6 rounded-full border border-[#2a2018] text-[#2a2018] px-6 py-2.5 text-sm hover:bg-[#2a2018] hover:text-[#f3ead9] transition-colors">
                    Continue shopping
                  </button>
                </div>
              </div>
            ) : cartCount === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-[#5b5043]">Your cart is empty. Add some products to get started!</p>
              </div>
            ) : (
              <>
                <div className="flex-1 p-6 space-y-4">
                  {Object.entries(cart).map(([productId, item]) => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    return (
                      <div key={productId} className="flex gap-3 items-start border-b border-[#f0e8db] pb-4">
                        <div className="w-14 h-14 rounded-lg bg-[#f6efe4] overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#e0d4c0]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#2a2018]">{product.name}</p>
                          <p className="text-xs text-[#9a8d78]">{money(product.price)} / {product.unit}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <button onClick={() => updateQty(productId, item.quantity - 1)} className="w-6 h-6 rounded-full border border-[#d8cbb4] text-[#2a2018] flex items-center justify-center text-base leading-none hover:bg-[#f6efe4]">−</button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateQty(productId, item.quantity + 1)} className="w-6 h-6 rounded-full border border-[#d8cbb4] text-[#2a2018] flex items-center justify-center text-base leading-none hover:bg-[#f6efe4]">+</button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-[#2a2018]">{money(product.price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 border-t border-[#e0d4c0]">
                  <div className="flex justify-between mb-4">
                    <span className="font-medium text-[#2a2018]">Order total</span>
                    <span className="font-bold text-[#2a2018] text-lg">{money(cartTotal)}</span>
                  </div>
                  <p className="text-xs text-[#8c8170] mb-4">We'll contact you to confirm your order and arrange payment.</p>
                  <button
                    onClick={submitOrder}
                    disabled={submitting}
                    className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3.5 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit order request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default WholesaleCatalogPage;
