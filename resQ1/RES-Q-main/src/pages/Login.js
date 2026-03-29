// src/pages/Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertTriangle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! Stay safe.');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try later.'
        : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email address');
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset email sent!');
      setResetMode(false);
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(220,38,38,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* Pulse rings */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%', left: '10%',
          width: 300, height: 300,
          borderRadius: '50%',
          border: '1px solid rgba(220,38,38,0.15)',
          transform: 'translate(-50%, -50%)',
          animation: `pulse-ring ${2 + i * 0.7}s ease-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            borderRadius: 16,
            boxShadow: '0 0 40px rgba(220,38,38,0.5)',
            marginBottom: 16,
          }}>
            <Zap size={32} color="white" fill="white" />
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 48, letterSpacing: 6,
            color: '#ef4444',
            textShadow: '0 0 30px rgba(239,68,68,0.4)',
            lineHeight: 1,
            marginBottom: 4,
          }}>RES-Q</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, letterSpacing: 2 }}>
            EMERGENCY RESPONSE PLATFORM
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--dark-2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 32,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {resetMode ? 'Reset Password' : 'Sign In'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
            {resetMode
              ? "We'll send you a password reset link"
              : 'Your lifeline in emergencies. Sign in to continue.'}
          </p>

          <form onSubmit={resetMode ? handleReset : handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={inputStyle}
              />
            </div>

            {!resetMode && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#ef4444', cursor: 'pointer',
                    fontSize: 12, marginTop: 8,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'rgba(220,38,38,0.5)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                border: 'none', borderRadius: 12,
                color: 'white', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: 0.5,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 0 20px rgba(220,38,38,0.3)',
              }}
            >
              {loading ? 'Please wait...' : resetMode ? 'Send Reset Link' : 'Sign In'}
            </button>

            {resetMode && (
              <button
                type="button"
                onClick={() => setResetMode(false)}
                style={{
                  width: '100%', marginTop: 12,
                  padding: '14px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 12,
                  color: 'rgba(255,255,255,0.6)', fontSize: 15,
                  cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Back to Sign In
              </button>
            )}
          </form>

          {!resetMode && (
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#ef4444', fontWeight: 600 }}>
                Create one
              </Link>
            </p>
          )}
        </div>

        {/* Emergency note */}
        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            In life-threatening emergencies, call <strong style={{ color: '#ef4444' }}>112</strong> immediately.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        input:focus { outline: none !important; border-color: rgba(239,68,68,0.5) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
      `}</style>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--dark-3)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: '#f0f0f0',
  fontSize: 14,
  fontFamily: "'Space Grotesk', sans-serif",
  transition: 'all 0.2s',
};

export default Login;
