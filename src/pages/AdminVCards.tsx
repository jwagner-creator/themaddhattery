import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const ADMIN_PASSWORD = 'hatbar26';
const AUTH_KEY = 'maddhattery_admin_auth';
const SITE_URL = 'https://themaddhattery.netlify.app';
const DEFAULT_ORG = 'the maddhattery by The VinHaus';
const GH_OWNER = 'jwagner-creator';
const GH_REPO = 'themaddhattery';

const NAV_LINKS = [
  { to: '/', label: 'View site' },
  { to: '/maddhattery-admin', label: 'Gallery' },
  { to: '/maddhattery-admin/quotes', label: 'Quote requests' },
  { to: '/maddhattery-admin/bookings', label: 'Proposals' },
  { to: '/maddhattery-admin/events', label: 'Event manager' },
  { to: '/maddhattery-admin/staff', label: 'Staff roster' },
  { to: '/maddhattery-admin/addons', label: 'Add-ons' },
  { to: '/maddhattery-admin/testimonials', label: 'Testimonials' },
  { to: '/maddhattery-admin/vcards', label: 'Staff QR cards' },
];

interface Person {
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  email: string;
  instagram: string;
  booking: string;
  photo: string; // base64 data URI
}

const blank = (): Person => ({
  firstName: '', lastName: '', title: '', phone: '',
  email: '', instagram: '@themaddhattery', booking: '', photo: '',
});

function slugify(p: Person) {
  return `${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function landingUrl(p: Person) {
  return `${SITE_URL}/team/${slugify(p)}/`;
}

function trackingUrl(p: Person) {
  return `${SITE_URL}/?ref=${slugify(p)}`;
}

function buildVcard(p: Person): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${p.firstName} ${p.lastName}`,
    `N:${p.lastName};${p.firstName};;;`,
    `ORG:${DEFAULT_ORG}`,
  ];
  if (p.title) lines.push(`TITLE:${p.title}`);
  if (p.phone) lines.push(`TEL:${p.phone}`);
  if (p.email) lines.push(`EMAIL:${p.email}`);
  lines.push(`URL:${trackingUrl(p)}`);
  if (p.instagram) lines.push(`X-SOCIALPROFILE;type=instagram:${p.instagram}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function buildLandingPage(p: Person, logoB64: string): string {
  const vcardEncoded = encodeURIComponent(buildVcard(p));
  const slug = slugify(p);
  const avatarHtml = p.photo
    ? `<img class="avatar" src="${p.photo}" alt="${p.firstName} ${p.lastName}">`
    : `<div class="avatar-initials">${p.firstName[0] || ''}${p.lastName[0] || ''}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.firstName} ${p.lastName} · the maddhattery</title>
