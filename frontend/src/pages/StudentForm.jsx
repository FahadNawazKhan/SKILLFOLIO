import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import { Moon, Sun } from "lucide-react"; // 🌙☀️ icons

export default function StudentForm() {
  const { register, handleSubmit, reset } = useForm();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [activities, setActivities] = useState([]);
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("skillfolio:dark");
      if (saved !== null) return saved === "1";
    } catch (e) {}
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  // Load submissions for this student_id (demo)
  async function fetchActivities(studentId) {
    try {
      const res = await api.get("/activities?student_id=" + studentId);
      setActivities(res.data || []);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle("sf-dark", dark);
    try {
      localStorage.setItem("skillfolio:dark", dark ? "1" : "0");
    } catch (e) {}
  }, [dark]);

  const onSubmit = async (data) => {
    setBusy(true);
    setMessage("");
    try {
      if (data.date) data.date = new Date(data.date).toISOString();
      await api.post("/activities", data);
      setMessage("✅ Activity submitted — now pending review.");
      reset();
      fetchActivities(data.student_id);
    } catch (err) {
      console.error(err);
      const errMsg =
        err?.response?.data?.error || err?.message || "Submission failed";
      setMessage("❌ Submission failed: " + errMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sf-page">
      {/* 🌗 Navbar */}
      <nav className="sf-navbar">
        <div className="sf-brand">
          <span className="sf-gradient">Skillfolio</span>
        </div>

        <button
          className="sf-mode-toggle"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      <main className="sf-container">
        {/* FORM */}
        <section className="sf-card">
          <h2 className="sf-title">Submit Activity</h2>
          <p className="sf-lead">
            Use a student_id from the imported CSV (e.g.,{" "}
            <code>2025CS001</code>)
          </p>

          <form className="sf-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="sf-row two">
              <label>
                Student ID <span className="sf-required">*</span>
                <input
                  {...register("student_id", { required: true })}
                  placeholder="e.g. 2025CS001"
                  onBlur={(e) => fetchActivities(e.target.value)}
                />
              </label>

              <label>
                Type
                <select {...register("type")}>
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
                {...register("title", { required: true })}
                placeholder="Internship at ACME"
              />
            </label>

            <label>
              Description
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Brief description of what you did..."
              />
            </label>

            <div className="sf-row two">
              <label>
                Date <span className="sf-required">*</span>
                <input type="date" {...register("date", { required: true })} />
              </label>

              <label>
                Hours
                <input
                  type="number"
                  {...register("hours")}
                  placeholder="e.g. 40"
                />
              </label>
            </div>

            <label>
              Evidence URL
              <input
                {...register("evidence_url")}
                placeholder="https://drive.google.com/..."
              />
            </label>

            <div className="sf-actions">
              <button className="sf-btn primary" type="submit" disabled={busy}>
                {busy ? "Submitting…" : "Submit Activity"}
              </button>
              <button
                className="sf-btn ghost"
                type="button"
                onClick={() => {
                  reset();
                  setMessage("Form reset.");
                }}
              >
                Reset
              </button>
            </div>

            {message && <div className="sf-message">{message}</div>}
          </form>
        </section>

        {/* SUBMISSIONS LIST */}
        <aside className="sf-card sf-list">
          <h3>Your Submissions</h3>
          {activities.length === 0 && (
            <p className="sf-muted">No submissions yet.</p>
          )}
          <ul className="sf-submissions">
            {activities.map((act) => (
              <li key={act._id} className={`status-${act.status}`}>
                <div className="sf-sub-row">
                  <span className="sf-sub-title">{act.title}</span>
                  <span className={`sf-status ${act.status}`}>
                    {act.status.toUpperCase()}
                  </span>
                </div>
                <p className="sf-sub-desc">{act.type}</p>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      <footer className="sf-footer">
        <small>
          Skillfolio demo •{" "}
          <span style={{ opacity: 0.8 }}>Student activities tracker</span>
        </small>
      </footer>

      {/* 💅 Inline Styles */}
      <style>{`
        :root {
          --bg: #f9fafc;
          --nav: #ffffffcc;
          --card: #ffffff;
          --text: #111827;
          --muted: #6b7280;
          --accent: #6366f1;
          --accent2: #4f46e5;
          --success: #10b981;
          --danger: #ef4444;
          --pending: #f59e0b;
          --radius: 14px;
          --shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        html.sf-dark {
          --bg: #0d1117;
          --nav: rgba(22,27,34,0.85);
          --card: #161b22;
          --text: #f1f5f9;
          --muted: #9ca3af;
          --accent: #7c7aff;
          --accent2: #a89cff;
          --shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        body { margin:0; background:var(--bg); color:var(--text); font-family:Inter, sans-serif; }
        .sf-page { max-width:1100px; margin:0 auto; padding:20px; }

        /* Navbar */
        .sf-navbar {
          display:flex; align-items:center; justify-content:space-between;
          background:var(--nav); padding:12px 18px; border-radius:var(--radius);
          box-shadow:var(--shadow); backdrop-filter:blur(10px); margin-bottom:22px;
        }
        .sf-gradient { background:linear-gradient(90deg,var(--accent),var(--accent2));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          font-weight:700; font-size:20px; letter-spacing:0.3px;
        }

        .sf-mode-toggle {
          border:none; background:none; color:var(--text);
          cursor:pointer; padding:6px; border-radius:50%;
          transition:background 0.3s ease;
        }
        .sf-mode-toggle:hover { background:rgba(0,0,0,0.05); }
        html.sf-dark .sf-mode-toggle:hover { background:rgba(255,255,255,0.08); }

        /* Layout */
        .sf-container { display:grid; grid-template-columns:1fr 300px; gap:20px; }
        @media(max-width:900px){ .sf-container{ grid-template-columns:1fr; } }

        .sf-card { background:var(--card); border-radius:var(--radius); box-shadow:var(--shadow); padding:20px; }

        .sf-title { font-size:20px; font-weight:600; margin-bottom:10px; color:var(--accent); }
        .sf-lead { color:var(--muted); font-size:13px; margin-bottom:15px; }

        .sf-form label { display:block; font-size:14px; color:var(--text); margin-bottom:10px; }
        .sf-form input, .sf-form select, .sf-form textarea {
          width:100%; padding:10px 12px; margin-top:6px; border-radius:8px;
          border:1px solid rgba(0,0,0,0.1); background:transparent; color:var(--text);
        }
        html.sf-dark .sf-form input, html.sf-dark .sf-form select, html.sf-dark .sf-form textarea {
          border:1px solid rgba(255,255,255,0.15);
        }
        .sf-row.two { display:grid; grid-template-columns:1fr 200px; gap:14px; }
        @media(max-width:540px){ .sf-row.two{ grid-template-columns:1fr; } }

        .sf-actions { display:flex; gap:10px; margin-top:6px; }
        .sf-btn { border:none; cursor:pointer; padding:10px 14px; border-radius:10px; font-weight:600; }
        .sf-btn.primary { background:linear-gradient(90deg,var(--accent),var(--accent2)); color:#fff; }
        .sf-btn.ghost { background:transparent; border:1px solid rgba(0,0,0,0.1); color:var(--muted); }
        html.sf-dark .sf-btn.ghost { border:1px solid rgba(255,255,255,0.15); }

        .sf-message { margin-top:12px; background:rgba(99,102,241,0.08); padding:10px; border-radius:8px; color:var(--accent); }

        /* Submissions */
        .sf-list h3 { margin-bottom:10px; color:var(--accent); }
        .sf-submissions { list-style:none; padding:0; margin:0; }
        .sf-submissions li { border-bottom:1px solid rgba(0,0,0,0.06); padding:10px 0; }
        html.sf-dark .sf-submissions li { border-bottom:1px solid rgba(255,255,255,0.1); }
        .sf-sub-row { display:flex; justify-content:space-between; align-items:center; }
        .sf-sub-title { font-weight:500; }
        .sf-sub-desc { font-size:12px; color:var(--muted); }
        .sf-status { font-size:12px; padding:3px 8px; border-radius:8px; font-weight:600; color:#fff; }
        .sf-status.pending { background:var(--pending); }
        .sf-status.approved { background:var(--success); }
        .sf-status.rejected { background:var(--danger); }

        .sf-footer { text-align:center; margin-top:30px; color:var(--muted); font-size:13px; }
        code { background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:6px; font-size:12px; }
        html.sf-dark code { background:rgba(255,255,255,0.08); }
      `}</style>
    </div>
  );
}
