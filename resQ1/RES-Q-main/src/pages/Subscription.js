// src/pages/Subscription.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, Crown, Zap, Shield, Star, ArrowRight } from 'lucide-react';
import { RAZORPAY_KEY } from '../firebase/config';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    icon: <Zap size={22} />,
    color: '#6b7280',
    highlight: false,
    features: [
      'Basic SOS alerts',
      '1 Emergency contact',
      'Location sharing',
      'Map access',
      'Standard response time',
    ],
    missing: ['Priority alerts', 'AI monitoring', 'Multiple contacts', 'SMS alerts'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    period: 'month',
    icon: <Crown size={22} />,
    color: '#3b82f6',
    highlight: true,
    features: [
      'Everything in Free',
      'Priority SOS alerts',
      'Up to 5 emergency contacts',
      'SMS & WhatsApp alerts',
      'Faster response routing',
      'SOS history (30 days)',
      'Danger zone alerts',
    ],
    missing: ['AI monitoring', 'Premium support'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 499,
    period: 'month',
    icon: <Star size={22} />,
    color: '#f59e0b',
    highlight: false,
    features: [
      'Everything in Pro',
      'AI emergency detection',
      'Unlimited contacts',
      'Dedicated emergency hotline',
      'Real-time health monitoring',
      'Family tracking dashboard',
      'Priority support 24/7',
      'Custom danger zones',
    ],
    missing: [],
  },
];

