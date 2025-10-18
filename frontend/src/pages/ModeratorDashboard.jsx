import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

export default function ModeratorDashboard(){
  const [pending, setPending] = useState([]);
  const [loadingMap, setLoadingMap] = useState({}); // per-row loading
  const [modalOpen, setModalOpen] = useState(false);
  const [modalActivity, setModalActivity] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'approved' | 'rejected'
  const [modalComment, setModalComment] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [requireRejectReason] = useState(true); // change to false if you want reject to be optional
  const commentRef = useRef(null);

  // fetch pending list
  async function fetchPending(){
    try {
      const res = await api.get('/activities?status=pending');
      setPending(res.data || []);
    } catch (e) {
      console.error('fetchPending error', e);
      alert('Failed to fetch pending activities');
    }
  }

  useEffect(()=>{ fetchPending(); }, []);

  function setRowLoading(id, val){
    setLoadingMap(prev => ({ ...prev, [id]: val }));
  }

  // open modal (instead of prompt)
  function openModal(activity, action){
    setModalActivity(activity);
    setModalAction(action);
    setModalComment(''); // clear previous
    setModalOpen(true);

    // autofocus textarea after a tick
    setTimeout(()=> {
      if (commentRef.current) commentRef.current.focus();
    }, 0);
  }

  function closeModal(){
    if (modalLoading) return; // prevent closing while request in-flight
    setModalOpen(false);
    setModalActivity(null);
    setModalAction(null);
    setModalComment('');
  }

  // called when user confirms in modal
  async function submitModalAction(){
    if (!modalActivity || !modalAction) return;

    // require a reason on reject if configured
    if (modalAction === 'rejected' && requireRejectReason && modalComment.trim() === '') {
      const cont = window.confirm('You have not provided a reason for rejection. Are you sure you want to continue without a reason?');
      if (!cont) return;
    }

    const id = modalActivity._id;
    setModalLoading(true);
    setRowLoading(id, true);

    try {
      const res = await api.post(`/activities/${id}/verify`, {
        action: modalAction,
        moderator: 'Demo Moderator', // ideally replace with authenticated moderator name from your auth state
        comment: modalComment.trim()
      });

      if (res?.data?.success) {
        if (modalAction === 'approved') {
          const pdfUrl = res.data.pdfUrl;
          // small confirmation - include link
          alert(`Approved. PDF: ${pdfUrl}`);
        } else {
          alert('Rejected successfully.');
        }

        // optimistic removal
        setPending(prev => prev.filter(a => a._id !== id));
        closeModal();
      } else {
        console.error('Unexpected response', res);
        alert('Unexpected response from server - check console.');
      }
    } catch (err) {
      console.error('submitModalAction error', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Action failed: ${errMsg}`);
    } finally {
      setModalLoading(false);
      setRowLoading(id, false);
    }
  }

  // keyboard: close modal on Escape
  useEffect(() => {
    function onKey(e){
      if (e.key === 'Escape') {
        closeModal();
      }
    }
    if (modalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, modalLoading]);

  return (
    <div className="container" style={{ padding: 20 }}>
      <h1>Moderator — Pending Approvals</h1>
      <p className="small">Approve to generate a signed credential PDF. Reject to send feedback to the student.</p>

      {pending.length === 0 ? (
        <div className="notice">No pending activities.</div>
      ) : (
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Student ID</th>
              <th style={{ textAlign: 'left' }}>Title</th>
              <th style={{ textAlign: 'left' }}>Date</th>
              <th style={{ textAlign: 'left' }}>Evidence</th>
              <th style={{ textAlign: 'left' }}>Submitted By</th>
              <th style={{ textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(a => {
              const isLoading = !!loadingMap[a._id];
              return (
                <tr key={a._id}>
                  <td style={{ padding: '8px 4px' }}>{a.student_id}</td>
                  <td style={{ padding: '8px 4px' }}>{a.title}</td>
                  <td style={{ padding: '8px 4px' }}>{a.date ? new Date(a.date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '8px 4px' }}>
                    {a.evidence_url ? (
                      <a className="link" href={a.evidence_url} target="_blank" rel="noreferrer">Open</a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '8px 4px' }}>{a.student_name || '-'}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <button
                      onClick={() => openModal(a, 'approved')}
                      disabled={isLoading}
                      style={{ marginRight: 8 }}
                      aria-label={`Approve ${a.title}`}
                    >
                      {isLoading && modalAction === 'approved' && modalActivity?._id === a._id ? 'Processing...' : 'Approve'}
                    </button>

                    <button
                      onClick={() => openModal(a, 'rejected')}
                      disabled={isLoading}
                      style={{ background: '#ff0000ff' }}
                      aria-label={`Reject ${a.title}`}
                    >
                      {isLoading && modalAction === 'rejected' && modalActivity?._id === a._id ? 'Processing...' : 'Reject'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {modalOpen && modalActivity && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            zIndex: 9999,
            padding: 20
          }}
          onMouseDown={(e) => {
            // clicking the backdrop closes modal (unless loading)
            if (e.target === e.currentTarget && !modalLoading) closeModal();
          }}
        >
          <div style={{
            width: 640,
            maxWidth: '100%',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
            padding: 20,
          }}>
            <h2 style={{ marginTop: 0 }}>
              {modalAction === 'approved' ? 'Approve Activity' : 'Reject Activity'}
            </h2>

            <div style={{ marginBottom: 8, color: '#333' }}>
              <strong>{modalActivity.title}</strong> — {modalActivity.student_name || modalActivity.student_id}
            </div>

            <label style={{ display: 'block', marginBottom: 6 }}>
              {modalAction === 'approved' ? 'Approval comment (optional)' : 'Rejection reason'}
            </label>
            <textarea
              ref={commentRef}
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
              placeholder={modalAction === 'approved'
                ? 'Optional: add a note e.g., "Hours verified, good evidence."'
                : 'Describe why this was rejected (recommended)'}
              rows={5}
              style={{ width: '100%', padding: 8, boxSizing: 'border-box', marginBottom: 12 }}
              disabled={modalLoading}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeModal} disabled={modalLoading} style={{ background: '#ff0000ff' }}>
                Cancel
              </button>

              <button
                onClick={submitModalAction}
                disabled={modalLoading}
                style={{ background: modalAction === 'approved' ? '#2a9d8f' : '#e63946', color: '#fff', padding: '8px 12px', borderRadius: 4 }}
              >
                {modalLoading ? (modalAction === 'approved' ? 'Approving...' : 'Rejecting...') : (modalAction === 'approved' ? 'Approve' : 'Reject')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
