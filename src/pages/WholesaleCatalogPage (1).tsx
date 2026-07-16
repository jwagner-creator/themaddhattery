import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'maddhattery_wholesale_retailer';

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
  retail_price: number;
  unit: string;
  variations: string;
  image: string;
  images: string[];
  in_stock: boolean;
}

interface CartItem {
  product_id: string;
  quantity: number;
  notes: string;
}

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// Product detail modal
const ProductModal: React.FC<{
  product: Product;
  inCart: CartItem | undefined;
  onClose: () => void;
  onAdd: () => void;
  onUpdateQty: (qty: number) => void;
}> = ({ product, inCart, onClose, onAdd, onUpdateQty }) => {
  const allImages = [
    ...(product.image ? [product.image] : []),
    ...(product.images || []),
  ];
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-[#5b5043] hover:text-[#2a2018] z-10">×</button>
        <div className="grid md:grid-cols-2 gap-0">
          {/* Images */}
          <div className="p-5">
            <div className="aspect-square rounded-xl overflow-hidden bg-[#f6efe4]">
              {allImages.length > 0 ? (
                <img src={allImages[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c9b896] text-sm">No photo</div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-[#c9a36a]' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#b8915a] mb-1">
              {CATEGORIES.find(c => c.id === product.category)?.label}
            </p>
            <h2 className="font-serif text-2xl text-[#2a2018] mb-3">{product.name}</h2>

            {product.description && (
              <p className="text-[#5b5043] text-sm leading-relaxed mb-4">{product.description}</p>
            )}

            {product.variations && (
              <p className="text-xs text-[#9a8d78] mb-4">{product.variations}</p>
            )}

            <div className="rounded-xl bg-[#f6efe4] border border-[#e0d4c0] p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#5b5043]">Wholesale price</span>
                <span className="font-bold text-[#2a2018] text-lg">{money(product.price)} / {product.unit}</span>
              </div>
              {product.retail_price > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#5b5043]">Suggested retail</span>
                  <span className="font-medium text-[#7a6e5c]">{money(product.retail_price)} / {product.unit}</span>
                </div>
              )}
              {product.retail_price > 0 && product.price > 0 && (
                <div className="flex justify-between text-sm border-t border-[#e0d4c0] pt-2">
                  <span className="text-[#5b5043]">Your margin</span>
                  <span className="font-medium text-green-700">
                    {Math.round(((product.retail_price - product.price) / product.retail_price) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {product.in_stock ? (
              inCart ? (
                <div>
                  <p className="text-sm text-[#5b5043] mb-2">In cart</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => onUpdateQty(inCart.quantity - 1)}
                      className="w-9 h-9 rounded-full border border-[#d8cbb4] text-[#2a2018] hover:bg-[#f6efe4] flex items-center justify-center text-xl">−</button>
                    <span className="w-8 text-center font-medium text-[#2a2018]">{inCart.quantity}</span>
                    <button onClick={() => onUpdateQty(inCart.quantity + 1)}
                      className="w-9 h-9 rounded-full border border-[#d8cbb4] text-[#2a2018] hover:bg-[#f6efe4] flex items-center justify-center text-xl">+</button>
                  </div>
                </div>
              ) : (
                <button onClick={onAdd}
                  className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3.5 transition-colors">
                  Add to cart
                </button>
              )
            ) : (
              <p className="text-center text-[#9a8d78] py-3">Out of stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const WholesaleCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [retailer, setRetailer] = useState<{ id: string; business_name: string; email: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

    // Check $50 minimum
    if (cartTotal < 50) {
      alert(`A $50 minimum is required on first orders. Your cart total is ${money(cartTotal)}. Please add more items!`);
      return;
    }

    setSubmitting(true);

    const items = Object.entries(cart).map(([product_id, item]) => ({
      retailer_id: retailer.id,
      product_id,
      quantity: item.quantity,
      notes: item.notes,
    }));

    await supabase.from('wholesale_cart').upsert(items, { onConflict: 'retailer_id,product_id' });

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

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          inCart={cart[selectedProduct.id]}
          onClose={() => setSelectedProduct(null)}
          onAdd={() => { addToCart(selectedProduct); }}
          onUpdateQty={(qty) => updateQty(selectedProduct.id, qty)}
        />
      )}

      <section className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-1">Wholesale Catalog</p>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#2a2018]">
                Welcome, {retailer.business_name}
              </h1>
              <p className="text-xs text-[#9a8d78] mt-1">$50 minimum on first orders · No minimum on reorders · Returns accepted on first order</p>
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
              <button onClick={logout} className="text-sm text-[#8c8170] hover:text-[#2a2018]">Sign out</button>
            </div>
          </div>

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
                <h2 className="font-serif text-2xl text-[#2a2018] mb-5 pb-2 border-b border-[#e0d4c0]">{label}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {items.map(product => {
                    const inCart = cart[product.id];
                    const allImages = [
                      ...(product.image ? [product.image] : []),
                      ...(product.images || []),
                    ];
                    return (
                      <div key={product.id}
                        className="bg-white rounded-2xl border border-[#e0d4c0] overflow-hidden shadow-sm cursor-pointer hover:border-[#c9a36a] transition-colors"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="aspect-square bg-[#f6efe4] overflow-hidden relative">
                          {allImages.length > 0 ? (
                            <img src={allImages[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-[#c9b896] text-xs text-center px-4">No photo yet</p>
                            </div>
                          )}
                          {allImages.length > 1 && (
                            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs rounded-full px-2 py-0.5">
                              +{allImages.length - 1}
                            </span>
                          )}
                          {inCart && (
                            <span className="absolute top-2 right-2 bg-[#c9a36a] text-[#2a2018] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-serif text-[#2a2018] font-medium leading-snug">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-[#7a6e5c] mt-1 leading-relaxed line-clamp-2">{product.description}</p>
                          )}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-[#9a8d78]">Wholesale</span>
                              <span className="font-bold text-[#2a2018]">{money(product.price)}</span>
                            </div>
                            {product.retail_price > 0 && (
                              <div className="flex items-baseline justify-between">
                                <span className="text-xs text-[#9a8d78]">Retail</span>
                                <span className="text-xs text-[#7a6e5c]">{money(product.retail_price)}</span>
                              </div>
                            )}
                          </div>
                          {!product.in_stock && (
                            <p className="text-xs text-[#9a8d78] mt-2">Out of stock</p>
                          )}
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
                  <button onClick={() => { setOrderDone(false); setCartOpen(false); }}
                    className="mt-6 rounded-full border border-[#2a2018] text-[#2a2018] px-6 py-2.5 text-sm hover:bg-[#2a2018] hover:text-[#f3ead9] transition-colors">
                    Continue shopping
                  </button>
                </div>
              </div>
            ) : cartCount === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-[#5b5043]">Your cart is empty. Click any product to add it!</p>
              </div>
            ) : (
              <>
                <div className="flex-1 p-6 space-y-4">
                  {Object.entries(cart).map(([productId, item]) => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    const allImages = [
                      ...(product.image ? [product.image] : []),
                      ...(product.images || []),
                    ];
                    return (
                      <div key={productId} className="flex gap-3 items-start border-b border-[#f0e8db] pb-4">
                        <div className="w-14 h-14 rounded-lg bg-[#f6efe4] overflow-hidden flex-shrink-0">
                          {allImages.length > 0 ? (
                            <img src={allImages[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#e0d4c0]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#2a2018]">{product.name}</p>
                          <p className="text-xs text-[#9a8d78]">{money(product.price)} / {product.unit}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <button onClick={() => updateQty(productId, item.quantity - 1)}
                              className="w-6 h-6 rounded-full border border-[#d8cbb4] text-[#2a2018] flex items-center justify-center text-base leading-none hover:bg-[#f6efe4]">−</button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateQty(productId, item.quantity + 1)}
                              className="w-6 h-6 rounded-full border border-[#d8cbb4] text-[#2a2018] flex items-center justify-center text-base leading-none hover:bg-[#f6efe4]">+</button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-[#2a2018]">{money(product.price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 border-t border-[#e0d4c0]">
                  {cartTotal < 50 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-4">
                      Add {money(50 - cartTotal)} more to meet the $50 first order minimum.
                    </div>
                  )}
                  <div className="flex justify-between mb-4">
                    <span className="font-medium text-[#2a2018]">Order total</span>
                    <span className="font-bold text-[#2a2018] text-lg">{money(cartTotal)}</span>
                  </div>
                  <p className="text-xs text-[#8c8170] mb-4">We'll contact you to confirm your order and arrange payment.</p>
                  <button
                    onClick={submitOrder}
                    disabled={submitting || cartTotal < 50}
                    className="w-full rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3.5 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : `Submit order request — ${money(cartTotal)}`}
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
