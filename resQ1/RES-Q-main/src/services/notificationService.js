// src/services/notificationService.js

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'not-supported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
};

/**
 * Show a browser push notification
 */
export const showNotification = (title, body, options = {}) => {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/resq-icon.png',
    badge: '/resq-badge.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: options.tag || 'resq-alert',
    requireInteraction: options.requireInteraction ?? true,
    ...options,
  });
};

/**
 * Show SOS received notification
 */
export const notifySOSReceived = (sosData) => {
  showNotification(
    '🚨 SOS ALERT RECEIVED',
    `${sosData.userName} needs immediate help nearby!`,
    { tag: `sos-${sosData.id}`, requireInteraction: true }
  );
};

/**
 * Play emergency alert sound
 */
export const playAlertSound = () => {
  // Create oscillator-based alarm sound using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    // Alarm pattern
    [0, 0.4, 0.8, 1.2].forEach(t => {
      playTone(880, t, 0.3);
      playTone(660, t + 0.15, 0.3);
    });
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

/**
 * Vibrate device (mobile)
 */
export const vibrateDevice = (pattern = [200, 100, 200, 100, 200, 100, 400]) => {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
};

/**
 * Send emergency SMS via WhatsApp link (fallback for real SMS)
 */
export const sendWhatsAppSOS = (phone, lat, lng, userName) => {
  const message = encodeURIComponent(
    `🚨 EMERGENCY SOS from ${userName}!\nI need immediate help.\nMy location: https://maps.google.com/?q=${lat},${lng}\nPlease contact emergency services!`
  );
  const url = `https://wa.me/${phone}?text=${message}`;
  window.open(url, '_blank');
};

/**
 * Simulate sending email alert (in production, use Firebase Cloud Functions)
 */
export const notifyEmergencyContacts = async (contacts, sosData) => {
  // In production: call a Firebase Cloud Function that sends emails/SMS
  // For demo, we open WhatsApp for each contact
  contacts.forEach(contact => {
    if (contact.phone) {
      // Small delay between each
      setTimeout(() => {
        sendWhatsAppSOS(
          contact.phone,
          sosData.location.lat,
          sosData.location.lng,
          sosData.userName
        );
      }, 500);
    }
  });
};
