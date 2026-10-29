import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, DollarSign, Users, Shield, AlertTriangle, 
  CheckCircle, XCircle, Plus, Filter, Search, ChevronRight, Download, 
  Bus, Utensils, Award, FileText, Settings, RefreshCw, Layers, Check, X,
  Grid, Globe, Compass, Briefcase, Eye, Edit3, Trash2, Cloud, CloudOff, Award as Trophy, Send
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyDH6LcSjNg1w8Xs4DHZppXo_-dC5Hvzp_A",
  authDomain: "master-scheduling-4f305.firebaseapp.com",
  projectId: "master-scheduling-4f305",
  storageBucket: "master-scheduling-4f305.firebasestorage.app",
  messagingSenderId: "829881890888",
  appId: "1:829881890888:web:8d9bf26146148ac73dc07d",
  measurementId: "G-YJXJ04TGNV"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- INITIAL FALLBACK DATA ---
const INITIAL_VENUES = [
  { id: 'v1', name: 'Alumni Memorial Stadium', type: 'Outdoor Turf', capacity: 5000, sport: 'Football / Lacrosse' },
  { id: 'v2', name: 'Main Arena (Gryphon Center)', type: 'Indoor Court', capacity: 3200, sport: 'Basketball / Volleyball' },
  { id: 'v3', name: 'Varsity Soccer Pitch', type: 'Grass Field', capacity: 1500, sport: 'Soccer' },
  { id: 'v4', name: 'Aquatics & Natatorium', type: 'Pool', capacity: 600, sport: 'Swimming & Diving' },
  { id: 'v5', name: 'Baseball & Softball Diamond', type: 'Field', capacity: 1000, sport: 'Baseball / Softball' }
];

