// src/services/sosService.js
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, set, onValue, off } from 'firebase/database';
import { db, rtdb } from '../firebase/firebase';

/**
 * Trigger an SOS alert
 * - Writes to Firestore (persistent) and Realtime DB (live tracking)
 */
export const triggerSOS = async (user, location, message = '') => {
  if (!user || !location) throw new Error('Missing user or location data');

  const sosData = {
    uid: user.uid,
    userName: user.name || user.email,
    phone: user.phone || '',
    bloodGroup: user.bloodGroup || '',
    location: {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || 0,
      timestamp: new Date().toISOString(),
    },
    message: message || 'EMERGENCY: I need immediate help!',
    status: 'active', // active | resolved | cancelled
    respondersCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Save to Firestore for persistence
  const docRef = await addDoc(collection(db, 'sos_alerts'), sosData);

  // Write to Realtime DB for live updates
  await set(ref(rtdb, `active_sos/${docRef.id}`), {
    ...sosData,
    id: docRef.id,
    createdAt: new Date().toISOString(),
  });

  // Update user's SOS count
  await updateDoc(doc(db, 'users', user.uid), {
    sosCount: (user.sosCount || 0) + 1,
    lastSOS: serverTimestamp(),
  });

  return docRef.id;
};

/**
 * Update live location during active SOS
 */
export const updateLiveLocation = async (sosId, location) => {
  await set(ref(rtdb, `sos_locations/${sosId}`), {
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy || 0,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Cancel / resolve an SOS
 */
export const cancelSOS = async (sosId) => {
  await updateDoc(doc(db, 'sos_alerts', sosId), {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });

  // Remove from Realtime DB
  await set(ref(rtdb, `active_sos/${sosId}`), null);
  await set(ref(rtdb, `sos_locations/${sosId}`), null);
};

/**
 * Mark SOS as resolved
 */
export const resolveSOS = async (sosId) => {
  await updateDoc(doc(db, 'sos_alerts', sosId), {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await set(ref(rtdb, `active_sos/${sosId}`), null);
};

/**
 * Listen to all active SOS alerts in realtime
 */
export const subscribeToActiveSOS = (callback) => {
  const sosRef = ref(rtdb, 'active_sos');
  const listener = onValue(sosRef, (snap) => {
    const data = snap.val();
    const alerts = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
    callback(alerts);
  });
  return () => off(sosRef, 'value', listener);
};

/**
 * Listen to a specific SOS location
 */
export const subscribeToSOSLocation = (sosId, callback) => {
  const locRef = ref(rtdb, `sos_locations/${sosId}`);
  onValue(locRef, (snap) => {
    if (snap.exists()) callback(snap.val());
  });
  return () => off(locRef);
};

/**
 * Fetch user's SOS history
 */
export const fetchSOSHistory = async (uid) => {
  const q = query(collection(db, 'sos_alerts'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Respond to an SOS (helper accepting)
 */
export const respondToSOS = async (sosId, helper) => {
  const responderData = {
    uid: helper.uid,
    name: helper.name,
    phone: helper.phone,
    respondedAt: new Date().toISOString(),
  };
  await set(ref(rtdb, `sos_responders/${sosId}/${helper.uid}`), responderData);
};
