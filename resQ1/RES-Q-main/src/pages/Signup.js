// src/pages/Signup.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES = [
  { value: 'victim', label: '🆘 Person in Need', desc: 'Send SOS, get help' },
  { value: 'helper', label: '🦺 Volunteer Helper', desc: 'Respond to emergencies' },
];

const Signup = () => {
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    bloodGroup: '', role: 'victim',
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return toast.error('Fill all fields');
    setStep(2);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) return toast.error('Password must be 6+ characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await signup(form.email, form.password, {
        name: form.name,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        role: form.role,
      });
      toast.success('Account created! Welcome to RES-Q.');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already registered'
        : err.code === 'auth/weak-password' ? 'Password too weak'
        : 'Signup failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      background: 'radial-gradient(ellipse at 80% 50%, rgba(220,38,38,0.1) 0%, transparent 60%), var(--dark)',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            borderRadius: 14,
            boxShadow: '0 0 30px rgba(220,38,38,0.4)',
            marginBottom: 14,
          }}>
            <Zap size={26} color="white" fill="white" />
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 40, letterSpacing: 5, color: '#ef4444', lineHeight: 1,
          }}>RES-Q</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 2, marginTop: 2 }}>
            CREATE YOUR SAFETY PROFILE
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? '#ef4444' : 'var(--dark-4)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{
          background: 'var(--dark-2)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {step === 1 ? 'Personal Information' : 'Account Security & Role'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            Step {step} of 2
          </p>

          {step === 1 ? (
            <form onSubmit={nextStep}>
              <Field label="Full Name" type="text" value={form.name} onChange={v => update('name', v)} placeholder="John Doe" />
              <Field label="Email Address" type="email" value={form.email} onChange={v => update('email', v)} placeholder="john@example.com" />
              <Field label="Phone Number" type="tel" value={form.phone} onChange={v => update('phone', v)} placeholder="+91 9876543210" />

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Blood Group</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {BLOOD_GROUPS.map(bg => (
                    <button
                      key={bg} type="button"
                      onClick={() => update('bloodGroup', bg)}
                      style={{
                        padding: '7px 14px', borderRadius: 8,
                        border: '1px solid',
                        borderColor: form.bloodGroup === bg ? '#ef4444' : 'var(--border)',
                        background: form.bloodGroup === bg ? 'rgba(239,68,68,0.15)' : 'var(--dark-3)',
                        color: form.bloodGroup === bg ? '#ef4444' : 'rgba(255,255,255,0.5)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Space Grotesk', sans-serif",
                        transition: 'all 0.2s',
                      }}
                    >{bg}</button>
                  ))}
                </div>
              </div>

              <button type="submit" style={primaryBtn}>Continue →</button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              {/* Role selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Your Role</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ROLES.map(r => (
                    <button
                      key={r.value} type="button"
                      onClick={() => update('role', r.value)}
                      style={{
                        padding: '12px 16px', borderRadius: 10,
                        border: '1px solid',
                        borderColor: form.role === r.value ? '#ef4444' : 'var(--border)',
                        background: form.role === r.value ? 'rgba(239,68,68,0.1)' : 'var(--dark-3)',
                        color: '#f0f0f0',
                        display: 'flex', alignItems: 'center', gap: 12,
                        cursor: 'pointer', textAlign: 'left',
                        fontFamily: "'Space Grotesk', sans-serif",
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Repeat password" />

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: 1, padding: '14px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 12,
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 14,
                }}>← Back</button>
                <button type="submit" disabled={loading} style={{ ...primaryBtn, flex: 2, marginBottom: 0 }}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#ef4444', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`input:focus { outline: none !important; border-color: rgba(239,68,68,0.5) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }`}</style>
    </div>
  );
};

const Field = ({ label, type, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  </div>
);

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 8,
  letterSpacing: 1, textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: 'var(--dark-3)',
  border: '1px solid var(--border)',
  borderRadius: 10, color: '#f0f0f0', fontSize: 14,
  fontFamily: "'Space Grotesk', sans-serif",
  transition: 'all 0.2s',
};

const primaryBtn = {
  width: '100%', padding: '14px', marginBottom: 0,
  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  border: 'none', borderRadius: 12,
  color: 'white', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
  boxShadow: '0 0 20px rgba(220,38,38,0.3)',
};

export default Signup;