const INITIAL_SPORT_CONFIGS = {
  'Football': { defaultVenueId: 'v1', defaultDuration: 3.5, warmupMinutes: 90, teardownMinutes: 60, tier: 'Tier 1 (Revenue)', officialsCost: 2400, staffCost: 1100, rosterSize: 75 },
  'Men\'s Basketball': { defaultVenueId: 'v2', defaultDuration: 2.5, warmupMinutes: 60, teardownMinutes: 45, tier: 'Tier 1 (Revenue)', officialsCost: 1200, staffCost: 600, rosterSize: 15 },
  'Women\'s Basketball': { defaultVenueId: 'v2', defaultDuration: 2.5, warmupMinutes: 60, teardownMinutes: 45, tier: 'Tier 1 (Revenue)', officialsCost: 1200, staffCost: 600, rosterSize: 15 },
  'Men\'s Soccer': { defaultVenueId: 'v3', defaultDuration: 2.0, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 600, staffCost: 350, rosterSize: 24 },
  'Women\'s Soccer': { defaultVenueId: 'v3', defaultDuration: 2.0, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 600, staffCost: 350, rosterSize: 24 },
  'Volleyball': { defaultVenueId: 'v2', defaultDuration: 2.0, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 500, staffCost: 300, rosterSize: 16 },
  'Baseball': { defaultVenueId: 'v5', defaultDuration: 3.0, warmupMinutes: 60, teardownMinutes: 45, tier: 'Tier 2', officialsCost: 800, staffCost: 400, rosterSize: 30 },
  'Softball': { defaultVenueId: 'v5', defaultDuration: 2.5, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 700, staffCost: 350, rosterSize: 22 },
  'Lacrosse': { defaultVenueId: 'v1', defaultDuration: 2.5, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 3', officialsCost: 600, staffCost: 300, rosterSize: 30 },
  'Swimming': { defaultVenueId: 'v4', defaultDuration: 2.5, warmupMinutes: 30, teardownMinutes: 30, tier: 'Tier 3', officialsCost: 400, staffCost: 250, rosterSize: 25 }
};

const INITIAL_OPPONENTS = [
  { id: 'opp-1', name: 'State Tech University', location: 'State Tech, PA', distance: 140, isConference: true },
  { id: 'opp-2', name: 'Coastal College', location: 'Coastal, NC', distance: 450, isConference: false },
  { id: 'opp-3', name: 'Metro State University', location: 'Metro, NY', distance: 80, isConference: true },
  { id: 'opp-4', name: 'Northern Polytechnic', location: 'North, MA', distance: 620, isConference: false },
  { id: 'opp-5', name: 'Cascade Valley College', location: 'Cascade, VT', distance: 210, isConference: true }
];

const INITIAL_SCHEDULES = [
  {
    id: 'sched-1',
    sport: 'Football',
    coachName: 'Coach Marcus Vance',
    opponent: 'State Tech University',
    locationType: 'Home',
    venueId: 'v1',
    venueName: 'Alumni Memorial Stadium',
    date: '2026-09-12',
    time: '14:00',
    durationHours: 3.5,
    warmupMinutes: 90,
    teardownMinutes: 60,
    travelCost: 0,
    mealCost: 0,
    hotelCost: 0,
    hostingCost: 3500,
    overnightTravel: false,
    travelPartySize: 85,
    travelMode: 'Charter Bus',
    status: 'Approved',
    notes: 'Season opener home game'
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Connecting...');

  // Application State
  const [role, setRole] = useState('admin'); // 'admin' | 'coach'
  const [currentUserSport, setCurrentUserSport] = useState('Football');
  const [schedules, setSchedules] = useState([]);
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [opponents, setOpponents] = useState(INITIAL_OPPONENTS);
  const [sportConfigs, setSportConfigs] = useState(INITIAL_SPORT_CONFIGS);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'calendar', 'matrix', 'submit', 'venues', 'opponents', 'budget', 'tournaments', 'conflicts'
  
  // Modals
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [newOpponentData, setNewOpponentData] = useState({ name: '', location: '', distance: 100, isConference: true });

  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueFormData, setVenueFormData] = useState({ name: '', type: 'Outdoor Turf', capacity: 2000, sport: 'Multi-Sport' });

  const [showChangeReqModal, setShowChangeReqModal] = useState(false);
  const [selectedScheduleForChange, setSelectedScheduleForChange] = useState(null);
  const [changeRequestReason, setChangeRequestReason] = useState('');

  // Form state for scheduling
  const [formData, setFormData] = useState({
    sport: 'Football',
    coachName: 'Coach Marcus Vance',
    opponent: 'State Tech University',
    locationType: 'Home', // Home, Away, Neutral, Tournament, Postseason
    venueId: 'v1',
    date: '',
    time: '14:00',
    durationHours: 3.5,
    warmupMinutes: 90,
    teardownMinutes: 60,
    travelCost: 0,
    mealCost: 0,
    hotelCost: 0,
    hostingCost: 3500,
    overnightTravel: false,
    travelPartySize: 75,
    travelMode: 'Charter Bus',
    notes: ''
  });

  const [notification, setNotification] = useState(null);

  // --- 1. STRICT AUTHENTICATION INITIALIZATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        setUser(auth.currentUser);
        setAuthReady(true);
      } catch (err) {
        console.error("Auth error:", err);
        setSyncStatus('Auth Error');
      }
    };
    initAuth();
  }, []);

  // --- 2. FIRESTORE REAL-TIME SYNC (Guarded by authReady) ---
  useEffect(() => {
    if (!authReady) return;

    // RULE 1 Strict Paths for public data
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const opponentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'opponents');
    const venuesRef = collection(db, 'artifacts', appId, 'public', 'data', 'venues');

    setSyncStatus('Syncing Live');

    const unsubscribeEvents = onSnapshot(eventsRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        if (loaded.length > 0) setSchedules(loaded);
        else {
          INITIAL_SCHEDULES.forEach(async (init) => {
            try { await addDoc(eventsRef, init); } catch (e) { console.error(e); }
          });
        }
        setSyncStatus('Synced');
      },
      (err) => { console.error("Events listener error:", err); setSyncStatus('Permission / Sync Error'); }
    );

    const unsubscribeOpponents = onSnapshot(opponentsRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        if (loaded.length > 0) setOpponents(loaded);
        else {
          INITIAL_OPPONENTS.forEach(async (init) => {
            try { await addDoc(opponentsRef, init); } catch (e) { console.error(e); }
          });
        }
      },
      (err) => { console.error("Opponents listener error:", err); }
    );

    const unsubscribeVenues = onSnapshot(venuesRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        if (loaded.length > 0) setVenues(loaded);
        else {
          INITIAL_VENUES.forEach(async (init) => {
            try { await addDoc(venuesRef, init); } catch (e) { console.error(e); }
          });
        }
      },
      (err) => { console.error("Venues listener error:", err); }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeOpponents();
      unsubscribeVenues();
    };
  }, [authReady]);

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sport defaults & calculation helper
  const handleSportChange = (sportName) => {
    const config = sportConfigs[sportName];
    if (config) {
      setFormData(prev => ({
        ...prev,
        sport: sportName,
        venueId: config.defaultVenueId,
        durationHours: config.defaultDuration,
        warmupMinutes: config.warmupMinutes,
        teardownMinutes: config.teardownMinutes,
        travelPartySize: config.rosterSize || 30
      }));
    } else {
      setFormData(prev => ({ ...prev, sport: sportName }));
    }
  };

  // Automated travel & lodging estimator
  const calculateCosts = (oppName, locType, overnight, partySize, sportName) => {
    const oppObj = opponents.find(o => o.name === oppName);
    const config = sportConfigs[sportName] || sportConfigs['Football'];
    const distance = oppObj ? oppObj.distance : 100;
    
    let travel = 0;
    let meals = 0;
    let hotel = 0;
    let hosting = 0;

    const isHome = locType === 'Home' || locType === 'Tournament';
    if (isHome) {
      hosting = Number(config.officialsCost || 600) + Number(config.staffCost || 300);
    } else {
      // Away / Neutral
      travel = distance > 350 ? partySize * 110 : partySize * 45; // flight vs charter bus estimate
      meals = partySize * 45 * (overnight ? 3 : 1); // per diem
      hotel = overnight ? Math.ceil(partySize / 2) * 160 * 1 : 0; // double occupancy rooms
    }

    return { travel, meals, hotel, hosting };
  };

  const handleOpponentOrTripChange = (updates) => {
    const nextData = { ...formData, ...updates };
    const costs = calculateCosts(nextData.opponent, nextData.locationType, nextData.overnightTravel, nextData.travelPartySize, nextData.sport);
    setFormData({
      ...nextData,
      travelCost: costs.travel,
      mealCost: costs.meals,
      hotelCost: costs.hotel,
      hostingCost: costs.hosting
    });
  };

  const handleLocationTypeChange = (locType) => {
    const isHome = locType === 'Home';
    const config = sportConfigs[formData.sport];
    const venueId = isHome ? (config ? config.defaultVenueId : 'v1') : 'Away';
    handleOpponentOrTripChange({ locationType: locType, venueId });
  };

  // Add/Edit Venue Handlers
  const handleSaveVenue = async (e) => {
    e.preventDefault();
    if (!authReady) return;
    try {
      const venuesRef = collection(db, 'artifacts', appId, 'public', 'data', 'venues');
      if (editingVenue) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'venues', editingVenue.id), venueFormData);
        showNotice('Venue updated successfully');
      } else {
        await addDoc(venuesRef, venueFormData);
        showNotice('New venue added to cloud');
      }
      setShowVenueModal(false);
      setEditingVenue(null);
      setVenueFormData({ name: '', type: 'Outdoor Turf', capacity: 2000, sport: 'Multi-Sport' });
    } catch (err) {
      console.error(err);
      showNotice('Error saving venue', 'error');
    }
  };

  const handleDeleteVenue = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'venues', id));
      showNotice('Venue deleted');
    } catch (err) {
      console.error(err);
      showNotice('Error deleting venue', 'error');
    }
  };

  // Add Opponent Handler
  const handleAddOpponentSubmit = async (e) => {
    e.preventDefault();
    if (!newOpponentData.name || !authReady) return;
    try {
      const opponentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'opponents');
      await addDoc(opponentsRef, newOpponentData);
      setShowOpponentModal(false);
      setNewOpponentData({ name: '', location: '', distance: 100, isConference: true });
      showNotice(`Opponent "${newOpponentData.name}" added.`);
    } catch (err) {
      console.error(err);
      showNotice('Error saving opponent', 'error');
    }
  };

  // Check conflicts with warmup buffers
  const checkConflictsForEvent = (newEvent, existingList, ignoreId = null) => {
    const conflicts = [];
    const isTentative = newEvent.locationType === 'Postseason' && newEvent.status === 'Tentative';
    if (!newEvent.date || !newEvent.time) return conflicts;

    const newStart = new Date(`${newEvent.date}T${newEvent.time}`);
    const warmupOffsetMs = (Number(newEvent.warmupMinutes || 0)) * 60000;
    const teardownOffsetMs = (Number(newEvent.teardownMinutes || 0)) * 60000;
    
    const effectiveStart = new Date(newStart.getTime() - warmupOffsetMs);
    const effectiveEnd = new Date(newStart.getTime() + (parseFloat(newEvent.durationHours || 3) * 3600000) + teardownOffsetMs);

    existingList.forEach(item => {
      if (ignoreId && item.id === ignoreId) return;
      if (item.status === 'Rejected') return;
      if (!item.date || !item.time) return;

      const itemStart = new Date(`${item.date}T${item.time}`);
      const itemWarmupMs = (Number(item.warmupMinutes || 0)) * 60000;
      const itemTeardownMs = (Number(item.teardownMinutes || 0)) * 60000;

      const itemEffectiveStart = new Date(itemStart.getTime() - itemWarmupMs);
      const itemEffectiveEnd = new Date(itemStart.getTime() + (parseFloat(item.durationHours || 3) * 3600000) + itemTeardownMs);

      const isOverlappingTime = effectiveStart < itemEffectiveEnd && effectiveEnd > itemEffectiveStart;

      if (isOverlappingTime) {
        if (newEvent.venueId !== 'Away' && item.venueId !== 'Away' && newEvent.venueId === item.venueId) {
          conflicts.push({
            type: isTentative ? 'INFO' : 'CRITICAL',
            message: `Venue Double-Booking at ${item.venueName}: Clashes with ${item.sport} vs ${item.opponent}.`
          });
        }
      }
    });

    return conflicts;
  };

  // Submit Schedule Entry (Fixed to Firestore)
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.opponent || !formData.date || !authReady) {
      showNotice('Please complete required fields.', 'error');
      return;
    }

    const selectedVenue = venues.find(v => v.id === formData.venueId);
    const venueName = formData.locationType === 'Home' && selectedVenue ? selectedVenue.name : (formData.locationType === 'Neutral' ? 'Neutral Site' : 'Away Contest');

    const submissionPayload = {
      ...formData,
      venueName,
      status: formData.locationType === 'Postseason' ? 'Tentative' : (role === 'admin' ? 'Approved' : 'Pending')
    };

    const conflicts = checkConflictsForEvent(submissionPayload, schedules);
    const hasCritical = conflicts.some(c => c.type === 'CRITICAL');

    if (hasCritical && role === 'coach') {
      showNotice('Critical venue double-booking detected including warmup buffers. Cannot submit.', 'error');
      return;
    }

    const newRecord = {
      ...submissionPayload,
      status: formData.locationType === 'Postseason' ? 'Tentative' : (conflicts.length > 0 ? 'Conflict Warning' : (role === 'admin' ? 'Approved' : 'Pending'))
    };

    try {
      const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
      await addDoc(eventsRef, newRecord);
      showNotice(conflicts.length > 0 ? 'Submitted with conflict warning notes.' : 'Schedule saved to cloud successfully!', conflicts.length > 0 ? 'warning' : 'success');
      setActiveTab(role === 'admin' ? 'dashboard' : 'calendar');
    } catch (err) {
      console.error("Firebase Add Error:", err);
      showNotice('Failed to save schedule to cloud.', 'error');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id), { status: newStatus });
      showNotice(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      showNotice('Error updating status', 'error');
    }
  };

  const deleteSchedule = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
      showNotice('Schedule entry removed.');
    } catch (err) {
      console.error(err);
      showNotice('Error deleting entry', 'error');
    }
  };

  const handleRequestChangeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedScheduleForChange || !changeRequestReason || !authReady) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', selectedScheduleForChange.id), {
        status: 'Change Requested',
        changeRequestReason
      });
      setShowChangeReqModal(false);
      setSelectedScheduleForChange(null);
      setChangeRequestReason('');
      showNotice('Schedule change request submitted to admin.');
    } catch (err) {
      console.error(err);
      showNotice('Error submitting change request', 'error');
    }
  };

  // --- BUDGET SUMMARY ---
  const budgetSummary = useMemo(() => {
    let totalTravel = 0, totalMeals = 0, totalHotel = 0, totalHosting = 0;
    const bySport = {};

    schedules.forEach(s => {
      if (s.status === 'Rejected') return;
      const t = Number(s.travelCost || 0);
      const m = Number(s.mealCost || 0);
      const h = Number(s.hotelCost || 0);
      const host = Number(s.hostingCost || 0);

      totalTravel += t;
      totalMeals += m;
      totalHotel += h;
      totalHosting += host;

      if (!bySport[s.sport]) {
        bySport[s.sport] = { travel: 0, meals: 0, hotel: 0, hosting: 0, count: 0 };
      }
      bySport[s.sport].travel += t;
      bySport[s.sport].meals += m;
      bySport[s.sport].hotel += h;
      bySport[s.sport].hosting += host;
      bySport[s.sport].count += 1;
    });

    const grandTotal = totalTravel + totalMeals + totalHotel + totalHosting;
    return { totalTravel, totalMeals, totalHotel, totalHosting, grandTotal, bySport };
  }, [schedules]);

  const displayedSchedules = useMemo(() => {
    if (role === 'coach') return schedules.filter(s => s.sport === currentUserSport);
    return schedules;
  }, [schedules, role, currentUserSport]);

  const activeConflictsList = useMemo(() => {
    const list = [];
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const ev1 = schedules[i];
        const ev2 = schedules[j];
        if (ev1.status === 'Rejected' || ev2.status === 'Rejected') continue;

        const start1 = new Date(`${ev1.date}T${ev1.time}`);
        const end1 = new Date(start1.getTime() + (parseFloat(ev1.durationHours || 3) * 3600000));
        const start2 = new Date(`${ev2.date}T${ev2.time}`);
        const end2 = new Date(start2.getTime() + (parseFloat(ev2.durationHours || 3) * 3600000));

        if (start1 < end2 && end1 > start2) {
          if (ev1.venueId !== 'Away' && ev2.venueId !== 'Away' && ev1.venueId === ev2.venueId) {
            list.push({
              id: `${ev1.id || i}-${ev2.id || j}`,
              title: `Double Booked Venue: ${ev1.venueName}`,
              desc: `${ev1.sport} (${ev1.opponent}) clashes with ${ev2.sport} (${ev2.opponent}) on ${ev1.date}`
            });
          }
        }
      }
    }
    return list;
  }, [schedules]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-white transition-all transform animate-bounce ${
          notification.type === 'error' ? 'bg-rose-600' : notification.type === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
        }`}>
          {notification.type === 'error' ? <XCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      {/* Opponent Modal */}
      {showOpponentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Add Opponent to Master Directory</h3>
            <form onSubmit={handleAddOpponentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Opponent Name</label>
                <input type="text" required value={newOpponentData.name} onChange={(e) => setNewOpponentData({...newOpponentData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="e.g. Pacific Coast University" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location / City</label>
                  <input type="text" required value={newOpponentData.location} onChange={(e) => setNewOpponentData({...newOpponentData, location: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="City, State" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Distance (Miles)</label>
                  <input type="number" value={newOpponentData.distance} onChange={(e) => setNewOpponentData({...newOpponentData, distance: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="isConference" checked={newOpponentData.isConference} onChange={(e) => setNewOpponentData({...newOpponentData, isConference: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-950 border-slate-700" />
                <label htmlFor="isConference" className="text-xs text-slate-300">Conference Opponent (Yes/No Check)</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowOpponentModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Opponent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Venue Modal (Add/Edit) */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">{editingVenue ? 'Edit Venue' : 'Add New Venue'}</h3>
            <form onSubmit={handleSaveVenue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Venue Name</label>
                <input type="text" required value={venueFormData.name} onChange={(e) => setVenueFormData({...venueFormData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Surface / Type</label>
                  <input type="text" value={venueFormData.type} onChange={(e) => setVenueFormData({...venueFormData, type: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Capacity</label>
                  <input type="number" value={venueFormData.capacity} onChange={(e) => setVenueFormData({...venueFormData, capacity: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Associated Sports</label>
                <input type="text" value={venueFormData.sport} onChange={(e) => setVenueFormData({...venueFormData, sport: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowVenueModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Venue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Change Request Modal */}
      {showChangeReqModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Request Schedule Change</h3>
            <p className="text-xs text-slate-400 mb-4">Submit a modification request to administration for review.</p>
            <form onSubmit={handleRequestChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason / Desired Change</label>
                <textarea rows="3" required value={changeRequestReason} onChange={(e) => setChangeRequestReason(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="Explain why this contest needs rescheduling..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowChangeReqModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Gryphon Athletics Master Schedule & Budget System</h1>
            <p className="text-xs text-slate-400 flex items-center space-x-2">
              <span>Collegiate Operations & Venue Management</span>
              <span className="inline-flex items-center text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/20">
                <Cloud className="w-3 h-3 mr-1" /> {syncStatus}
              </span>
            </p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center space-x-4 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>ROLE:</span>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button onClick={() => { setRole('admin'); setActiveTab('dashboard'); }} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>Admin View</button>
            <button onClick={() => { setRole('coach'); setActiveTab('calendar'); }} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${role === 'coach' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>Coach Portal</button>
          </div>
          {role === 'coach' && (
            <select value={currentUserSport} onChange={(e) => setCurrentUserSport(e.target.value)} className="bg-slate-950 text-xs border border-slate-700 rounded-lg px-2 py-1 text-slate-200">
              {Object.keys(sportConfigs).map(sp => <option key={sp} value={sp}>{sp}</option>)}
            </select>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2 flex items-center space-x-2 overflow-x-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'dashboard' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><Layers className="w-3.5 h-3.5" /><span>Overview</span></button>
        <button onClick={() => setActiveTab('calendar')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'calendar' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><Calendar className="w-3.5 h-3.5" /><span>Master Calendar</span></button>
        <button onClick={() => setActiveTab('matrix')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'matrix' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><Grid className="w-3.5 h-3.5" /><span>Venue Matrix</span></button>
        <button onClick={() => setActiveTab('submit')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'submit' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><Plus className="w-3.5 h-3.5" /><span>{role === 'admin' ? 'Add Schedule' : 'Submit Schedule'}</span></button>
        <button onClick={() => setActiveTab('venues')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'venues' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><MapPin className="w-3.5 h-3.5" /><span>Venues</span></button>
        <button onClick={() => setActiveTab('opponents')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'opponents' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><Globe className="w-3.5 h-3.5" /><span>Opponents</span></button>
        <button onClick={() => setActiveTab('budget')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'budget' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><DollarSign className="w-3.5 h-3.5" /><span>Budget Projections</span></button>
        <button onClick={() => setActiveTab('tournaments')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${activeTab === 'tournaments' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><Trophy className="w-3.5 h-3.5" /><span>Tournaments & Postseason</span></button>
        {role === 'admin' && (
          <button onClick={() => setActiveTab('conflicts')} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 relative ${activeTab === 'conflicts' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'}`}><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><span>Conflict Queue</span></button>
        )}
      </div>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase">Total Contests</p>
                <h3 className="text-2xl font-bold mt-1 text-white">{schedules.length}</h3>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase">Active Clashes</p>
                <h3 className="text-2xl font-bold mt-1 text-rose-400">{activeConflictsList.length}</h3>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase">Total Budget</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-400">${budgetSummary.grandTotal.toLocaleString()}</h3>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase">Venues Managed</p>
                <h3 className="text-2xl font-bold mt-1 text-indigo-400">{venues.length}</h3>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Recent Submissions & Requests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                      <th className="pb-3">Sport</th>
                      <th className="pb-3">Opponent</th>
                      <th className="pb-3">Date & Time</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {schedules.slice(0, 5).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-900/40">
                        <td className="py-3 font-bold text-white">{item.sport}</td>
                        <td className="py-3 text-slate-200">{item.opponent}</td>
                        <td className="py-3 text-slate-300 text-xs">{item.date} @ {item.time}</td>
                        <td className="py-3 text-xs"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">{item.locationType}</span></td>
                        <td className="py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: CALENDAR --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">{role === 'coach' ? `${currentUserSport} Schedule` : 'Master Schedule'}</h2>
              <button onClick={() => setActiveTab('matrix')} className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-xl text-xs font-bold">Side-by-Side Matrix</button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                    <th className="pb-3">Sport & Coach</th>
                    <th className="pb-3">Opponent</th>
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3">Venue / Type</th>
                    <th className="pb-3">Party Size / Travel</th>
                    <th className="pb-3">Budget</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {displayedSchedules.length === 0 ? (
                    <tr><td colSpan="8" className="py-8 text-center text-slate-500">No events found.</td></tr>
                  ) : (
                    displayedSchedules.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-900/40">
                        <td className="py-4">
                          <div className="font-bold text-white">{item.sport}</div>
                          <div className="text-xs text-slate-400">{item.coachName}</div>
                        </td>
                        <td className="py-4 text-slate-200">{item.opponent}</td>
                        <td className="py-4 text-xs font-semibold text-slate-200">{item.date} @ {item.time}</td>
                        <td className="py-4 text-xs"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">{item.locationType}: {item.venueName}</span></td>
                        <td className="py-4 text-xs text-slate-300">
                          <div>Party: {item.travelPartySize || 30}</div>
                          {item.overnightTravel && <span className="text-amber-400 font-bold">Overnight Stay</span>}
                        </td>
                        <td className="py-4 text-xs font-mono text-emerald-400">${(Number(item.travelCost)+Number(item.mealCost)+Number(item.hotelCost)+Number(item.hostingCost)).toLocaleString()}</td>
                        <td className="py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{item.status}</span></td>
                        <td className="py-4 text-right space-x-2">
                          {role === 'admin' && item.id && item.status !== 'Approved' && (
                            <button onClick={() => updateStatus(item.id, 'Approved')} className="p-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg"><Check className="w-4 h-4"/></button>
                          )}
                          {role === 'coach' && item.id && item.status === 'Approved' && (
                            <button onClick={() => { setSelectedScheduleForChange(item); setShowChangeReqModal(true); }} className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded-lg text-xs">Request Change</button>
                          )}
                          {item.id && (
                            <button onClick={() => deleteSchedule(item.id)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: MATRIX --- */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">Side-by-Side Venue Matrix</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {venues.map(v => {
                const venueEvents = schedules.filter(s => s.venueId === v.id && s.status !== 'Rejected');
                return (
                  <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white truncate">{v.name}</h3>
                      <p className="text-[11px] text-indigo-400 mb-3">{v.type}</p>
                      <div className="space-y-2 max-h-[450px] overflow-y-auto">
                        {venueEvents.map((ev, i) => (
                          <div key={ev.id || i} className="bg-slate-900 p-2.5 rounded-xl text-xs space-y-1">
                            <div className="font-bold text-indigo-300">{ev.sport} vs {ev.opponent}</div>
                            <div className="text-slate-400 text-[11px]">{ev.date} @ {ev.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: SUBMIT SCHEDULE FORM --- */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-white mb-6">{role === 'admin' ? 'Add Master Schedule Entry' : 'Submit Schedule Request'}</h2>
            
            <form onSubmit={handleScheduleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sport</label>
                  {role === 'admin' ? (
                    <select value={formData.sport} onChange={(e) => handleSportChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                      {Object.keys(sportConfigs).map(sp => <option key={sp} value={sp}>{sp}</option>)}
                    </select>
                  ) : (
                    <input type="text" disabled value={currentUserSport} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Coach Name</label>
                  <input type="text" value={formData.coachName} onChange={(e) => setFormData({...formData, coachName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Opponent</label>
                  <select value={formData.opponent} onChange={(e) => handleOpponentOrTripChange({ opponent: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                    {opponents.map(o => <option key={o.id} value={o.name}>{o.name} ({o.distance} mi)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location Type</label>
                  <select value={formData.locationType} onChange={(e) => handleLocationTypeChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="Home">Home Contest</option>
                    <option value="Away">Away Contest</option>
                    <option value="Neutral">Neutral Site</option>
                  </select>
                </div>
              </div>

              {formData.locationType === 'Home' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Home Venue</label>
                  <select value={formData.venueId} onChange={(e) => setFormData({...formData, venueId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Time</label>
                  <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Hrs)</label>
                  <input type="number" step="0.5" value={formData.durationHours} onChange={(e) => setFormData({...formData, durationHours: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>

              {/* Trip Details & Automated Budgeting */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-indigo-400 uppercase">Travel Party & Automated Budgeting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Anticipated Travel Party Size</label>
                    <input type="number" value={formData.travelPartySize} onChange={(e) => handleOpponentOrTripChange({ travelPartySize: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center space-x-2 text-xs text-white cursor-pointer">
                      <input type="checkbox" checked={formData.overnightTravel} onChange={(e) => handleOpponentOrTripChange({ overnightTravel: e.target.checked })} className="rounded text-indigo-600 w-4 h-4 bg-slate-950 border-slate-700" />
                      <span>Overnight Travel Required (Hotels)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div>Transport: <span className="font-mono text-emerald-400">${formData.travelCost}</span></div>
                  <div>Meals: <span className="font-mono text-emerald-400">${formData.mealCost}</span></div>
                  <div>Hotel: <span className="font-mono text-emerald-400">${formData.hotelCost}</span></div>
                  <div>Hosting: <span className="font-mono text-emerald-400">${formData.hostingCost}</span></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="Broadcast, special requirements..."></textarea>
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30">
                Submit & Sync Schedule
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: VENUES MANAGEMENT --- */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">Venue Management & Warmup Buffers</h2>
              {role === 'admin' && (
                <button onClick={() => { setEditingVenue(null); setVenueFormData({ name: '', type: 'Outdoor Turf', capacity: 2000, sport: 'Multi-Sport' }); setShowVenueModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                  + Add Venue
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {venues.map(v => (
                <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{v.name}</h3>
                    <p className="text-xs text-indigo-400 mb-3">{v.type} • Capacity: {v.capacity}</p>
                    <p className="text-xs text-slate-400">Sports: {v.sport}</p>
                  </div>
                  {role === 'admin' && (
                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end space-x-2">
                      <button onClick={() => { setEditingVenue(v); setVenueFormData(v); setShowVenueModal(true); }} className="p-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"><Edit3 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteVenue(v.id)} className="p-1.5 bg-slate-800 text-rose-400 rounded-lg text-xs"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VIEW: OPPONENTS DIRECTORY --- */}
        {activeTab === 'opponents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">Master Opponents Directory</h2>
              <button onClick={() => setShowOpponentModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">+ Add Opponent</button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                    <th className="pb-3">Opponent</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Distance</th>
                    <th className="pb-3">Conference (Yes/No)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {opponents.map((o, idx) => (
                    <tr key={o.id || idx} className="hover:bg-slate-900/40">
                      <td className="py-4 font-bold text-white">{o.name}</td>
                      <td className="py-4 text-slate-300">{o.location || 'N/A'}</td>
                      <td className="py-4 font-mono text-slate-300">{o.distance} mi</td>
                      <td className="py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${o.isConference ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>{o.isConference ? 'Yes (Conference)' : 'No (Non-Conf)'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: BUDGET --- */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 uppercase">Transportation</p>
                <h3 className="text-2xl font-bold text-white mt-1">${budgetSummary.totalTravel.toLocaleString()}</h3>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 uppercase">Meals & Per Diem</p>
                <h3 className="text-2xl font-bold text-white mt-1">${budgetSummary.totalMeals.toLocaleString()}</h3>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 uppercase">Hotel Lodging</p>
                <h3 className="text-2xl font-bold text-white mt-1">${budgetSummary.totalHotel.toLocaleString()}</h3>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 bg-indigo-950/20">
                <p className="text-xs text-indigo-300 uppercase">Grand Total</p>
                <h3 className="text-2xl font-bold text-indigo-400 mt-1">${budgetSummary.grandTotal.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Budget Breakdown by Sport</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                      <th className="pb-3">Sport</th>
                      <th className="pb-3">Contests</th>
                      <th className="pb-3">Transport</th>
                      <th className="pb-3">Meals</th>
                      <th className="pb-3">Hotel</th>
                      <th className="pb-3">Hosting</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {Object.entries(budgetSummary.bySport).map(([sportName, data]) => {
                      const sportTotal = data.travel + data.meals + data.hotel + data.hosting;
                      return (
                        <tr key={sportName} className="hover:bg-slate-900/40">
                          <td className="py-4 font-bold text-white">{sportName}</td>
                          <td className="py-4 text-slate-300">{data.count}</td>
                          <td className="py-4 font-mono text-slate-300">${data.travel.toLocaleString()}</td>
                          <td className="py-4 font-mono text-slate-300">${data.meals.toLocaleString()}</td>
                          <td className="py-4 font-mono text-slate-300">${data.hotel.toLocaleString()}</td>
                          <td className="py-4 font-mono text-slate-300">${data.hosting.toLocaleString()}</td>
                          <td className="py-4 text-right font-mono font-bold text-emerald-400">${sportTotal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: TOURNAMENTS & POSTSEASON --- */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">Tournament & Postseason Manager</h2>
              <p className="text-xs text-slate-400 mb-6">Manage multi-day tournament hosting and tentative unconfirmed postseason slots (Lowest-level conflict alert level).</p>
              
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-indigo-400">Tentative Postseason Placeholder Generator</h3>
                <p className="text-xs text-slate-300">Generate tentative postseason slots for qualifying teams that automatically flag as lowest-level warning alerts in the conflict engine.</p>
                <button onClick={() => {
                  setFormData({
                    ...formData,
                    locationType: 'Postseason',
                    opponent: 'TBD (Postseason Qualifier)',
                    notes: 'Tentative unconfirmed postseason slot'
                  });
                  setActiveTab('submit');
                }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                  Create Tentative Postseason Slot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: CONFLICTS --- */}
        {activeTab === 'conflicts' && role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">Conflict Queue</h2>
            </div>
            <div className="space-y-4">
              {activeConflictsList.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No Conflicts Detected</h3>
                </div>
              ) : (
                activeConflictsList.map(conf => (
                  <div key={conf.id} className="bg-slate-950 border border-rose-950 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">Critical Clash</span>
                      <h3 className="text-base font-bold text-white mt-1">{conf.title}</h3>
                      <p className="text-xs text-slate-300 mt-1">{conf.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      <footer className="bg-slate-950 border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-500">
        Gryphon Athletics Department • Master Operations & Budget Engine
      </footer>

    </div>
  );
}