<meta name="description" content="${p.title ? p.title + ' at ' : ''}${DEFAULT_ORG}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--accent:#c9a36a;--accent-dark:#a8813f;--bg:#f8f6f2;--fg:#1c1812;--soft:#6b6358}
body{background:var(--bg);color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px;gap:20px}
.card{background:#fff;border-radius:20px;box-shadow:0 4px 40px rgba(28,24,18,0.13);max-width:360px;width:100%;padding:36px 28px;display:flex;flex-direction:column;align-items:center;gap:14px}
.logo{height:224px;object-fit:contain}
.avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid var(--accent)}
.avatar-initials{width:96px;height:96px;border-radius:50%;border:3px solid var(--accent);background:var(--accent-dark);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:600;color:#fff}
.name{font-size:1.35rem;font-weight:600;text-align:center;line-height:1.2}
.meta{font-size:0.88rem;color:var(--soft);text-align:center}
.actions{display:flex;flex-direction:column;gap:10px;width:100%;margin-top:6px}
.btn{display:block;width:100%;padding:14px 20px;border-radius:12px;border:none;font-family:inherit;font-size:1rem;font-weight:600;cursor:pointer;text-decoration:none;text-align:center;transition:opacity .15s}
.btn-primary{background:var(--accent);color:#fff}
.btn-secondary{background:transparent;border:1.5px solid #d4b97a;color:var(--accent-dark)}
.btn:hover{opacity:.85}
.social{font-size:0.82rem;color:var(--soft)}
footer{font-size:0.73rem;color:var(--soft);opacity:.6}
</style>
</head>
<body>
<div class="card">
  <img class="logo" src="${logoB64}" alt="the maddhattery">
  ${avatarHtml}
  <div class="name">${p.firstName} ${p.lastName}</div>
  <div class="meta">${p.title ? p.title + ' · ' : ''}${DEFAULT_ORG}</div>
  <div class="actions">
    ${p.booking ? `<a class="btn btn-primary" href="${p.booking}" target="_blank" rel="noopener">📅 Book a Consultation</a>` : ''}
    <a class="btn btn-${p.booking ? 'secondary' : 'primary'}" href="${SITE_URL}" target="_blank" rel="noopener">🎩 Build Your Hat Bar Event</a>
    <a class="btn btn-secondary" style="margin-top:0" href="data:text/vcard;charset=utf-8,${vcardEncoded}" download="${slug}.vcf">💾 Save Contact</a>
  </div>
  ${p.instagram ? `<div class="social">${p.instagram}</div>` : ''}
</div>
<footer>${DEFAULT_ORG}</footer>
</body>
</html>`;
}

// ── GitHub deploy ──────────────────────────────────────────────────────────
async function deployToGitHub(
  token: string,
  slug: string,
  htmlContent: string,
  onStatus: (s: string) => void
): Promise<{ ok: boolean; message: string }> {
  const path = `public/team/${slug}/index.html`;
  const apiBase = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  };

  // Check if file already exists (need SHA for update)
  onStatus('Checking existing file…');
  let sha: string | undefined;
  try {
    const check = await fetch(apiBase, { headers });
    if (check.ok) {
      const data = await check.json();
      sha = data.sha;
    }
  } catch {}

  onStatus(sha ? 'Updating page on GitHub…' : 'Creating page on GitHub…');
  const body: Record<string, string> = {
    message: `${sha ? 'Update' : 'Add'} landing page for ${slug}`,
    content: btoa(unescape(encodeURIComponent(htmlContent))),
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || `GitHub error ${res.status}` };
  }

  return { ok: true, message: 'Deployed! Netlify will go live in ~1 min.' };
}

// ── QR renderer ───────────────────────────────────────────────────────────
declare global { interface Window { QRCode: any } }

function QRPreview({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window.QRCode === 'undefined') return;
    if (!text) { ref.current.innerHTML = ''; qrRef.current = null; return; }
    if (qrRef.current) {
      qrRef.current.clear();
      qrRef.current.makeCode(text);
    } else {
      ref.current.innerHTML = '';
      qrRef.current = new window.QRCode(ref.current, {
        text,
        width: 200,
        height: 200,
        colorDark: '#a8813f',
        colorLight: '#fdf5e8',
        correctLevel: window.QRCode.CorrectLevel.M,
      });
    }
  }, [text]);

  return <div ref={ref} style={{ lineHeight: 0 }} />;
}

// ── Main page ──────────────────────────────────────────────────────────────
const AdminVCards: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  const [person, setPerson] = useState<Person>(blank());
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('mh_gh_token') || '');
  const [deployStatus, setDeployStatus] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployOk, setDeployOk] = useState<boolean | null>(null);
  const [logoB64, setLogoB64] = useState('');
  const [qrReady, setQrReady] = useState(false);
  const qrDivRef = useRef<HTMLDivElement>(null);

  // Load QRCode.js
  useEffect(() => {
    if (typeof window.QRCode !== 'undefined') { setQrReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = () => setQrReady(true);
    document.head.appendChild(s);
  }, []);

  // Fetch logo from Jenn's page on mount
  useEffect(() => {
    fetch('/team/jenn-wagner/index.html')
      .then(r => r.text())
      .then(html => {
        const m = html.match(/src="(data:image\/png;base64,[^"]+)"/);
        if (m) setLogoB64(m[1]);
      })
      .catch(() => {});
  }, []);

  const set = (key: keyof Person, val: string) =>
    setPerson(p => ({ ...p, [key]: val }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('photo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const isValid = person.firstName.trim() && person.lastName.trim();
  const qrText = isValid ? landingUrl(person) : '';

  const downloadQR = () => {
    const img = qrDivRef.current?.querySelector('img') as HTMLImageElement | null;
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `${slugify(person)}-qr.png`;
    a.click();
  };

  const downloadPage = () => {
    const html = buildLandingPage(person, logoB64);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slugify(person)}.html`;
    a.click();
  };

  const handleDeploy = async () => {
    if (!ghToken) {
      setDeployStatus('Enter your GitHub token first.');
      setDeployOk(false);
      return;
    }
    localStorage.setItem('mh_gh_token', ghToken);
    setDeploying(true);
    setDeployOk(null);
    const html = buildLandingPage(person, logoB64);
    const result = await deployToGitHub(ghToken, slugify(person), html, setDeployStatus);
    setDeployStatus(result.message);
    setDeployOk(result.ok);
    setDeploying(false);
  };

  // ── Auth wall ──
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f6f2' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 4px 32px rgba(0,0,0,0.1)', width: 320 }}>
          <h2 style={{ marginBottom: 20, fontFamily: 'sans-serif', fontSize: '1.2rem' }}>Admin access</h2>
          <input
            type="password" placeholder="Password" value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem(AUTH_KEY, 'true'); setAuthed(true); } else setPwError('Incorrect password'); } }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 10, fontSize: '1rem' }}
          />
          {pwError && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: 8 }}>{pwError}</p>}
          <button
            onClick={() => { if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem(AUTH_KEY, 'true'); setAuthed(true); } else setPwError('Incorrect password'); }}
            style={{ width: '100%', padding: '12px', background: '#c9a36a', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontWeight: 600 }}
          >Unlock</button>
        </div>
      </div>
    );
  }

  // ── Main UI ──
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: '0.95rem', marginTop: 4,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#6b6358', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 14,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f6f2', fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#1c1812', padding: '12px 24px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {NAV_LINKS.map(l => (
          <Link key={l.to} to={l.to} style={{ color: l.to === '/maddhattery-admin/vcards' ? '#c9a36a' : '#ccc', textDecoration: 'none', fontSize: '0.85rem', padding: '4px 10px', borderRadius: 6, background: l.to === '/maddhattery-admin/vcards' ? 'rgba(201,163,106,0.15)' : 'transparent' }}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left: form */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Staff QR Cards</h1>
          <p style={{ fontSize: '0.85rem', color: '#6b6358', marginBottom: 20 }}>Fill in a staff member's info, then deploy their landing page to Netlify with one click.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div>
              <label style={labelStyle}>First name *</label>
              <input style={inputStyle} value={person.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jennifer" />
            </div>
            <div>
              <label style={labelStyle}>Last name *</label>
              <input style={inputStyle} value={person.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Whitfield" />
            </div>
          </div>

          <label style={labelStyle}>Title / role</label>
          <input style={inputStyle} value={person.title} onChange={e => set('title', e.target.value)} placeholder="Hat Bar Specialist" />

          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} value={person.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 214 555 0100" />

          <label style={labelStyle}>Email</label>
          <input style={inputStyle} value={person.email} onChange={e => set('email', e.target.value)} placeholder="jennifer@themaddhattery.com" />

          <label style={labelStyle}>Instagram handle</label>
          <input style={inputStyle} value={person.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@themaddhattery" />

          <label style={labelStyle}>Consultation booking link (optional)</label>
          <input style={inputStyle} value={person.booking} onChange={e => set('booking', e.target.value)} placeholder="https://calendar.app.google/…" />
          <p style={{ fontSize: '0.75rem', color: '#6b6358', marginTop: 3 }}>Adds a "Book a Consultation" button to the landing page.</p>

          <label style={labelStyle}>Photo</label>
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ marginTop: 6, fontSize: '0.9rem', width: '100%' }} />
          {person.photo && (
            <img src={person.photo} alt="preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginTop: 8, border: '2px solid #c9a36a' }} />
          )}

          {isValid && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8f6f2', borderRadius: 8, fontSize: '0.8rem', color: '#6b6358' }}>
              Landing URL: <a href={landingUrl(person)} target="_blank" rel="noopener" style={{ color: '#a8813f' }}>{landingUrl(person)}</a>
            </div>
          )}

          {/* Download buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={downloadQR} disabled={!isValid || !qrReady} style={{ flex: 1, padding: '10px', background: '#f0e8d8', border: '1.5px solid #d4b97a', borderRadius: 8, cursor: isValid ? 'pointer' : 'not-allowed', fontSize: '0.9rem', fontWeight: 600, color: '#a8813f', opacity: isValid ? 1 : 0.5 }}>
              ⬇ QR PNG
            </button>
            <button onClick={downloadPage} disabled={!isValid} style={{ flex: 1, padding: '10px', background: '#f0e8d8', border: '1.5px solid #d4b97a', borderRadius: 8, cursor: isValid ? 'pointer' : 'not-allowed', fontSize: '0.9rem', fontWeight: 600, color: '#a8813f', opacity: isValid ? 1 : 0.5 }}>
              ⬇ HTML file
            </button>
          </div>

          {/* GitHub deploy */}
          <div style={{ marginTop: 24, padding: '16px', background: '#f8f6f2', borderRadius: 10, border: '1px solid #e8dcc8' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1c1812', marginBottom: 8 }}>🚀 Deploy to Netlify</p>
            <p style={{ fontSize: '0.78rem', color: '#6b6358', marginBottom: 10 }}>
              Paste a GitHub personal access token (repo scope). It's saved in your browser only.{' '}
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=maddhattery-deploy" target="_blank" rel="noopener" style={{ color: '#a8813f' }}>Create one here →</a>
            </p>
            <input
              type="password"
              placeholder="ghp_…"
              value={ghToken}
              onChange={e => setGhToken(e.target.value)}
              style={{ ...inputStyle, marginTop: 0, marginBottom: 10 }}
            />
            <button
              onClick={handleDeploy}
              disabled={!isValid || deploying}
              style={{ width: '100%', padding: '12px', background: isValid ? '#c9a36a' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', cursor: isValid && !deploying ? 'pointer' : 'not-allowed', fontWeight: 700 }}
            >
              {deploying ? deployStatus || 'Deploying…' : '🚀 Deploy landing page'}
            </button>
            {!deploying && deployStatus && (
              <p style={{ marginTop: 8, fontSize: '0.85rem', color: deployOk ? '#2a7a2a' : '#c0392b', fontWeight: 600 }}>
                {deployOk ? '✅ ' : '❌ '}{deployStatus}
              </p>
            )}
          </div>
        </div>

        {/* Right: QR preview + card preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* QR */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b6358', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QR Preview</p>
            {isValid && qrReady ? (
              <>
                <div ref={qrDivRef} style={{ padding: 12, background: '#fdf5e8', borderRadius: 10 }}>
                  <QRPreview text={qrText} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b6358', textAlign: 'center', wordBreak: 'break-all' }}>{qrText}</p>
              </>
            ) : (
              <div style={{ width: 200, height: 200, background: '#f8f6f2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '0.85rem' }}>
                Enter name to preview
              </div>
            )}
          </div>

          {/* Card preview */}
          {isValid && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b6358', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Card Preview</p>
              <div style={{ background: '#f8f6f2', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                {person.photo
                  ? <img src={person.photo} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a36a' }} />
                  : <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#a8813f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>{person.firstName[0]}{person.lastName[0]}</div>
                }
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{person.firstName} {person.lastName}</div>
                {person.title && <div style={{ fontSize: '0.85rem', color: '#6b6358' }}>{person.title}</div>}
                <div style={{ fontSize: '0.8rem', color: '#6b6358' }}>{DEFAULT_ORG}</div>
                {person.instagram && <div style={{ fontSize: '0.78rem', color: '#a8813f' }}>{person.instagram}</div>}
                {person.booking && <div style={{ fontSize: '0.78rem', background: '#c9a36a', color: '#fff', borderRadius: 6, padding: '4px 10px', marginTop: 4 }}>📅 Book a Consultation</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVCards;
