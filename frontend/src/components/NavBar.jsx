import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';



export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem('skillfolio:dark');
      if (s !== null) return s === '1';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  // close mobile menu on route change or escape
  const menuRef = useRef(null);
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // persist dark mode and toggle class on root
  useEffect(() => {
    try {
      localStorage.setItem('skillfolio:dark', dark ? '1' : '0');
    } catch (e) {}
    document.documentElement.classList.toggle('sf-dark', dark);
  }, [dark]);

  // close when clicking outside (mobile menu)
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  const links = [
    { to: '/', label: 'Submit' },
    { to: '/moderator', label: 'Moderator' },
    { to: '/admin', label: 'Admin' },
    { to: '/verify', label: 'Verify' },
  ];

  return (
    <header className="sf-nav" role="banner">
      <div className="sf-nav-inner">
        <div className="sf-left">
          <a className="sf-brand" href="/" aria-label="Skillfolio home">
            <span className="sf-logo" aria-hidden>
              {/* simple stacked-lines mark */}
              <svg viewBox="0 0 48 48" width="34" height="34" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden>
                <defs>
                  <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#6c63ff" />
                    <stop offset="1" stopColor="#7dd3fc" />
                  </linearGradient>
                </defs>
                <rect rx="10" width="48" height="48" fill="url(#g1)" />
                <g fill="#fff" opacity="0.95">
                  <rect x="9" y="12" width="30" height="3" rx="2" />
                  <rect x="9" y="22.5" width="30" height="3" rx="2" />
                  <rect x="9" y="33" width="18" height="3" rx="2" />
                </g>
              </svg>
            </span>
            <div className="sf-brand-text">
              <span className="sf-title">Skillfolio</span>
              <span className="sf-sub">demo</span>
            </div>
          </a>

          <nav className="sf-links" aria-label="Main navigation">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `sf-link${isActive ? ' sf-link-active' : ''}`
                }
                end={l.to === '/'}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sf-right">
          <div className="sf-search" role="search" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
              <path d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <input className="sf-search-input" placeholder="Search activities" />
          </div>

          <button
            className="sf-btn-ghost sf-cta"
            onClick={() => { window.location.href = '/signin'; }}
            aria-label="Sign in"
          >
            Sign in
          </button>

          <button
            className="sf-icon-btn"
            onClick={() => setDark((d) => !d)}
            aria-label={`Toggle ${dark ? 'light' : 'dark'} mode`}
            title="Toggle theme"
          >
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zM17.657 6.343a1 1 0 010 1.414L16.243 9.17a1 1 0 11-1.414-1.414l1.414-1.414a1 1 0 011.828 0zM21 12a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM17.657 17.657a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 011.414-1.414l1.414 1.414a1 1 0 010 1.414zM12 19a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM6.343 17.657a1 1 0 01-1.414 0 1 1 0 010-1.414l1.414-1.414a1 1 0 011.414 1.414L6.343 17.657zM3 12a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zM6.343 6.343a1 1 0 010 1.414L7.757 9.17A1 1 0 119.17 7.757L7.757 6.343A1 1 0 016.343 6.343z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M21.752 15.002A9 9 0 1112.998 2.248 7 7 0 0021.752 15z" />
              </svg>
            )}
          </button>

          <button
            className="sf-hamburger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`sf-hamburger-box ${open ? 'open' : ''}`} aria-hidden>
              <span className="sf-hb sf-hb-top" />
              <span className="sf-hb sf-hb-center" />
              <span className="sf-hb sf-hb-bottom" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        ref={menuRef}
        className={`sf-mobile ${open ? 'sf-mobile-open' : ''}`}
        aria-hidden={!open}
      >
        <nav className="sf-mobile-nav" aria-label="Mobile navigation">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `sf-mobile-link${isActive ? ' active' : ''}`
              }
              onClick={() => setOpen(false)}
              end={l.to === '/'}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="sf-mobile-actions">
          <button className="sf-btn-ghost sf-mobile-cta" onClick={() => { window.location.href = '/signin'; }}>
            Sign in
          </button>
          <button className="sf-icon-btn" onClick={() => setDark(d => !d)} aria-label="Toggle theme">
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
/* Theme tokens */
:root{
  --bg: #ffffff;
  --surface: rgba(255,255,255,0.8);
  --muted: #6b7280;
  --text: #082032;
  --accent: linear-gradient(90deg,#6c63ff,#7dd3fc);
  --glass: rgba(12,17,31,0.04);
  --radius: 12px;
  --shadow: 0 8px 28px rgba(12,17,31,0.08);
  --glass-2: rgba(255,255,255,0.6);
}
html.sf-dark {
  --bg: #071024;
  --surface: rgba(8,10,18,0.6);
  --muted: #99a3b2;
  --text: #e6eef8;
  --accent: linear-gradient(90deg,#7c7aff,#60a5fa);
  --glass: rgba(255,255,255,0.03);
  --shadow: 0 8px 28px rgba(2,6,23,0.6);
}

/* Reset-ish */
.sf-nav { position: sticky; top: 0; z-index: 60; backdrop-filter: blur(6px); background: var(--surface); border-bottom: 1px solid rgba(0,0,0,0.04); }
html.sf-dark .sf-nav { border-bottom-color: rgba(255,255,255,0.04); }
.sf-nav-inner { max-width: 1120px; margin: 0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; }

/* Left */
.sf-left { display:flex; align-items:center; gap:18px; min-width:0; }
.sf-brand { display:flex; align-items:center; gap:12px; text-decoration:none; color:var(--text); }
.sf-brand .sf-logo { display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:10px; box-shadow: var(--shadow); flex-shrink:0; }
.sf-brand-text { display:flex; flex-direction:column; line-height:1; }
.sf-title { font-weight:700; font-size:16px; color:var(--text); letter-spacing: -0.2px; }
.sf-sub { font-size:11px; color:var(--muted); margin-top:2px; text-transform:lowercase; }

/* Desktop links */
.sf-links { display:flex; gap:6px; align-items:center; margin-left:2px; }
.sf-link { position:relative; display:inline-flex; align-items:center; padding:8px 12px; border-radius:8px; color:var(--muted); text-decoration:none; font-weight:600; font-size:14px; transition: all 180ms ease; }
.sf-link:hover { color:var(--text); transform:translateY(-1px); background:var(--glass); }
.sf-link::after { content:''; position:absolute; left:12px; right:12px; bottom:6px; height:2px; border-radius:2px; background:transparent; transform-origin:center; transition: all 220ms cubic-bezier(.2,.9,.2,1); }
.sf-link-active, .sf-link:hover { color:var(--text); }
.sf-link-active::after { background: linear-gradient(90deg, rgba(108,99,255,0.95), rgba(124,202,255,0.9)); transform:scaleX(1); }

/* Right controls */
.sf-right { display:flex; align-items:center; gap:10px; margin-left:auto; }
.sf-search { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:10px; background:var(--glass); border:1px solid rgba(0,0,0,0.04); }
html.sf-dark .sf-search { border-color: rgba(255,255,255,0.04); }
.sf-search-input { border:0; background:transparent; outline:none; color:var(--text); font-size:13px; width:160px; }
.sf-btn-ghost { border:1px solid rgba(12,17,31,0.06); padding:8px 12px; border-radius:10px; background:transparent; color:var(--text); cursor:pointer; font-weight:600; }
.sf-cta { background: linear-gradient(90deg,#6c63ff,#60a5fa); color:white; border:0; box-shadow: var(--shadow); padding:8px 12px; border-radius:10px; }
.sf-icon-btn { width:40px; height:40px; display:inline-grid; place-items:center; border-radius:10px; border:0; background:transparent; cursor:pointer; color:var(--muted); }
.sf-icon-btn:focus, .sf-btn-ghost:focus, .sf-cta:focus, .sf-hamburger:focus { outline:3px solid rgba(99,102,241,0.12); outline-offset:3px; }

/* Hamburger */
.sf-hamburger { display:none; background:transparent; border:0; padding:6px; border-radius:10px; cursor:pointer; color:var(--muted); }
.sf-hamburger-box { display:inline-block; width:28px; height:20px; position:relative; }
.sf-hb { display:block; position:absolute; height:2px; left:0; right:0; background:currentColor; border-radius:2px; transition: transform 220ms cubic-bezier(.2,.9,.2,1), opacity 220ms; }
.sf-hb-top { top:0; transform-origin:center; }
.sf-hb-center { top:50%; transform:translateY(-50%); }
.sf-hb-bottom { bottom:0; transform-origin:center; }
.sf-hamburger-box.open .sf-hb-top { transform: translateY(9px) rotate(45deg); }
.sf-hamburger-box.open .sf-hb-center { opacity:0; transform:scaleX(0); }
.sf-hamburger-box.open .sf-hb-bottom { transform: translateY(-9px) rotate(-45deg); }

/* Mobile panel */
.sf-mobile { max-height:0; overflow:hidden; transition: max-height 320ms cubic-bezier(.2,.9,.2,1); background:linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6)); border-top:1px solid rgba(0,0,0,0.04); }
html.sf-dark .sf-mobile { background: linear-gradient(180deg, rgba(6,7,12,0.6), rgba(6,7,12,0.5)); border-top-color: rgba(255,255,255,0.04); }
.sf-mobile-open { max-height:420px; }

/* mobile nav items */
.sf-mobile-nav { display:flex; flex-direction:column; padding:12px; gap:6px; }
.sf-mobile-link { display:block; padding:10px 12px; border-radius:8px; color:var(--text); text-decoration:none; font-weight:700; background:transparent; }
.sf-mobile-link.active { background: var(--glass); color:var(--text); }

/* mobile actions */
.sf-mobile-actions { display:flex; gap:8px; padding:12px; border-top:1px dashed rgba(0,0,0,0.03); }

/* responsive tweaks */
@media (max-width: 880px) {
  .sf-links { display:none; }
  .sf-search { display:none; }
  .sf-hamburger { display:inline-flex; }
  .sf-btn-ghost.sf-cta { display:none; }
}
@media (max-width: 420px) {
  .sf-brand-text .sf-title { display:none; }
}

/* focus, reduced motion */
:focus { outline-offset:3px; }
@media (prefers-reduced-motion: reduce) {
  .sf-link, .sf-hamburger-box, .sf-mobile { transition: none !important; }
}
      `}</style>
    </header>
  );
}
