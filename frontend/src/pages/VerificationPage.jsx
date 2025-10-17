import React, { useState } from 'react';
import { verifyTokenOnServer } from '../services/api';

export default function VerificationPage(){
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const doVerify = async (t) => {
    const tok = t || token;
    if (!tok) return alert('Paste token or click a sample token link.');
    setLoading(true);
    try {
      const res = await verifyTokenOnServer(tok);
      setResult({ ok: true, data: res.data });
    } catch (err) {
      setResult({ ok: false, error: err.response?.data || err.message });
    } finally { setLoading(false); }
  };

  // If URL has ?token=..., prefill and auto-run on mount
  React.useEffect(()=> {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) {
      setToken(t);
      doVerify(t);
    }
  }, []);

  return (
    <div className="container">
      <h1>Verify Credential</h1>
      <p className="small">Paste a JWT token here (or open a credential PDF and copy token from URL).</p>

      <div className="form-row">
        <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste JWT token here (or leave blank and use ?token=... in URL)" />
      </div>
      <div className="form-row">
        <button onClick={()=>doVerify()} disabled={loading}>Verify</button>
      </div>

      {result && (
        <div style={{marginTop:12}}>
          {result.ok ? (
            <div className="success">
              <strong>Valid credential</strong>
              <pre style={{whiteSpace:'pre-wrap', maxHeight:300, overflow:'auto'}}>{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          ) : (
            <div className="notice">
              <strong>Invalid or error</strong>
              <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(result.error, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
