import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ModeratorDashboard(){
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchPending(){
    try {
      const res = await api.get('/activities?status=pending');
      setPending(res.data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch pending activities');
    }
  }

  useEffect(()=>{ fetchPending(); }, []);

  async function handleApprove(activity){
    if (!window.confirm(`Approve ${activity.title} for ${activity.student_id}?`)) return;
    setLoading(true);
    try {
      const res = await api.post(`/activities/${activity._id}/verify`, {
        action: 'approved',
        moderator: 'Demo Moderator',
        comment: 'Approved for demo'
      });
      alert('Approved. PDF: ' + res.data.pdfUrl);
      fetchPending();
    } catch (err) {
      console.error(err);
      alert('Approve failed: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  }

  return (
    <div className="container">
      <h1>Moderator — Pending Approvals</h1>
      <p className="small">Click Approve to generate a signed credential PDF (demo).</p>

      {pending.length === 0 ? <div className="notice">No pending activities.</div> : (
        <table className="table">
          <thead><tr><th>Student ID</th><th>Title</th><th>Date</th><th>Evidence</th><th>Action</th></tr></thead>
          <tbody>
            {pending.map(a => (
              <tr key={a._id}>
                <td>{a.student_id}</td>
                <td>{a.title}</td>
                <td>{a.date ? new Date(a.date).toLocaleDateString() : '-'}</td>
                <td><a className="link" href={a.evidence_url} target="_blank" rel="noreferrer">Open</a></td>
                <td>
                  <button onClick={() => handleApprove(a)} disabled={loading}>Approve</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
