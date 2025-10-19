import React, { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import { api } from '../services/api';

/**
 * AdminImport.jsx
 * Improved CSV importer for students.
 *
 * Expected CSV headers: student_id,name,email,program,year
 * Backend endpoint expected: POST /api/students
 *
 * Features:
 * - CSV preview + inline validation
 * - Batched uploads with concurrency
 * - Progress and per-row status
 * - Retry failed rows
 */

const REQUIRED_HEADERS = ['student_id', 'name', 'email', 'program', 'year'];

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]); // parsed rows with metadata
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [concurrency, setConcurrency] = useState(5);
  const [logLines, setLogLines] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  function appendLog(line) {
    setLogLines(prev => {
      const next = [...prev, `[${new Date().toLocaleTimeString()}] ${line}`];
      return next.slice(-500); // cap
    });
  }

  function resetState() {
    setRows([]);
    setLogLines([]);
    setFile(null);
    setParsing(false);
    setImporting(false);
  }

  function validateHeaders(headers) {
    const lower = headers.map(h => String(h || '').trim().toLowerCase());
    return REQUIRED_HEADERS.every(h => lower.includes(h));
  }

  function normalizeRow(raw) {
    // trim and map fields; keep unknown fields too
    const obj = {};
    Object.keys(raw).forEach(k => {
      const key = String(k).trim();
      const value = raw[k] === undefined || raw[k] === null ? '' : String(raw[k]).trim();
      obj[key] = value;
    });
    // also produce normalized keys
    const normalized = {};
    for (const h of REQUIRED_HEADERS) {
      // find actual header name case-insensitive
      const foundKey = Object.keys(obj).find(k => k.trim().toLowerCase() === h);
      normalized[h] = foundKey ? obj[foundKey] : '';
    }
    // include other fields if present
    const extras = {};
    Object.keys(obj).forEach(k => {
      if (!REQUIRED_HEADERS.includes(k.trim().toLowerCase())) extras[k] = obj[k];
    });
    return { normalized, extras, raw: obj };
  }

  function handleFileChange(e) {
    setFile(e.target.files?.[0] || null);
  }

  function handleParse() {
    if (!file) return alert('Please choose a CSV file first.');
    setParsing(true);
    setRows([]);
    setLogLines([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => (h ? h.trim() : h),
      complete: (result) => {
        if (!isMounted.current) return;
        const headers = result.meta.fields || [];
        if (!validateHeaders(headers)) {
          appendLog(`Invalid or missing headers. Required: ${REQUIRED_HEADERS.join(', ')}`);
          setParsing(false);
          setRows([]);
          return;
        }

        const parsed = result.data.map((rawRow, idx) => {
          const { normalized, extras, raw } = normalizeRow(rawRow);
          // minimal validation
          const missing = REQUIRED_HEADERS.filter(h => !normalized[h] || String(normalized[h]).trim() === '');
          const emailInvalid = normalized.email && !/^\S+@\S+\.\S+$/.test(normalized.email);
          const status = missing.length > 0 ? 'invalid' : 'pending';
          const errors = [];
          if (missing.length) errors.push(`Missing: ${missing.join(', ')}`);
          if (emailInvalid) errors.push('Invalid email');
          return {
            __index: idx,
            raw,
            data: normalized, // { student_id, name, email, program, year }
            extras,
            status, // pending | invalid | uploading | success | error
            errors,
            serverError: null
          };
        });

        setRows(parsed);
        appendLog(`Parsed ${parsed.length} rows.`);
        setParsing(false);
      },
      error: (err) => {
        appendLog(`CSV parse error: ${err.message}`);
        setParsing(false);
      }
    });
  }

  // concurrency-safe uploader
  async function uploadRows(rowsToUpload) {
    const total = rowsToUpload.length;
    let index = 0;
    const results = new Array(total);

    // worker function
    async function worker() {
      while (true) {
        let i;
        // get next index atomically
        if (index >= total) return;
        i = index;
        index++;
        const row = rowsToUpload[i];
        // mark as uploading
        setRows(prev => {
          const copy = [...prev];
          const p = copy.find(r => r.__index === row.__index);
          if (p) p.status = 'uploading';
          return copy;
        });

        // prepare payload - you can map fields here if backend expects different keys
        const payload = {
          student_id: row.data.student_id,
          name: row.data.name,
          email: row.data.email,
          program: row.data.program,
          year: row.data.year,
          ...row.extras // include any extra columns if desired
        };

        try {
          const resp = await api.post('/students', payload);
          // mark success
          results[i] = { ok: true, resp: resp.data };
          setRows(prev => {
            const copy = [...prev];
            const p = copy.find(r => r.__index === row.__index);
            if (p) { p.status = 'success'; p.serverError = null; }
            return copy;
          });
          appendLog(`Uploaded ${payload.student_id || '(no id)'} -> success`);
        } catch (err) {
          const msg = err?.response?.data?.error || err?.message || 'Network/Error';
          results[i] = { ok: false, error: msg };
          setRows(prev => {
            const copy = [...prev];
            const p = copy.find(r => r.__index === row.__index);
            if (p) { p.status = 'error'; p.serverError = msg; p.errors = [...(p.errors||[]), msg]; }
            return copy;
          });
          appendLog(`Upload failed for ${payload.student_id || '(no id)'}: ${msg}`);
        }
      }
    }

    // spawn workers
    const workers = new Array(Math.max(1, Math.min(concurrency, total))).fill(0).map(() => worker());
    await Promise.all(workers);
    return results;
  }

  async function handleStartImport() {
    // take only rows with status 'pending' or previously failed
    const toUpload = rows.filter(r => r.status === 'pending' || r.status === 'error');
    if (!toUpload.length) return alert('No valid pending rows to import.');

    if (!window.confirm(`Start importing ${toUpload.length} rows?`)) return;

    setImporting(true);
    appendLog(`Import started: ${toUpload.length} rows, concurrency: ${concurrency}`);

    // run uploader
    try {
      await uploadRows(toUpload);
      appendLog('Import finished.');
    } catch (err) {
      appendLog('Import encountered an unrecoverable error: ' + (err.message || err));
    } finally {
      if (isMounted.current) setImporting(false);
    }
  }

  async function handleRetryFailed() {
    const failed = rows.filter(r => r.status === 'error');
    if (!failed.length) return alert('No failed rows to retry.');
    setImporting(true);
    appendLog(`Retrying ${failed.length} failed rows...`);
    try {
      await uploadRows(failed);
      appendLog('Retry finished.');
    } catch (err) {
      appendLog('Retry error: ' + (err.message || err));
    } finally {
      if (isMounted.current) setImporting(false);
    }
  }

  function downloadTemplate() {
    const csv = 'student_id,name,email,program,year\n2025CS001,Ali Khan,ali.khan@demo.edu,BTech CS,3\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // small helpers for UI counts
  const counts = rows.reduce((acc, r) => {
    acc.total++;
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, { total: 0, pending: 0, invalid: 0, uploading: 0, success: 0, error: 0 });

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1>Admin — CSV Import (Students)</h1>
      <p className="small">Expected columns: <code>student_id,name,email,program,year</code></p>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        <button onClick={handleParse} disabled={!file || parsing} style={{ marginLeft: 8 }}>
          {parsing ? 'Parsing...' : 'Parse CSV'}
        </button>

        <button onClick={downloadTemplate} style={{ marginLeft: 8 }}>
          Download template
        </button>
      </div>

      <div style={{ marginTop: 6 }}>
        <label>Concurrency (parallel uploads): </label>
        <input
          type="number"
          min={1}
          max={20}
          value={concurrency}
          onChange={e => setConcurrency(Math.max(1, Math.min(20, Number(e.target.value || 1))))}
          style={{ width: 70, marginLeft: 6 }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Rows:</strong> {counts.total} — pending: {counts.pending} | invalid: {counts.invalid} | uploading: {counts.uploading} | success: {counts.success} | error: {counts.error}
      </div>

      {rows.length > 0 && (
        <>
          <div style={{ marginTop: 12 }}>
            <button onClick={handleStartImport} disabled={importing || rows.filter(r => r.status === 'pending' || r.status === 'error').length === 0}>
              {importing ? 'Importing...' : 'Start Import'}
            </button>

            <button
              onClick={handleRetryFailed}
              disabled={importing || rows.filter(r => r.status === 'error').length === 0}
              style={{ marginLeft: 8 }}
            >
              Retry Failed
            </button>

            <button onClick={resetState} style={{ marginLeft: 8 }} disabled={importing}>
              Reset
            </button>
          </div>

          <div style={{ marginTop: 12, maxHeight: 360, overflow: 'auto', border: '1px solid #eee', padding: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Student ID</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Program</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Year</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Errors</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.__index} style={{ borderTop: '1px solid #f3f3f3' }}>
                    <td style={{ padding: 6 }}>{idx + 1}</td>
                    <td style={{ padding: 6 }}>{r.data.student_id}</td>
                    <td style={{ padding: 6 }}>{r.data.name}</td>
                    <td style={{ padding: 6 }}>{r.data.email}</td>
                    <td style={{ padding: 6 }}>{r.data.program}</td>
                    <td style={{ padding: 6 }}>{r.data.year}</td>
                    <td style={{ padding: 6, textTransform: 'capitalize' }}>{r.status}</td>
                    <td style={{ padding: 6, color: 'crimson' }}>{(r.errors || []).join('; ')}{r.serverError ? `; server: ${r.serverError}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <h3>Log</h3>
        <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid #eee', padding: 8, background: '#fafafa' }}>
          <pre style={{ margin: 0 }}>{logLines.join('\n') || 'No logs yet.'}</pre>
        </div>
      </div>
    </div>
  );
}
