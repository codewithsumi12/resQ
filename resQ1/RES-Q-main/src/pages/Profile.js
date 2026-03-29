// src/pages/Profile.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Droplet, Save, Plus, Trash2, QrCode, Download, Edit2 } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Profile = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', bloodGroup: '', bio: '',
  });
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const canvasRef = useRef();

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        bloodGroup: userProfile.bloodGroup || '',
        bio: userProfile.bio || '',
      });
      setContacts(userProfile.emergencyContacts || []);
    }
  }, [userProfile]);

  // Generate QR code
  useEffect(() => {
    if (!userProfile) return;
    const qrData = JSON.stringify({
      name: userProfile.name,
      phone: userProfile.phone,
      bloodGroup: userProfile.bloodGroup,
      emergencyContacts: (userProfile.emergencyContacts || []).slice(0, 2),
      uid: userProfile.uid,
    });
    QRCode.toDataURL(qrData, {
      width: 200, margin: 2,
      color: { dark: '#ef4444', light: '#1a1a1e' },
    }).then(setQrDataUrl).catch(console.error);
  }, [userProfile]);

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      await updateUserProfile({ ...form, emergencyContacts: contacts });
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return toast.error('Name and phone required');
    setContacts(prev => [...prev, { ...newContact }]);
    setNewContact({ name: '', phone: '', relation: '' });
    setShowAddContact(false);
  };

  const removeContact = (i) => setContacts(prev => prev.filter((_, idx) => idx !== i));

  const downloadQR = () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `resq-${userProfile?.name || 'profile'}.png`;
    a.click();
  };

  return (
    <div style={{ padding: 24, maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Your emergency identity card — keep it accurate
          </p>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          style={{
            padding: '10px 20px', borderRadius: 10,
            background: editing ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
            border: 'none', color: 'white', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'Space Grotesk', sans-serif",
            boxShadow: editing ? '0 0 20px rgba(16,185,129,0.3)' : '0 0 20px rgba(220,38,38,0.3)',
          }}
        >
          {editing ? <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</> : <><Edit2 size={16} /> Edit Profile</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* Left: Profile form */}
        <div>
          {/* Avatar & role */}
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800,
              boxShadow: '0 0 20px rgba(220,38,38,0.3)',
            }}>
              {form.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{form.name || 'Your Name'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{userProfile?.email}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 6,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 1,
                }}>
                  {(userProfile?.role || 'VICTIM').toUpperCase()}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 6,
                  background: userProfile?.subscription === 'premium' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                  border: `1px solid ${userProfile?.subscription === 'premium' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  color: userProfile?.subscription === 'premium' ? '#f59e0b' : '#3b82f6',
                  fontSize: 11, fontWeight: 700, letterSpacing: 1,
                }}>
                  {(userProfile?.subscription || 'FREE').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24, marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField
                label="Full Name" icon={<User size={14} />}
                value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))}
                disabled={!editing} placeholder="Your full name"
              />
              <FormField
                label="Phone Number" icon={<Phone size={14} />}
                value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))}
                disabled={!editing} placeholder="+91 9876543210" type="tel"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                <Droplet size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: '#ef4444' }} />
                Blood Group
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg} type="button"
                    onClick={() => editing && setForm(f => ({ ...f, bloodGroup: bg }))}
                    style={{
                      padding: '7px 16px', borderRadius: 8, cursor: editing ? 'pointer' : 'default',
                      border: '1px solid',
                      borderColor: form.bloodGroup === bg ? '#ef4444' : 'var(--border)',
                      background: form.bloodGroup === bg ? 'rgba(239,68,68,0.15)' : 'var(--dark-3)',
                      color: form.bloodGroup === bg ? '#ef4444' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: 600,
                      fontFamily: "'Space Grotesk', sans-serif",
                      transition: 'all 0.2s',
                      opacity: !editing && form.bloodGroup !== bg ? 0.5 : 1,
                    }}
                  >{bg}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Bio / Medical Notes</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                disabled={!editing}
                placeholder="Any medical conditions, allergies, or notes for first responders..."
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--dark-3)', border: '1px solid var(--border)',
                  borderRadius: 10, color: '#f0f0f0', fontSize: 14,
                  fontFamily: "'Space Grotesk', sans-serif",
                  resize: 'vertical', outline: 'none',
                  opacity: !editing ? 0.7 : 1,
                }}
              />
            </div>
          </div>

          {/* Emergency contacts */}
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Emergency Contacts
              </h3>
              {editing && (
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444', fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <Plus size={14} /> Add Contact
                </button>
              )}
            </div>

            {showAddContact && (
              <div style={{
                background: 'var(--dark-3)', borderRadius: 10, padding: 16, marginBottom: 16,
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  {[
                    { ph: 'Name', key: 'name' },
                    { ph: 'Phone', key: 'phone' },
                    { ph: 'Relation', key: 'relation' },
                  ].map(({ ph, key }) => (
                    <input
                      key={key}
                      value={newContact[key]}
                      onChange={e => setNewContact(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={ph}
                      style={miniInputStyle}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addContact} style={{
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    background: '#10b981', border: 'none', color: 'white',
                    fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif",
                  }}>Add</button>
                  <button onClick={() => setShowAddContact(false)} style={{
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'rgba(255,255,255,0.5)', fontSize: 13,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No emergency contacts. {editing ? 'Add one above.' : 'Edit profile to add contacts.'}
              </div>
            ) : (
              contacts.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                  borderBottom: i < contacts.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--dark-3)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, border: '1px solid var(--border)',
                  }}>
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone} {c.relation && `· ${c.relation}`}</div>
                  </div>
                  <a href={`tel:${c.phone}`} style={{ color: '#10b981', marginRight: 8 }}><Phone size={16} /></a>
                  {editing && (
                    <button onClick={() => removeContact(i)} style={{
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                    }}><Trash2 size={16} /></button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: QR Code */}
        <div>
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24, textAlign: 'center',
            position: 'sticky', top: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              <QrCode size={18} color="#ef4444" />
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Emergency QR Code</h3>
            </div>

            {qrDataUrl ? (
              <div style={{
                background: '#1a1a1e',
                border: '2px solid rgba(239,68,68,0.3)',
                borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 16,
              }}>
                <img src={qrDataUrl} alt="Emergency QR" style={{ display: 'block', width: 180, height: 180 }} />
              </div>
            ) : (
              <div style={{
                width: 180, height: 180, margin: '0 auto 16px',
                background: 'var(--dark-3)', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: 13,
              }}>Generating...</div>
            )}

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Scan this QR code to access your emergency information instantly — name, blood group, and contacts.
            </p>

            <button
              onClick={downloadQR}
              disabled={!qrDataUrl}
              style={{
                width: '100%', padding: '10px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <Download size={14} /> Download QR Card
            </button>

            {/* Stats */}
            <div style={{
              marginTop: 20, paddingTop: 20,
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total SOS Sent</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{userProfile?.sosCount || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Emergency Contacts</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{contacts.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Member Since</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        input:focus, textarea:focus { outline: none !important; border-color: rgba(239,68,68,0.5) !important; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 280px"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const FormField = ({ label, icon, value, onChange, disabled, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{icon} {label}</label>
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled} placeholder={placeholder}
      style={{
        width: '100%', padding: '12px 14px',
        background: 'var(--dark-3)',
        border: '1px solid var(--border)',
        borderRadius: 10, color: '#f0f0f0', fontSize: 14,
        fontFamily: "'Space Grotesk', sans-serif",
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.2s',
      }}
    />
  </div>
);

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 8,
  letterSpacing: 1, textTransform: 'uppercase',
};

const miniInputStyle = {
  width: '100%', padding: '9px 12px',
  background: 'var(--dark-4)', border: '1px solid var(--border)',
  borderRadius: 8, color: '#f0f0f0', fontSize: 13,
  fontFamily: "'Space Grotesk', sans-serif",
};

export default Profile;
