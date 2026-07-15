import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';
const EDGE_URL = 'https://hystlehjwpagcktoyoia.supabase.co/functions/v1';

const CATEGORIES = [
  { id: 'feathers', label: 'Feathers' },
  { id: 'hat-bands', label: 'Hat Bands' },
  { id: 'beaded-hat-bands', label: 'Beaded Hat Bands' },
  { id: 'layered-band-sets', label: 'Layered Band Sets' },
  { id: 'hat-band-accessories', label: 'Hat Band Accessories' },
  { id: 'hat-pins', label: 'Hat Pins' },
];

const BUCKET = 'hat-bar-images';

interface Application {
  id: string;
  created_at: string;
  business_name: string;
  business_type: string;
  location: string;
  storefront_type: string;
  contact_name: string;
  email: string;
  phone: string;
  tax_id: string;
  resale_license_url: string;
  status: string;
  has_account?: boolean;
}

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
  sort_order: number;
}

interface NewProduct {
  category: string;
  name: string;
  description: string;
  price: string;
  retail_price: string;
  unit: string;
  variations: string;
  image: string;
  in_stock: boolean;
}

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const AdminWholesalePage: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [tab, setTab] = useState<'applications' | 'products'>('applications');

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [newProduct, setNewProduct] = useState<NewProduct>({
    category: 'feathers',
    name: '',
    description: '',
    price: '',
    retail_price: '',
    unit: 'each',
    variations: '',
    image: '',
    in_stock: true,
  });

  const [productImages, setProductImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [accountModal, setAccountModal] = useState<Application | null>(null);
  const [accountPassword, setAccountPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
    } else {
      setPwError('Incorrect password.');
    }
  };

  useEffect(() => {
    if (!authed) return;

    supabase.from('wholesale_applications').select('*').order('created_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setLoadingApps(false); return; }
        const { data: retailers } = await supabase.from('wholesale_retailers').select('email');
        const retailerEmails = new Set((retailers || []).map((r: any) => r.email));
        setApplications(data.map(a => ({ ...a, has_account: retailerEmails.has(a.email) })));
        setLoadingApps(false);
      });

    supabase.from('wholesale_products').select('*').order('category').order('sort_order')
      .then(({ data }) => { setProducts(data || []); setLoadingProducts(false); });
  }, [authed]);

  const updateAppStatus = async (id: string, status: string) => {
    await supabase.from('wholesale_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));

    const app = applications.find(a => a.id === id);
    if (!app) return;

    try {
      if (status === 'denied') {
        await fetch(`${EDGE_URL}/wholesale-deny-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application: app }),
        });
        flash('ok', `Denied ${app.business_name} — denial email sent.`);
      } else if (status === 'approved') {
        flash('ok', `Approved ${app.business_name}! Now create their account to send login details.`);
      }
    } catch {
      flash('err', 'Status updated but email failed to send.');
    }
  };

  const createAccount = async () => {
    if (!accountModal || !accountPassword) return;
    setCreatingAccount(true);

    const { error } = await supabase.from('wholesale_retailers').insert({
      business_name: accountModal.business_name,
      email: accountModal.email.toLowerCase(),
      password_hash: accountPassword,
      active: true,
    });

    if (error) {
      flash('err', error.message.includes('unique') ? 'An account already exists for this email.' : 'Could not create account.');
      setCreatingAccount(false);
      return;
    }

    try {
      await fetch(`${EDGE_URL}/wholesale-approve-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retailer: {
          business_name: accountModal.business_name,
          email: accountModal.email,
          password: accountPassword,
        }}),
      });
    } catch { /* non-blocking */ }

    setApplications(prev => prev.map(a =>
      a.id === accountModal.id ? { ...a, has_account: true } : a
    ));

    flash('ok', `Account created for ${accountModal.business_name} — login details emailed!`);
    setAccountModal(null);
    setAccountPassword('');
    setCreatingAccount(false);
  };

  const uploadProductImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `wholesale/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) return '';
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) { flash('err', 'Name and price are required.'); return; }
    setSaving(true);

    let primaryImage = '';
    const extraImages: string[] = [];

    if (productImages.length > 0) {
      setUploading(true);
      for (let i = 0; i < productImages.length; i++) {
        const url = await uploadProductImage(productImages[i]);
        if (i === 0) primaryImage = url;
        else if (url) extraImages.push(url);
      }
      setUploading(false);
    }

    const { data, error } = await supabase.from('wholesale_products').insert({
      category: newProduct.category,
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      retail_price: parseFloat(newProduct.retail_price || '0'),
      unit: newProduct.unit,
      variations: newProduct.variations,
      image: primaryImage,
      images: extraImages,
      in_stock: newProduct.in_stock,
    }).select().single();

    setSaving(false);
    if (error) { flash('err', 'Could not add product.'); return; }
    setProducts(prev => [...prev, data]);
    setNewProduct({ category: 'feathers', name: '', description: '', price: '', retail_price: '', unit: 'each', variations: '', image: '', in_stock: true });
    setProductImages([]);
    flash('ok', `Added "${data.name}" to the catalog.`);
  };

  const toggleStock = async (id: string, in_stock: boolean) => {
    await supabase.from('wholesale_products').update({ in_stock }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock } : p));
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the catalog?`)) return;
    await supabase.from('wholesale_products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    flash('ok', `Removed "${name}".`);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6efe4] p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e0d4c0] p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b8915a] mb-2">the maddhattery</p>
          <h1 className="font-serif text-2xl text-[#2a2018] mb-6">Admin Login</h1>
          <input type="password" autoFocus value={pwInput} onChange={e => setPwInput(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a] mb-3" />
          {pwError && <p className="text-sm text-red-600 mb-3">{pwError}</p>}
          <button type="submit" className="w-full rounded-full bg-[#2a2018] hover:bg-[#3a2e22] text-[#f3ead9] font-semibold py-3 transition-colors">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe4]">
      {accountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAccountModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#e0d4c0] p-8 w-full max-w-md">
            <h2 className="font-serif text-xl text-[#2a2018] mb-1">Create retailer account</h2>
            <p className="text-sm text-[#5b5043] mb-5">
              For <strong>{accountModal.business_name}</strong> ({accountModal.email})
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#7a6e5c] mb-1">Set a password for this retailer</label>
                <input
                  type="text"
                  value={accountPassword}
                  onChange={e => setAccountPassword(e.target.value)}
                  placeholder="e.g. Maddhattery2025!"
                  className="w-full rounded-lg border border-[#d8cbb4] px-4 py-3 outline-none focus:border-[#c9a36a]"
                />
                <p className="text-xs text-[#9a8d78] mt-1">This will be emailed to them with their login link.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={createAccount} disabled={!accountPassword || creatingAccount}
                  className="flex-1 rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold py-3 transition-colors disabled:opacity-50">
                  {creatingAccount ? 'Creating…' : 'Create account & send email'}
                </button>
                <button onClick={() => { setAccountModal(null); setAccountPassword(''); }}
                  className="rounded-full border border-[#d8cbb4] text-[#5b5043] px-5 py-3 hover:bg-[#f6efe4] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-[#2a2018] text-[#f3ead9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a36a]">the maddhattery</p>
            <h1 className="font-serif text-2xl">Wholesale Admin</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/maddhattery-admin" className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]">Main admin</Link>
            <Link to="/wholesale" className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]">Wholesale page</Link>
            <button onClick={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }}
              className="text-sm border border-[#5b5043] rounded-full px-4 py-2 hover:bg-[#3a2e22]">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-2 mb-8">
          {(['applications', 'products'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'bg-[#2a2018] text-[#f3ead9]' : 'bg-white border border-[#d8cbb4] text-[#5b5043] hover:border-[#2a2018]'}`}>
              {t === 'applications' ? 'Applications' : 'Product catalog'}
            </button>
          ))}
        </div>

        {tab === 'applications' && (
          <div className="bg-white rounded-xl border border-[#e0d4c0] overflow-x-auto">
            {loadingApps ? (
              <div className="p-10 text-center text-[#7a6e5c]">Loading applications…</div>
            ) : applications.length === 0 ? (
              <div className="p-10 text-center text-[#7a6e5c]">No applications yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f3ead9] text-[#5b5043] text-left">
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Tax ID</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} className="border-t border-[#efe6d6] align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#2a2018]">{app.business_name}</div>
                        <div className="text-xs text-[#9a8d78]">{app.business_type}</div>
                      </td>
                      <td className="px-4 py-3 text-[#5b5043]">
                        <div>{app.contact_name}</div>
                        <div className="text-xs">{app.email}</div>
                        {app.phone && <div className="text-xs">{app.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#5b5043]">{app.location}</td>
                      <td className="px-4 py-3 text-[#5b5043] capitalize">{app.storefront_type}</td>
                      <td className="px-4 py-3 text-[#5b5043]">{app.tax_id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'denied' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>{app.status}</span>
                        {app.has_account && (
                          <span className="block mt-1 text-xs text-green-700">✓ Account created</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          {app.status !== 'approved' && (
                            <button onClick={() => updateAppStatus(app.id, 'approved')}
                              className="rounded-md bg-green-600 text-white text-xs px-2.5 py-1 hover:bg-green-700">
                              Approve
                            </button>
                          )}
                          {app.status === 'approved' && !app.has_account && (
                            <button onClick={() => setAccountModal(app)}
                              className="rounded-md bg-[#c9a36a] text-[#2a2018] text-xs px-2.5 py-1 hover:bg-[#b8915a] font-medium">
                              Create account
                            </button>
                          )}
                          {app.status !== 'denied' && (
                            <button onClick={() => updateAppStatus(app.id, 'denied')}
                              className="rounded-md bg-red-500 text-white text-xs px-2.5 py-1 hover:bg-red-600">
                              Deny
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'products' && (
          <div>
            <div className="bg-white rounded-xl border border-[#e0d4c0] p-6 mb-8">
              <h2 className="font-serif text-xl text-[#2a2018] mb-5">Add a product</h2>
              <form onSubmit={addProduct} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Category *</label>
                  <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-2.5 outline-none focus:border-[#c9a36a]">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Product name *</label>
                  <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Natural Ostrich Feather" required
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-2.5 outline-none focus:border-[#c9a36a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#7a6e5c] mb-1">Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="Full product description shown to retailers"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-2.5 outline-none focus:border-[#c9a36a] resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Wholesale price *</label>
                  <input type="number" step="0.01" min="0" value={newProduct.price}
                    onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                    placeholder="0.00" required
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-2.5 outline-none focus:border-[#c9a36a]" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Suggested retail price</label>
                  <input type="number" step="0.01" min="0" value={newProduct.retail_price}
                    onChange={e => setNewProduct(p => ({ ...p, retail_price: e.target.value }))}
                    placeholder="0.00 (optional)"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-2.5 outline-none focus:border-[#c9a36a]" />
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Unit</label>
                  <select value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-2.5 outline-none focus:border-[#c9a36a]">
                    <option value="each">Each</option>
                    <option value="pack">Pack</option>
                    <option value="dozen">Dozen</option>
                    <option value="set">Set</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#7a6e5c] mb-1">Variations / colors / sizes</label>
                  <input value={newProduct.variations} onChange={e => setNewProduct(p => ({ ...p, variations: e.target.value }))}
                    placeholder="e.g. Available in black, brown, tan"
                    className="w-full rounded-lg border border-[#d8cbb4] px-4 py-2.5 outline-none focus:border-[#c9a36a]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#7a6e5c] mb-1">
                    Product photos <span className="text-[#9a8d78]">(select multiple — first photo is the main image)</span>
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" multiple
                    onChange={e => setProductImages(Array.from(e.target.files || []))}
                    className="hidden" />
                  <div onClick={() => fileRef.current?.click()}
                    className="cursor-pointer rounded-lg border-2 border-dashed border-[#d8cbb4] hover:border-[#c9a36a] px-4 py-5 text-center transition-colors">
                    {productImages.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-[#2a2018]">{productImages.length} photo{productImages.length > 1 ? 's' : ''} selected</p>
                        <p className="text-xs text-[#9a8d78] mt-1">{productImages.map(f => f.name).join(', ')}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-[#5b5043]">Click to upload photos</p>
                        <p className="text-xs text-[#9a8d78] mt-1">Select multiple at once — JPG, PNG, WEBP</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="in_stock" checked={newProduct.in_stock}
                    onChange={e => setNewProduct(p => ({ ...p, in_stock: e.target.checked }))} />
                  <label htmlFor="in_stock" className="text-sm text-[#5b5043]">In stock</label>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={saving}
                    className="rounded-full bg-[#c9a36a] hover:bg-[#b8915a] text-[#2a2018] font-semibold px-8 py-3 transition-colors disabled:opacity-50">
                    {saving ? (uploading ? 'Uploading photos…' : 'Adding…') : 'Add product'}
                  </button>
                </div>
              </form>
            </div>

            {loadingProducts ? (
              <p className="text-[#5b5043]">Loading products…</p>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e0d4c0] p-10 text-center text-[#7a6e5c]">
                No products yet. Add your first product above.
              </div>
            ) : (
              CATEGORIES.map(cat => {
                const items = products.filter(p => p.category === cat.id);
                if (!items.length) return null;
                return (
                  <div key={cat.id} className="mb-8">
                    <h3 className="font-serif text-lg text-[#2a2018] mb-3">{cat.label}</h3>
                    <div className="bg-white rounded-xl border border-[#e0d4c0] overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#f3ead9] text-[#5b5043] text-left">
                            <th className="px-4 py-3 font-semibold">Product</th>
                            <th className="px-4 py-3 font-semibold">Wholesale</th>
                            <th className="px-4 py-3 font-semibold">Retail</th>
                            <th className="px-4 py-3 font-semibold">Unit</th>
                            <th className="px-4 py-3 font-semibold">Variations</th>
                            <th className="px-4 py-3 font-semibold">Stock</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(product => {
                            const allImages = [
                              ...(product.image ? [product.image] : []),
                              ...(product.images || []),
                            ];
                            return (
                              <tr key={product.id} className="border-t border-[#efe6d6]">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {allImages.length > 0 && (
                                      <div className="relative flex-shrink-0">
                                        <img src={allImages[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                        {allImages.length > 1 && (
                                          <span className="absolute -bottom-1 -right-1 bg-[#c9a36a] text-[#2a2018] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                            {allImages.length}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-medium text-[#2a2018]">{product.name}</div>
                                      {product.description && <div className="text-xs text-[#9a8d78] max-w-[200px] truncate">{product.description}</div>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[#2a2018] font-medium">{money(product.price)}</td>
                                <td className="px-4 py-3 text-[#5b5043]">{product.retail_price > 0 ? money(product.retail_price) : '—'}</td>
                                <td className="px-4 py-3 text-[#5b5043]">{product.unit}</td>
                                <td className="px-4 py-3 text-[#5b5043] max-w-[150px] truncate">{product.variations || '—'}</td>
                                <td className="px-4 py-3">
                                  <button onClick={() => toggleStock(product.id, !product.in_stock)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {product.in_stock ? 'In stock' : 'Out of stock'}
                                  </button>
                                </td>
                                <td className="px-4 py-3">
                                  <button onClick={() => deleteProduct(product.id, product.name)}
                                    className="text-xs text-red-500 hover:text-red-700 hover:underline">
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminWholesalePage;
