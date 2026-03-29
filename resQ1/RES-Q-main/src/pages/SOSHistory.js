// src/pages/SOSHistory.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSOSHistory } from '../services/sosService';
import { Clock, MapPin, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', color: '#ef4444', icon: <AlertCircle size={14} />, bg: 'rgba(239,68,68,0.1)' },
  resolved: { label: 'Resolved', color: '#10b981', icon: <CheckCircle size={14} />, bg: 'rgba(16,185,129,0.1)' },
  cancelled: { label: 'Cancelled', color: '#6b7280', icon: <XCircle size={14} />, bg: 'rgba(107,114,128,0.1)' },
};

const SOSHistory = () => {
  const { userProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!userProfile?.uid) return;
    fetchSOSHistory(userProfile.uid)
      .then(data => {
        const sorted = data.sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });
        setHistory(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userProfile]);

  const filtered = filter === 'all' ? history : history.filter(h => h.status === filter);

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>SOS History</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          All your emergency alerts — {history.length} total
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total SOS', count: history.length, color: '#3b82f6' },
          { label: 'Resolved', count: history.filter(h => h.status === 'resolved').length, color: '#10b981' },
          { label: 'Cancelled', count: history.filter(h => h.status === 'cancelled').length, color: '#6b7280' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>{count}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'active', 'resolved', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === f ? '#ef4444' : 'var(--border)',
              background: filter === f ? 'rgba(239,68,68,0.1)' : 'var(--dark-3)',
              color: filter === f ? '#ef4444' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: filter === f ? 700 : 400,
              fontFamily: "'Space Grotesk', sans-serif",
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Loading your SOS history...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--dark-2)', border: '1px solid var(--border)',
          borderRadius: 16, color: 'var(--text-muted)',
        }}>
          <AlertCircle size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>{filter === 'all' ? 'No SOS alerts yet. Stay safe!' : `No ${filter} alerts.`}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(sos => {
            const status = statusConfig[sos.status] || statusConfig.active;
            return (
              <div key={sos.id} style={{
                background: 'var(--dark-2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 20px',
                borderLeft: `3px solid ${status.color}`,
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 100,
                        background: status.bg,
                        color: status.color, fontSize: 12, fontWeight: 700,
                      }}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                      <Clock size={13} />
                      {formatDate(sos.createdAt)}
                    </div>
                  </div>

                  {sos.location && (
                    <a
                      href={`https://www.google.com/maps?q=${sos.location.lat},${sos.location.lng}`}
                      target="_blank" rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 8,
                        background: 'var(--dark-3)', border: '1px solid var(--border)',
                        color: '#3b82f6', fontSize: 12, fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <MapPin size={13} /> View Location
                    </a>
                  )}
                </div>

                {sos.message && (
                  <div style={{
                    background: 'var(--dark-3)', borderRadius: 8, padding: '10px 14px',
                    fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10,
                    borderLeft: '2px solid rgba(255,255,255,0.1)',
                  }}>
                    "{sos.message}"
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  {sos.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} />
                      {sos.location.lat?.toFixed(4)}, {sos.location.lng?.toFixed(4)}
                    </span>
                  )}
                  {sos.respondersCount > 0 && (
                    <span>👤 {sos.respondersCount} responder(s)</span>
                  )}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.5 }}>
                    #{sos.id?.slice(-8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default SOSHistory;