const Subscription = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState('');
  const [billing, setBilling] = useState('monthly'); // monthly | yearly

  const currentPlan = userProfile?.subscription || 'free';

  const handleUpgrade = async (plan) => {
    if (plan.price === 0) return;

    // Razorpay integration
    if (!window.Razorpay) {
      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => initiatePayment(plan);
      script.onerror = () => toast.error('Payment gateway unavailable. Please try again.');
      document.body.appendChild(script);
    } else {
      initiatePayment(plan);
    }
  };

  const initiatePayment = (plan) => {
    const amount = billing === 'yearly' ? plan.price * 10 : plan.price; // 2 months free on yearly
    const options = {
      key: RAZORPAY_KEY,
      amount: amount * 100, // paise
      currency: 'INR',
      name: 'RES-Q Emergency Platform',
      description: `${plan.name} Plan - ${billing === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
      prefill: {
        name: userProfile?.name,
        email: userProfile?.email,
        contact: userProfile?.phone,
      },
      theme: { color: '#dc2626' },
      handler: async (response) => {
        // Payment successful
        setLoading(plan.id);
        try {
          await updateUserProfile({
            subscription: plan.id,
            subscriptionExpiry: new Date(
              Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
            ).toISOString(),
            razorpayPaymentId: response.razorpay_payment_id,
          });
          toast.success(`🎉 Welcome to ${plan.name} Plan!`);
        } catch {
          toast.error('Plan activation failed. Contact support.');
        } finally {
          setLoading('');
        }
      },
      modal: {
        ondismiss: () => toast('Payment cancelled'),
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Payment failed to initialize. Please check your internet connection.');
    }
  };

  const handleDowngrade = async () => {
    try {
      await updateUserProfile({ subscription: 'free', subscriptionExpiry: null });
      toast.success('Downgraded to Free plan');
    } catch {
      toast.error('Failed to downgrade');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
          Choose Your <span style={{ color: '#ef4444' }}>Safety Plan</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
          In an emergency, every second counts. Upgrade for faster response and smarter protection.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: 'inline-flex', marginTop: 24,
          background: 'var(--dark-3)', border: '1px solid var(--border)',
          borderRadius: 100, padding: 4,
        }}>
          {['monthly', 'yearly'].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '8px 20px', borderRadius: 100,
                background: billing === b ? '#ef4444' : 'transparent',
                border: 'none', color: billing === b ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              {b === 'yearly' ? 'Yearly (Save 17%)' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* Current plan banner */}
      <div style={{
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 12, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
      }}>
        <Shield size={18} color="#ef4444" />
        <span style={{ fontSize: 14 }}>
          Current Plan: <strong style={{ color: '#ef4444' }}>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</strong>
          {userProfile?.subscriptionExpiry && (
            <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
              · Expires {new Date(userProfile.subscriptionExpiry).toLocaleDateString('en-IN')}
            </span>
          )}
        </span>
        {currentPlan !== 'free' && (
          <button
            onClick={handleDowngrade}
            style={{
              marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 12px',
              borderRadius: 8, fontSize: 12, fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Downgrade to Free
          </button>
        )}
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
        {PLANS.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            isCurrentPlan={currentPlan === plan.id}
            onUpgrade={() => handleUpgrade(plan)}
            loading={loading === plan.id}
          />
        ))}
      </div>

      {/* FAQ */}
      <div style={{
        background: 'var(--dark-2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Frequently Asked Questions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Downgrade to free anytime. Your data is preserved.' },
            { q: 'Is payment secure?', a: 'Payments are processed via Razorpay with bank-grade 256-bit SSL encryption.' },
            { q: 'What happens if SOS fails?', a: 'Backup SMS and WhatsApp alerts are sent automatically to emergency contacts.' },
            { q: 'Do I need mobile data for SOS?', a: 'An internet connection is required for app-based SOS. Always keep 112 as backup.' },
          ].map(({ q, a }) => (
            <div key={q}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const PlanCard = ({ plan, billing, isCurrentPlan, onUpgrade, loading }) => {
  const yearlyPrice = Math.round(plan.price * 10);
  const displayPrice = billing === 'yearly' ? Math.round(yearlyPrice / 12) : plan.price;

  return (
    <div style={{
      background: plan.highlight ? `linear-gradient(180deg, rgba(59,130,246,0.08) 0%, var(--dark-2) 100%)` : 'var(--dark-2)',
      border: `1px solid ${plan.highlight ? 'rgba(59,130,246,0.4)' : isCurrentPlan ? `rgba(${plan.color.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join(',')},0.4)` : 'var(--border)'}`,
      borderRadius: 20, padding: 28, position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseOver={e => { if (!isCurrentPlan) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3)`; }}}
    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {plan.highlight && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: '#3b82f6', color: 'white',
          padding: '4px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: 1,
          whiteSpace: 'nowrap',
        }}>MOST POPULAR</div>
      )}

      {isCurrentPlan && (
        <div style={{
          position: 'absolute', top: -12, right: 20,
          background: plan.color, color: 'white',
          padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
        }}>ACTIVE</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${plan.color}20`, border: `1px solid ${plan.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: plan.color,
        }}>{plan.icon}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{plan.name}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>₹</span>
          <span style={{ fontSize: 42, fontWeight: 900, color: plan.price === 0 ? '#10b981' : plan.color }}>
            {plan.price === 0 ? '0' : displayPrice}
          </span>
          {plan.price > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              /mo{billing === 'yearly' ? ' · billed yearly' : ''}
            </span>
          )}
        </div>
        {plan.price === 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Free forever</span>
        )}
      </div>

      {/* Features */}
      <div style={{ marginBottom: 28 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: `${plan.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={12} color={plan.color} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
          </div>
        ))}
        {plan.missing.slice(0, 2).map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, opacity: 0.35 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--dark-4)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, textDecoration: 'line-through' }}>{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onUpgrade}
        disabled={isCurrentPlan || loading || plan.price === 0}
        style={{
          width: '100%', padding: '13px',
          borderRadius: 12, cursor: (isCurrentPlan || plan.price === 0) ? 'default' : 'pointer',
          background: isCurrentPlan ? 'rgba(255,255,255,0.05)' : plan.price === 0 ? 'transparent' : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
          border: isCurrentPlan ? '1px solid var(--border)' : plan.price === 0 ? `1px solid ${plan.color}30` : 'none',
          color: isCurrentPlan ? 'var(--text-muted)' : plan.price === 0 ? plan.color : 'white',
          fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: !isCurrentPlan && plan.price > 0 ? `0 0 20px ${plan.color}40` : 'none',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started Free' : (
          <>Upgrade to {plan.name} <ArrowRight size={16} /></>
        )}
      </button>
    </div>
  );
};

export default Subscription;
