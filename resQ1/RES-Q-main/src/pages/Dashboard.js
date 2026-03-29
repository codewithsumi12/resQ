// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { triggerSOS, cancelSOS, subscribeToActiveSOS, updateLiveLocation } from '../services/sosService';
import { getCurrentLocation, watchLocation, clearLocationWatch, formatDistance, calculateDistance } from '../services/locationService';
import { playAlertSound, vibrateDevice, notifyEmergencyContacts, requestNotificationPermission, showNotification } from '../services/notificationService';
import { Phone, MapPin, Users, Clock, AlertTriangle, CheckCircle, Activity, Zap, X, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [sosActive, setSosActive] = useState(false);
  const [sosId, setSosId] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sosMessage, setSosMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get initial location
  useEffect(() => {
    requestNotificationPermission();
    getCurrentLocation()
      .then(setLocation)
      .catch(e => setLocationError(e.message));
  }, []);

  // Subscribe to active SOS alerts (for helpers/admins)
  useEffect(() => {
    const unsub = subscribeToActiveSOS((alerts) => {
      // Filter out own alerts for victims
      const filtered = userProfile?.role !== 'victim'
        ? alerts
        : alerts.filter(a => a.uid !== userProfile?.uid);
      setActiveAlerts(filtered);

      // Notify helpers of new SOS
      if (userProfile?.role === 'helper' && filtered.length > 0) {
        showNotification('🚨 SOS ALERT', `${filtered[0].userName} needs help!`);
      }
    });
    return unsub;
  }, [userProfile]);

  // Timer for active SOS
  useEffect(() => {
    if (!sosActive) return;
    const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [sosActive]);

  // Auto-cancel countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      activateSOS();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const startSOSCountdown = () => {
    if (sosActive) return;
    if (!location) {
      toast.error('Getting your location... please wait');
      getCurrentLocation().then(setLocation).catch(() => toast.error('Location required for SOS'));
      return;
    }
    setCountdown(3);
    vibrateDevice([100, 50, 100]);
    toast('SOS activating in 3 seconds...', { icon: '⚠️', duration: 3000 });
  };

  const cancelCountdown = () => {
    setCountdown(null);
    toast('SOS cancelled', { icon: '✓' });
  };

  const activateSOS = useCallback(async () => {
    setCountdown(null);
    setLoading(true);
    try {
      const loc = location || await getCurrentLocation();

      const id = await triggerSOS(
        { uid: userProfile?.uid || 'anon', name: userProfile?.name, phone: userProfile?.phone, bloodGroup: userProfile?.bloodGroup },
        loc,
        sosMessage || undefined
      );

      setSosId(id);
      setSosActive(true);
      setElapsedTime(0);

      // Play alarm and vibrate
      playAlertSound();
      vibrateDevice([300, 200, 300, 200, 300, 200, 500]);

      // Start watching location for live updates
      const wid = watchLocation(
        async (newLoc) => {
          setLocation(newLoc);
          await updateLiveLocation(id, newLoc);
        },
        (err) => console.warn('Location watch error:', err)
      );
      setWatchId(wid);

      // Notify emergency contacts
      if (userProfile?.emergencyContacts?.length > 0) {
        await notifyEmergencyContacts(userProfile.emergencyContacts, {
          userName: userProfile.name,
          location: loc,
        });
      }

      toast.success('🚨 SOS ACTIVATED! Help is being notified.', { duration: 5000 });
    } catch (err) {
      toast.error('Failed to send SOS: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [location, userProfile, sosMessage]);

  const handleCancelSOS = async () => {
    if (!sosId) return;
    try {
      await cancelSOS(sosId);
      setSosActive(false);
      setSosId(null);
      setElapsedTime(0);
      clearLocationWatch(watchId);
      setWatchId(null);
      toast.success('SOS cancelled. Glad you\'re safe!');
    } catch {
      toast.error('Failed to cancel SOS');
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const stats = [
    { label: 'Active Alerts', value: activeAlerts.length, color: activeAlerts.length > 0 ? '#ef4444' : '#10b981', icon: Activity },
    { label: 'Your SOS Count', value: userProfile?.sosCount || 0, color: '#f59e0b', icon: Zap },
    { label: 'Contacts Saved', value: userProfile?.emergencyContacts?.length || 0, color: '#3b82f6', icon: Users },
    { label: 'Plan', value: (userProfile?.subscription || 'FREE').toUpperCase(), color: '#8b5cf6', icon: CheckCircle },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
          <span style={{ color: '#ef4444' }}>{userProfile?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          {location
            ? `📍 Location acquired — You're connected`
            : locationError
            ? `⚠️ ${locationError}`
            : '📡 Acquiring location...'}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            background: 'var(--dark-2)',
            border: '1px solid var(--border)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5 }}>{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* SOS Button Panel */}
        <div style={{
          background: 'var(--dark-2)',
          border: sosActive ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
          borderRadius: 20, padding: 36, textAlign: 'center',
          boxShadow: sosActive ? '0 0 40px rgba(239,68,68,0.15)' : 'none',
          transition: 'all 0.4s',
        }}>
          {sosActive ? (
            // Active SOS state
            <>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 100, padding: '6px 16px', marginBottom: 24,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'blink 1s infinite' }} />
                <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, letterSpacing: 1 }}>SOS ACTIVE</span>
              </div>

              <div style={{
                fontSize: 64, fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700, color: '#ef4444', marginBottom: 8,
                textShadow: '0 0 30px rgba(239,68,68,0.5)',
                animation: 'pulse-text 1s ease-in-out infinite',
              }}>
                {formatTime(elapsedTime)}
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
                Emergency services and nearby helpers have been notified
              </p>

              {location && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, marginBottom: 28, color: '#10b981', fontSize: 13,
                }}>
                  <MapPin size={14} />
                  Live location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              )}

              <button
                onClick={handleCancelSOS}
                style={{
                  padding: '14px 40px', borderRadius: 12,
                  background: 'transparent',
                  border: '2px solid rgba(239,68,68,0.5)',
                  color: '#ef4444', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                <X size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                I'm Safe — Cancel SOS
              </button>
            </>
          ) : countdown !== null ? (
            // Countdown state
            <>
              <div style={{ fontSize: 14, color: '#f59e0b', fontWeight: 600, marginBottom: 16, letterSpacing: 1 }}>
                SOS ACTIVATING IN...
              </div>
              <div style={{
                fontSize: 120, fontFamily: "'Bebas Neue', sans-serif",
                color: '#ef4444', lineHeight: 1, marginBottom: 24,
                textShadow: '0 0 60px rgba(239,68,68,0.6)',
                animation: 'pulse-text 0.5s ease-in-out infinite',
              }}>
                {countdown}
              </div>
              <button
                onClick={cancelCountdown}
                style={{
                  padding: '14px 40px', borderRadius: 12,
                  background: 'var(--dark-3)', border: '1px solid var(--border)',
                  color: '#f0f0f0', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            // Normal state
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 36 }}>
                Press and hold to send emergency alert with your live location
              </p>

              {/* Giant SOS Button */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: 160, height: 160,
                    borderRadius: '50%',
                    border: `1px solid rgba(220,38,38,${0.3 - i * 0.08})`,
                    transform: 'translate(-50%, -50%)',
                    animation: `sos-ring ${1.5 + i * 0.5}s ease-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }} />
                ))}

                <button
                  onClick={startSOSCountdown}
                  disabled={loading}
                  style={{
                    width: 160, height: 160, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    border: '4px solid rgba(255,100,100,0.3)',
                    boxShadow: '0 0 60px rgba(220,38,38,0.5), inset 0 2px 0 rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8, position: 'relative', zIndex: 1,
                    transition: 'transform 0.1s, box-shadow 0.2s',
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 52, color: 'white', letterSpacing: 4,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    lineHeight: 1,
                  }}>SOS</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
                    TAP TO SEND
                  </span>
                </button>
              </div>

              {/* Optional message */}
              {showMessageInput ? (
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="text"
                    value={sosMessage}
                    onChange={e => setSosMessage(e.target.value)}
                    placeholder="Describe your emergency (optional)"
                    maxLength={200}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'var(--dark-3)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 10, color: '#f0f0f0', fontSize: 14,
                      fontFamily: "'Space Grotesk', sans-serif",
                      outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowMessageInput(true)}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    fontSize: 13, marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto 16px',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <MessageCircle size={14} />
                  Add emergency message
                </button>
              )}

              {/* Emergency numbers */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { label: '🚑 Ambulance', num: '108' },
                  { label: '🚔 Police', num: '100' },
                  { label: '🚒 Fire', num: '101' },
                  { label: '🆘 Emergency', num: '112' },
                ].map(({ label, num }) => (
                  <a
                    key={num} href={`tel:${num}`}
                    style={{
                      padding: '7px 14px', borderRadius: 8,
                      background: 'var(--dark-3)',
                      border: '1px solid var(--border)',
                      color: 'rgba(255,255,255,0.7)', fontSize: 12,
                      textDecoration: 'none', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s',
                    }}
                  >
                    {label}: <strong>{num}</strong>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active SOS alerts */}
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>
                {userProfile?.role === 'victim' ? 'Nearby Alerts' : 'Active SOS Alerts'}
              </h3>
              {activeAlerts.length > 0 && (
                <span style={{
                  background: '#ef4444', color: 'white',
                  fontSize: 11, fontWeight: 700,
                  borderRadius: 100, padding: '2px 8px',
                }}>{activeAlerts.length}</span>
              )}
            </div>

            {activeAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                <CheckCircle size={28} style={{ marginBottom: 8, color: '#10b981' }} />
                <p style={{ fontSize: 13 }}>All clear — no active alerts</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeAlerts.slice(0, 5).map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    userLocation={location}
                    canRespond={userProfile?.role === 'helper'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Emergency contacts preview */}
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 20,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Emergency Contacts</h3>
            {(userProfile?.emergencyContacts || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <p>No contacts saved</p>
                <a href="/profile" style={{ color: '#ef4444', fontSize: 12 }}>+ Add contacts in Profile</a>
              </div>
            ) : (
              userProfile.emergencyContacts.slice(0, 3).map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: i < userProfile.emergencyContacts.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--dark-3)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14,
                  }}>
                    {c.name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>
                  </div>
                  <a href={`tel:${c.phone}`} style={{ color: '#10b981' }}>
                    <Phone size={16} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes sos-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="grid-template-columns: 1fr 340px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const AlertCard = ({ alert, userLocation, canRespond }) => {
  const dist = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, alert.location?.lat, alert.location?.lng)
    : null;

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{alert.userName}</div>
        {dist && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatDistance(dist)} away
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {alert.message || 'Emergency assistance needed'}
      </div>
      {canRespond && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${alert.location?.lat},${alert.location?.lng}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 6,
            background: '#ef4444', color: 'white',
            fontSize: 11, fontWeight: 700, textDecoration: 'none',
          }}
        >
          <MapPin size={11} /> Navigate
        </a>
      )}
    </div>
  );
};

export default Dashboard;
