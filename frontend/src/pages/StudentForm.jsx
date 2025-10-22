import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';

export default function StudentForm() {
  const { register, handleSubmit, reset } = useForm();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('skillfolio:dark');
      if (saved !== null) return saved === '1';
    } catch (e) {}
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('sf-dark', dark);
    try {
      localStorage.setItem('skillfolio:dark', dark ? '1' : '0');
    } catch (e) {}
  }, [dark]);

  const onSubmit = async (data) => {
    setBusy(true);
    setMessage('');
    try {
      if (data.date) data.date = new Date(data.date).toISOString();
      await api.post('/activities', data);
      setMessage('✅ Activity submitted — now pending review.');
      reset();
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.error || err?.message || 'Submission failed';
      setMessage('❌ Submission failed: ' + errMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sf-page">
      <div className="sf-topbar">
        <h2 className="sf-brand">Skillfolio — Submit Activity</h2>
        <div className="sf-toggle" onClick={() => setDark((d) => !d)}>
          <input
            className="sf-toggle-input"
            type="checkbox"
            checked={dark}
            readOnly
          />
          <div className="sf-toggle-track">
            <div className="sf-toggle-thumb" />
          </div>
          <span className="sf-toggle-label">{dark ? 'Dark' : 'Light'}</span>
        </div>
      </div>

      <main className="sf-container">
        <section className="sf-card">
          <p className="sf-lead">
            Create a demo activity. Use a student_id from the imported CSV
            (e.g., <code>2025CS001</code>).
          </p>

          <form className="sf-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="sf-row two">
              <label>
                Student ID <span className="sf-required">*</span>
                <input
                  {...register('student_id', { required: true })}
                  placeholder="e.g. 2025CS001"
                />
              </label>

              <label>
                Type
                <select {...register('type')}>
                  <option value="internship">Internship</option>
                  <option value="club">Club role</option>
                  <option value="certificate">Certificate</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="project">Project</option>
                </select>
              </label>
            </div>

            <label>
              Activity Title <span className="sf-required">*</span>
              <input
                {...register('title', { required: true })}
                placeholder="Internship at ACME"
              />
            </label>

            <label>
              Description
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Brief description of what you did..."
              />
            </label>

            <div className="sf-row two">
              <label>
                Date <span className="sf-required">*</span>
                <input type="date" {...register('date', { required: true })} />
              </label>

              <label>
                Hours
                <input
                  type="number"
                  {...register('hours')}
                  placeholder="e.g. 40"
                />
              </label>
            </div>

            <label>
              Evidence URL
              <input
                {...register('evidence_url')}
                placeholder="https://drive.google.com/..."
              />
            </label>

            <div className="sf-actions">
              <button className="sf-btn primary" type="submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit Activity'}
              </button>
              <button
                className="sf-btn ghost"
                type="button"
                onClick={() => {
                  reset();
                  setMessage('Form reset.');
                }}
              >
                Reset
              </button>
            </div>

            {message && <div className="sf-message">{message}</div>}
          </form>
        </section>

        <aside className="sf-side">
          <div className="sf-card sf-muted">
            <h4>Tips</h4>
            <ul>
              <li>
                Use an institutional student ID like <code>2025CS001</code>.
              </li>
              <li>Paste an evidence link for verification.</li>
              <li>Dark mode remembers your preference.</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="sf-footer">
        <small>
          Skillfolio demo • <span style={{ opacity: 0.8 }}>Student activities</span>
        </small>
      </footer>

      {/* ---------- INLINE STYLES ---------- */}
      <style>{`
        :root {
          --bg: #f6f8fb;
          --page-bg: linear-gradient(180deg, #ffffff, #f6f8fb);
          --card: #ffffff;
          --muted: #6b7280;
          --text: #0f172a;
          --accent: #6c63ff;
          --accent-2: #4f46e5;
          --radius: 12px;
          --shadow: 0 6px 18px rgba(12,17,31,0.06);
        }
        html.sf-dark {
          --bg: #0b1020;
          --page-bg: linear-gradient(180deg,#071028,#06121b);
          --card: rgba(255,255,255,0.03);
          --muted: #9aa4b2;
          --text: #e6eef8;
          --accent: #7c7aff;
          --accent-2: #a89cff;
          --shadow: 0 8px 24px rgba(2,6,23,0.6);
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--page-bg); color: var(--text); font-family: Inter, sans-serif; padding: 28px; }
        .sf-page { max-width: 1100px; margin: 0 auto; }
        .sf-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .sf-brand { font-size:20px; font-weight:600; color:var(--text); }

        .sf-toggle { display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none; }
        .sf-toggle-track {
          width:48px; height:28px; background:rgba(0,0,0,0.05);
          border-radius:999px; position:relative; padding:4px;
        }
        .sf-toggle-thumb {
          width:20px; height:20px; background:var(--card); border-radius:50%; transition:transform 0.25s ease;
        }
        html.sf-dark .sf-toggle-thumb { transform:translateX(20px); background:#fff1; }
        .sf-toggle-label { font-size:13px; color:var(--muted); }

        .sf-container { display:grid; grid-template-columns:1fr 320px; gap:22px; align-items:start; }
        @media(max-width:900px){ .sf-container{ grid-template-columns:1fr; } }

        .sf-card {
          background: var(--card);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: var(--shadow);
        }
        .sf-lead { color:var(--muted); font-size:13px; margin-bottom:12px; }

        .sf-form label { display:block; margin-bottom:12px; font-size:13px; color:var(--muted); }
        .sf-form input, .sf-form select, .sf-form textarea {
          width:100%; padding:10px 12px; margin-top:6px; border-radius:8px;
          border:1px solid rgba(15,23,42,0.06); background:transparent; color:var(--text);
        }
        html.sf-dark .sf-form input, html.sf-dark .sf-form textarea {
          border:1px solid rgba(255,255,255,0.08);
        }
        .sf-form input:focus, .sf-form textarea:focus {
          outline:none; border-color:var(--accent-2);
          box-shadow:0 0 0 2px rgba(99,102,241,0.2);
        }
        .sf-row.two { display:grid; grid-template-columns:1fr 240px; gap:14px; }
        @media(max-width:540px){ .sf-row.two{ grid-template-columns:1fr; } }

        .sf-actions { display:flex; gap:10px; margin-top:6px; }
        .sf-btn {
          padding:10px 14px; border-radius:10px; font-weight:600; cursor:pointer; border:none;
          transition:all 0.2s ease;
        }
        .sf-btn.primary {
          background: linear-gradient(90deg,var(--accent),var(--accent-2)); color:#fff;
        }
        .sf-btn.primary[disabled]{ opacity:.6; cursor:not-allowed; }
        .sf-btn.ghost {
          background:transparent; border:1px solid rgba(15,23,42,0.1); color:var(--muted);
        }
        .sf-message { margin-top:12px; background:rgba(99,102,241,0.08); padding:10px; border-radius:8px; }
        .sf-required { color:#e11d48; }
        .sf-footer { text-align:center; margin-top:20px; color:var(--muted); font-size:13px; }
        code { background:rgba(0,0,0,0.04); padding:2px 6px; border-radius:6px; font-size:12px; }
        html.sf-dark code { background:rgba(255,255,255,0.08); }
      `}</style>
    </div>
  );
}
