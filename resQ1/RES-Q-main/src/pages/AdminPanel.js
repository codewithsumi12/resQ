// src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { subscribeToActiveSOS, resolveSOS } from '../services/sosService';
import { Users, AlertTriangle, CheckCircle, Activity, Shield, MapPin, Trash2, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, helpers: 0, victims: 0, premium: 0 });

  useEffect(() => {
    loadUsers();
    const unsub = subscribeToActiveSOS(setActiveAlerts);
    return unsub;
  }, []);

  const loadUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
      setStats({
        total: data.length,
        helpers: data.filter(u => u.role === 'helper').length,
        victims: data.filter(u => u.role === 'victim').length,
        premium: data.filter(u => u.subscription !== 'free').length,
      });
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false));
    }
  };

  const updateUserRole = async (uid, role) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleResolveSOS = async (id) => {
    try {
      await resolveSOS(id);
      toast.success('SOS marked as resolved');
    } catch {
      toast.error('Failed to resolve SOS');
    }
  };

  const planDistribution = [
    { name: 'Free', count: users.filter(u => !u.subscription || u.subscription === 'free').length },
    { name: 'Pro', count: users.filter(u => u.subscription === 'pro').length },
    { name: 'Premium', count: users.filter(u => u.subscription === 'premium').length },
  ];

  const mockActivity = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    sos: Math.floor(Math.random() * 15) + 2,
    users: Math.floor(Math.random() * 40) + 10,
  }));

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={16} /> },
    { id: 'users', label: `Users (${stats.total})`, icon: <Users size={16} /> },
    { id: 'alerts', label: `Live Alerts (${activeAlerts.length})`, icon: <AlertTriangle size={16} />, urgent: activeAlerts.length > 0 },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={26} color="#f59e0b" /> Admin Control Panel
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          System overview and user management
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid',
              borderColor: tab === t.id ? (t.urgent ? '#ef4444' : '#f59e0b') : 'var(--border)',
              background: tab === t.id ? (t.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)') : 'var(--dark-2)',
              color: tab === t.id ? (t.urgent ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.6)',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              fontFamily: "'Space Grotesk', sans-serif",
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {t.icon} {t.label}
            {t.urgent && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#ef4444', animation: 'blink 1s infinite',
                display: 'inline-block',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: stats.total, color: '#3b82f6', icon: <Users size={18} /> },
              { label: 'Helpers', value: stats.helpers, color: '#10b981', icon: <Shield size={18} /> },
              { label: 'Active Alerts', value: activeAlerts.length, color: '#ef4444', icon: <AlertTriangle size={18} /> },
              { label: 'Paid Users', value: stats.premium, color: '#f59e0b', icon: <Crown size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{
                background: 'var(--dark-2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                  <span style={{ color }}>{icon}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{
              background: 'var(--dark-2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Weekly SOS Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockActivity}>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#f0f0f0' }}
                  />
                  <Bar dataKey="sos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              background: 'var(--dark-2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Plan Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
                {planDistribution.map(({ name, count }) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const barColor = name === 'Free' ? '#6b7280' : name === 'Pro' ? '#3b82f6' : '#f59e0b';
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{name}</span>
                        <span style={{ fontSize: 13, color: barColor, fontWeight: 700 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--dark-4)', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.6s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div style={{ background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Role', 'Plan', 'SOS Count', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                      letterSpacing: 1, textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.uid} style={{
                    borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                        }}>
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name || '—'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={u.role || 'victim'}
                        onChange={e => updateUserRole(u.uid, e.target.value)}
                        style={{
                          padding: '5px 10px', borderRadius: 6,
                          background: 'var(--dark-3)', border: '1px solid var(--border)',
                          color: '#f0f0f0', fontSize: 12, cursor: 'pointer',
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {['victim', 'helper', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: u.subscription === 'premium' ? 'rgba(245,158,11,0.2)' : u.subscription === 'pro' ? 'rgba(59,130,246,0.2)' : 'rgba(107,114,128,0.2)',
                        color: u.subscription === 'premium' ? '#f59e0b' : u.subscription === 'pro' ? '#3b82f6' : '#6b7280',
                      }}>
                        {(u.subscription || 'free').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{u.sosCount || 0}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => {/* deactivate user */}}
                        style={{
                          padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444', fontSize: 11, fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Alerts tab */}
      {tab === 'alerts' && (
        <div>
          {activeAlerts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60,
              background: 'var(--dark-2)', border: '1px solid var(--border)',
              borderRadius: 16, color: 'var(--text-muted)',
            }}>
              <CheckCircle size={40} style={{ marginBottom: 16, color: '#10b981' }} />
              <p>No active SOS alerts. All is calm.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeAlerts.map(alert => (
                <div key={alert.id} style={{
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 14, padding: '20px 24px',
                  display: 'flex', alignItems: 'flex-start', gap: 20,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <AlertTriangle size={22} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>{alert.userName}</span>
                      {alert.bloodGroup && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 6,
                          background: 'rgba(239,68,68,0.2)', color: '#ef4444',
                          fontSize: 11, fontWeight: 700,
                        }}>🩸 {alert.bloodGroup}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                      {alert.message || 'Emergency assistance needed'}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                      {alert.phone && <span>📞 {alert.phone}</span>}
                      {alert.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} />
                          {alert.location.lat?.toFixed(4)}, {alert.location.lng?.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    {alert.location && (
                      <a
                        href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lng}`}
                        target="_blank" rel="noreferrer"
                        style={{
                          padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
                          background: 'var(--dark-3)', border: '1px solid var(--border)',
                          color: '#3b82f6', fontSize: 12, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <MapPin size={13} /> Map
                      </a>
                    )}
                    <button
                      onClick={() => handleResolveSOS(alert.id)}
                      style={{
                        padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                        color: '#10b981', fontSize: 12, fontWeight: 600,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      <CheckCircle size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
