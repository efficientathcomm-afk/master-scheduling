import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, DollarSign, Users, Shield, AlertTriangle, 
  CheckCircle, XCircle, Plus, Filter, Search, ChevronRight, Download, 
  Bus, Utensils, Award, FileText, Settings, RefreshCw, Layers, Check, X,
  Grid, Globe, Compass, Briefcase, Eye, Edit3, Trash2, Cloud, CloudOff
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';

// --- FIREBASE INITIALIZATION (Following Mandatory Rules) ---
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

// --- MOCK FALLBACK DATA ---
const INITIAL_VENUES = [
  { id: 'v1', name: 'Alumni Memorial Stadium', type: 'Outdoor Turf', capacity: 5000, sport: 'Football / Lacrosse / Soccer' },
  { id: 'v2', name: 'Main Arena (Gryphon Center)', type: 'Indoor Court', capacity: 3200, sport: 'Basketball / Volleyball' },
  { id: 'v3', name: 'Varsity Soccer Pitch', type: 'Grass Field', capacity: 1500, sport: 'Soccer' },
  { id: 'v4', name: 'Aquatics & Natatorium', type: 'Pool', capacity: 600, sport: 'Swimming & Diving' },
  { id: 'v5', name: 'Baseball & Softball Diamond', type: 'Field', capacity: 1000, sport: 'Baseball / Softball' }
];

const INITIAL_SPORT_CONFIGS = {
  'Football': { defaultVenueId: 'v1', defaultDuration: 3.5, warmupMinutes: 90, teardownMinutes: 60, tier: 'Tier 1 (Revenue)' },
  'Men\'s Basketball': { defaultVenueId: 'v2', defaultDuration: 2.5, warmupMinutes: 60, teardownMinutes: 45, tier: 'Tier 1 (Revenue)' },
  'Women\'s Basketball': { defaultVenueId: 'v2', defaultDuration: 2.5, warmupMinutes: 60, teardownMinutes: 45, tier: 'Tier 1 (Revenue)' },
  'Men\'s Soccer': { defaultVenueId: 'v3', defaultDuration: 2.0, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2' },
  'Women\'s Soccer': { defaultVenueId: 'v3', defaultDuration: 2.0, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2' },
  'Volleyball': { defaultVenueId: 'v2', defaultDuration: 2.0, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2' },
  'Baseball': { defaultVenueId: 'v5', defaultDuration: 3.0, warmupMinutes: 60, teardownMinutes: 45, tier: 'Tier 2' },
  'Softball': { defaultVenueId: 'v5', defaultDuration: 2.5, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 2' },
  'Lacrosse': { defaultVenueId: 'v1', defaultDuration: 2.5, warmupMinutes: 45, teardownMinutes: 30, tier: 'Tier 3' },
  'Swimming': { defaultVenueId: 'v4', defaultDuration: 2.5, warmupMinutes: 30, teardownMinutes: 30, tier: 'Tier 3' }
};

const INITIAL_OPPONENTS = [
  { id: 'opp-1', name: 'State Tech University', distanceMiles: 140, tier: 'Division I', defaultLodgingNeeded: false },
  { id: 'opp-2', name: 'Coastal College', distanceMiles: 450, tier: 'Division I', defaultLodgingNeeded: true },
  { id: 'opp-3', name: 'Metro State University', distanceMiles: 80, tier: 'Division I', defaultLodgingNeeded: false },
  { id: 'opp-4', name: 'Northern Polytechnic', distanceMiles: 620, tier: 'Division I', defaultLodgingNeeded: true },
  { id: 'opp-5', name: 'Cascade Valley College', distanceMiles: 210, tier: 'Division II', defaultLodgingNeeded: false }
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
    mealCost: 800,
    hostingCost: 3500,
    overnightTravel: false,
    status: 'Approved',
    notes: 'Season opener home game'
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Connecting...');

  // Application State
  const [role, setRole] = useState('admin'); // 'admin' | 'coach'
  const [currentUserSport, setCurrentUserSport] = useState('Football');
  const [schedules, setSchedules] = useState([]);
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [opponents, setOpponents] = useState(INITIAL_OPPONENTS);
  const [sportConfigs, setSportConfigs] = useState(INITIAL_SPORT_CONFIGS);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'calendar', 'matrix', 'submit', 'venues', 'opponents', 'budget', 'conflicts'
  
  // Modal states
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [newOpponentData, setNewOpponentData] = useState({ name: '', distanceMiles: 100, tier: 'Division I', defaultLodgingNeeded: false });

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
    mealCost: 800,
    hostingCost: 3500,
    overnightTravel: false,
    notes: ''
  });

  const [notification, setNotification] = useState(null);

  // --- 1. FIREBASE AUTHENTICATION EFFECT ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. FIRESTORE REAL-TIME SYNC EFFECT ---
  useEffect(() => {
    if (!user) return;

    // Public collection path as mandated by rules
    const eventsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const opponentsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'opponents');

    setSyncStatus('Syncing Live');

    const unsubscribeEvents = onSnapshot(eventsCollectionRef, 
      (snapshot) => {
        const loadedEvents = [];
        snapshot.forEach(docSnap => {
          loadedEvents.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (loadedEvents.length > 0) {
          setSchedules(loadedEvents);
        } else {
          // If empty in Firestore, seed initial mock data
          INITIAL_SCHEDULES.forEach(async (initItem) => {
            await addDoc(eventsCollectionRef, initItem);
          });
        }
        setSyncStatus('Synced');
      },
      (error) => {
        console.error("Firestore events sync error:", error);
        setSyncStatus('Sync Error');
      }
    );

    const unsubscribeOpponents = onSnapshot(opponentsCollectionRef, 
      (snapshot) => {
        const loadedOpponents = [];
        snapshot.forEach(docSnap => {
          loadedOpponents.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (loadedOpponents.length > 0) {
          setOpponents(loadedOpponents);
        }
      },
      (error) => {
        console.error("Firestore opponents sync error:", error);
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeOpponents();
    };
  }, [user]);

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sport preset handler
  const handleSportChange = (selectedSport) => {
    const config = sportConfigs[selectedSport];
    if (config) {
      setFormData(prev => ({
        ...prev,
        sport: selectedSport,
        venueId: config.defaultVenueId,
        durationHours: config.defaultDuration,
        warmupMinutes: config.warmupMinutes,
        teardownMinutes: config.teardownMinutes
      }));
    } else {
      setFormData(prev => ({ ...prev, sport: selectedSport }));
    }
  };

  // Opponent change handler & automated budgeting
  const handleOpponentChange = (oppName) => {
    const oppObj = opponents.find(o => o.name === oppName);
    const isAwayOrNeutral = formData.locationType === 'Away' || formData.locationType === 'Neutral' || formData.locationType === 'Tournament';
    
    let estTravel = 0;
    let estMeals = 500;
    let overnight = false;

    if (oppObj) {
      overnight = oppObj.defaultLodgingNeeded;
      if (isAwayOrNeutral) {
        estTravel = Math.round(oppObj.distanceMiles * 3.2 + (overnight ? 1800 : 400));
        estMeals = overnight ? 1200 : 450;
      }
    }

    setFormData(prev => ({
      ...prev,
      opponent: oppName,
      overnightTravel: overnight,
      travelCost: estTravel,
      mealCost: estMeals
    }));
  };

  const handleLocationTypeChange = (locType) => {
    const isHome = locType === 'Home';
    const config = sportConfigs[formData.sport];
    
    setFormData(prev => ({
      ...prev,
      locationType: locType,
      venueId: isHome ? (config ? config.defaultVenueId : 'v1') : 'Away',
      hostingCost: isHome ? 3500 : 0
    }));
  };

  // Add new opponent to Firestore
  const handleAddOpponentSubmit = async (e) => {
    e.preventDefault();
    if (!newOpponentData.name || !user) return;
    try {
      const opponentsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'opponents');
      await addDoc(opponentsCollectionRef, newOpponentData);
      setShowOpponentModal(false);
      setNewOpponentData({ name: '', distanceMiles: 100, tier: 'Division I', defaultLodgingNeeded: false });
      showNotice(`Opponent "${newOpponentData.name}" added to master cloud directory.`);
    } catch (err) {
      console.error(err);
      showNotice('Failed to save opponent', 'error');
    }
  };

  // --- ADVANCED CONFLICT ENGINE WITH WARMUP BUFFERS & SPORT TIERS ---
  const checkConflictsForEvent = (newEvent, existingList, ignoreId = null) => {
    const conflicts = [];
    const isTentative = newEvent.locationType === 'Postseason' && newEvent.status === 'Tentative';

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
            level: isTentative ? 1 : 3,
            message: `Venue Double-Booking (Warmup/Teardown Clash): Venue is already booked by ${item.sport} vs ${item.opponent} on this date/time window.`
          });
        } else if (newEvent.sport === item.sport) {
          conflicts.push({
            type: 'CAUTION',
            level: 2,
            message: `Sport/Coach Overlap: ${newEvent.sport} has another overlapping event scheduled against ${item.opponent}.`
          });
        }
      }
    });

    return conflicts;
  };

  // Submit schedule to Firestore
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.opponent || !formData.date || !user) {
      showNotice('Please fill in required fields.', 'error');
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
      const eventsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
      await addDoc(eventsCollectionRef, newRecord);
      showNotice(conflicts.length > 0 ? 'Submitted with conflict warning notes.' : 'Schedule submitted to cloud successfully!', conflicts.length > 0 ? 'warning' : 'success');
      setActiveTab(role === 'admin' ? 'dashboard' : 'calendar');
    } catch (err) {
      console.error(err);
      showNotice('Error saving schedule to cloud', 'error');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', id);
      await updateDoc(docRef, { status: newStatus });
      showNotice(`Schedule status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      showNotice('Error updating status', 'error');
    }
  };

  const deleteSchedule = async (id) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', id);
      await deleteDoc(docRef);
      showNotice('Schedule entry removed.');
    } catch (err) {
      console.error(err);
      showNotice('Error deleting entry', 'error');
    }
  };

  // --- BUDGET CALCULATIONS ---
  const budgetSummary = useMemo(() => {
    let totalTravel = 0;
    let totalMeals = 0;
    let totalHosting = 0;
    const bySport = {};

    schedules.forEach(s => {
      if (s.status === 'Rejected') return;
      const t = Number(s.travelCost || 0);
      const m = Number(s.mealCost || 0);
      const h = Number(s.hostingCost || 0);

      totalTravel += t;
      totalMeals += m;
      totalHosting += h;

      if (!bySport[s.sport]) {
        bySport[s.sport] = { travel: 0, meals: 0, hosting: 0, count: 0 };
      }
      bySport[s.sport].travel += t;
      bySport[s.sport].meals += m;
      bySport[s.sport].hosting += h;
      bySport[s.sport].count += 1;
    });

    return { totalTravel, totalMeals, totalHosting, grandTotal: totalTravel + totalMeals + totalHosting, bySport };
  }, [schedules]);

  const displayedSchedules = useMemo(() => {
    if (role === 'coach') {
      return schedules.filter(s => s.sport === currentUserSport);
    }
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
              type: 'CRITICAL',
              title: `Double Booked Venue: ${ev1.venueName}`,
              desc: `${ev1.sport} (${ev1.opponent}) clashes with ${ev2.sport} (${ev2.opponent}) on ${ev1.date} at ${ev1.time}`
            });
          }
        }
      }
    }
    return list;
  }, [schedules]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-white transition-all transform animate-bounce ${
          notification.type === 'error' ? 'bg-rose-600' : notification.type === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
        }`}>
          {notification.type === 'error' ? <XCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      {/* Add Opponent Modal */}
      {showOpponentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Add Opponent to Cloud Master Directory</h3>
            <p className="text-xs text-slate-400 mb-4">Populate distance and tier to automate travel & lodging budget calculations.</p>
            
            <form onSubmit={handleAddOpponentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Institution / Opponent Name</label>
                <input 
                  type="text" 
                  required
                  value={newOpponentData.name}
                  onChange={(e) => setNewOpponentData({...newOpponentData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  placeholder="e.g. Pacific Coast University"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Distance (Miles)</label>
                  <input 
                    type="number" 
                    value={newOpponentData.distanceMiles}
                    onChange={(e) => setNewOpponentData({...newOpponentData, distanceMiles: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Athletic Tier</label>
                  <select 
                    value={newOpponentData.tier}
                    onChange={(e) => setNewOpponentData({...newOpponentData, tier: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Division I">Division I</option>
                    <option value="Division II">Division II</option>
                    <option value="Division III">Division III</option>
                    <option value="NAIA / Other">NAIA / Other</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="defaultLodging"
                  checked={newOpponentData.defaultLodgingNeeded}
                  onChange={(e) => setNewOpponentData({...newOpponentData, defaultLodgingNeeded: e.target.checked})}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-950 border-slate-700"
                />
                <label htmlFor="defaultLodging" className="text-xs text-slate-300">Requires Overnight Lodging by Default</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowOpponentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Opponent
                </button>
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
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Gryphon Athletics Master Schedule & Budget System
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-2">
              <span>Collegiate Athletic Operations & Venue Conflict Engine</span>
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
            <button 
              onClick={() => { setRole('admin'); setActiveTab('dashboard'); }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Admin View
            </button>
            <button 
              onClick={() => { setRole('coach'); setActiveTab('calendar'); }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${role === 'coach' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Coach Portal
            </button>
          </div>

          {role === 'coach' && (
            <select 
              value={currentUserSport} 
              onChange={(e) => setCurrentUserSport(e.target.value)}
              className="bg-slate-950 text-xs border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {Object.keys(sportConfigs).map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2 flex items-center space-x-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeTab === 'dashboard' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeTab === 'calendar' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Master Calendar</span>
        </button>

        <button 
          onClick={() => setActiveTab('matrix')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeTab === 'matrix' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Venue Side-by-Side Matrix</span>
        </button>

        <button 
          onClick={() => setActiveTab('submit')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeTab === 'submit' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{role === 'admin' ? 'Add Schedule Entry' : 'Submit Schedule'}</span>
        </button>

        <button 
          onClick={() => setActiveTab('venues')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeTab === 'venues' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Venues & Buffers</span>
        </button>

        <button 
          onClick={() => setActiveTab('opponents')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeTab === 'opponents' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Master Opponents</span>
        </button>

        <button 
          onClick={() => setActiveTab('budget')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${activeTab === 'budget' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Budget Projections</span>
        </button>

        {role === 'admin' && (
          <button 
            onClick={() => setActiveTab('conflicts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 relative ${activeTab === 'conflicts' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Conflict Queue</span>
            {activeConflictsList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeConflictsList.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Content Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* --- VIEW: DASHBOARD OVERVIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Contests</p>
                    <h3 className="text-2xl font-bold mt-1 text-white">{schedules.length}</h3>
                  </div>
                  <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400"><Calendar className="w-5 h-5" /></div>
                </div>
                <div className="mt-4 flex items-center text-xs text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  <span>{schedules.filter(s => s.status === 'Approved').length} Approved / {schedules.filter(s => s.status === 'Tentative').length} Tentative</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Clashes</p>
                    <h3 className="text-2xl font-bold mt-1 text-rose-400">{activeConflictsList.length}</h3>
                  </div>
                  <div className="p-3 bg-rose-600/10 rounded-xl text-rose-400"><AlertTriangle className="w-5 h-5" /></div>
                </div>
                <div className="mt-4 flex items-center text-xs text-slate-400"><span>Including Warmup Buffer Rules</span></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected Budget</p>
                    <h3 className="text-2xl font-bold mt-1 text-emerald-400">${budgetSummary.grandTotal.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-400"><DollarSign className="w-5 h-5" /></div>
                </div>
                <div className="mt-4 flex items-center text-xs text-slate-400"><span>Travel, Meals, Hosting & Officials</span></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Opponents</p>
                    <h3 className="text-2xl font-bold mt-1 text-indigo-400">{opponents.length}</h3>
                  </div>
                  <div className="p-3 bg-violet-600/10 rounded-xl text-violet-400"><Globe className="w-5 h-5" /></div>
                </div>
                <div className="mt-4 flex items-center text-xs text-slate-400"><span>Cloud Directory Connected</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Recent Master Submissions (Real-Time Synced)</span>
                  </h3>
                  <button onClick={() => setActiveTab('calendar')} className="text-xs font-semibold text-indigo-400 hover:underline">View All &rarr;</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Sport</th>
                        <th className="pb-3 font-semibold">Opponent</th>
                        <th className="pb-3 font-semibold">Date & Time</th>
                        <th className="pb-3 font-semibold">Location / Type</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {schedules.slice(0, 5).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-900/40">
                          <td className="py-3 font-bold text-white">{item.sport}</td>
                          <td className="py-3 text-slate-200">{item.opponent}</td>
                          <td className="py-3 text-slate-300 text-xs">
                            <div>{item.date}</div>
                            <div className="text-slate-400">{item.time}</div>
                          </td>
                          <td className="py-3 text-xs">
                            <span className={`px-2.5 py-0.5 rounded-full font-medium ${item.locationType === 'Home' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                              {item.locationType} - {item.venueName}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                              item.status === 'Tentative' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                              item.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conflict Status Panel */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Warmup Buffer & Conflict Monitor</span>
                  </h3>
                  
                  {activeConflictsList.length === 0 ? (
                    <div className="py-8 text-center bg-slate-900/50 rounded-xl border border-slate-800">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-white">All Clear!</p>
                      <p className="text-xs text-slate-400 mt-1">No double bookings or pregame warmup clashes detected.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {activeConflictsList.map(conf => (
                        <div key={conf.id} className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs space-y-1">
                          <div className="font-bold text-rose-400 flex items-center"><XCircle className="w-3.5 h-3.5 mr-1.5" />{conf.title}</div>
                          <p className="text-slate-300">{conf.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button onClick={() => setActiveTab('submit')} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20">
                    + Add New Schedule Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: MASTER CALENDAR --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div>
                <h2 className="text-lg font-bold text-white">{role === 'coach' ? `${currentUserSport} Team Schedule` : 'Master Department Schedule'}</h2>
                <p className="text-xs text-slate-400">Includes single source of truth for home venues, overnight travel, and postseason tentative slots.</p>
              </div>
              <button onClick={() => setActiveTab('matrix')} className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <Grid className="w-4 h-4" />
                <span>Switch to Side-by-Side Matrix</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Sport & Coach</th>
                    <th className="pb-3 font-semibold">Opponent</th>
                    <th className="pb-3 font-semibold">Date & Time (Warmup)</th>
                    <th className="pb-3 font-semibold">Venue / Type</th>
                    <th className="pb-3 font-semibold">Travel / Lodging</th>
                    <th className="pb-3 font-semibold">Budget</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {displayedSchedules.length === 0 ? (
                    <tr><td colSpan="8" className="py-8 text-center text-slate-500">No schedule entries found.</td></tr>
                  ) : (
                    displayedSchedules.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-900/40">
                        <td className="py-4">
                          <div className="font-bold text-white">{item.sport}</div>
                          <div className="text-xs text-slate-400">{item.coachName}</div>
                        </td>
                        <td className="py-4 font-medium text-slate-200">{item.opponent}</td>
                        <td className="py-4 text-xs">
                          <div className="font-semibold text-slate-200">{item.date} @ {item.time}</div>
                          <div className="text-slate-400">Warmup: {item.warmupMinutes || 45} mins prior</div>
                        </td>
                        <td className="py-4 text-xs">
                          <span className={`px-2.5 py-1 rounded-full font-medium ${item.locationType === 'Home' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-300'}`}>
                            {item.locationType}: {item.venueName}
                          </span>
                        </td>
                        <td className="py-4 text-xs">
                          {item.overnightTravel ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">Overnight Stay</span>
                          ) : (
                            <span className="text-slate-400">Day Trip</span>
                          )}
                        </td>
                        <td className="py-4 text-xs font-mono text-emerald-400">
                          ${(Number(item.travelCost) + Number(item.mealCost) + Number(item.hostingCost)).toLocaleString()}
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            item.status === 'Tentative' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                            item.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 text-right space-x-2">
                          {role === 'admin' && item.id && (
                            <>
                              {item.status !== 'Approved' && (
                                <button onClick={() => updateStatus(item.id, 'Approved')} className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg">
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {item.status !== 'Rejected' && (
                                <button onClick={() => updateStatus(item.id, 'Rejected')} className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-lg">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          {item.id && (
                            <button onClick={() => deleteSchedule(item.id)} className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* --- VIEW: SIDE-BY-SIDE VENUE MATRIX --- */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">Side-by-Side Venue Matrix & Composite Schedule</h2>
              <p className="text-xs text-slate-400">Concurrent view of all campus venues and facility utilization across dates.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {venues.map(v => {
                const venueEvents = schedules.filter(s => s.venueId === v.id && s.status !== 'Rejected');
                return (
                  <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-slate-800 pb-3 mb-3">
                        <h3 className="text-sm font-bold text-white truncate">{v.name}</h3>
                        <p className="text-[11px] text-indigo-400">{v.type} • Cap: {v.capacity}</p>
                      </div>

                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {venueEvents.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-6 text-center">No events assigned.</p>
                        ) : (
                          venueEvents.map((ev, i) => (
                            <div key={ev.id || i} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-indigo-300">{ev.sport}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ev.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {ev.status}
                                </span>
                              </div>
                              <div className="text-slate-200 font-medium">vs {ev.opponent}</div>
                              <div className="text-slate-400 text-[11px] flex items-center pt-1">
                                <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                                {ev.date} @ {ev.time}
                              </div>
                              <div className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mt-1">
                                Warmup: {ev.warmupMinutes || 45}m prior
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
                      {venueEvents.length} Active Bookings
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: SUBMIT / ADD SCHEDULE ENTRY --- */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-sm">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">{role === 'admin' ? 'Add Master Schedule Entry' : 'Submit Schedule Request'}</h2>
                <p className="text-xs text-slate-400 mt-1">Auto-populates sport defaults, warmup buffers, and automated budget projections.</p>
              </div>
              <button onClick={() => setShowOpponentModal(true)} className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold">
                + New Opponent
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sport / Program</label>
                  {role === 'admin' ? (
                    <select 
                      value={formData.sport} 
                      onChange={(e) => handleSportChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      {Object.keys(sportConfigs).map(sp => <option key={sp} value={sp}>{sp}</option>)}
                    </select>
                  ) : (
                    <input type="text" disabled value={currentUserSport} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Coach / Submitter</label>
                  <input 
                    type="text" 
                    value={formData.coachName} 
                    onChange={(e) => setFormData({...formData, coachName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Opponent (from Cloud Directory)</label>
                  <select 
                    value={formData.opponent} 
                    onChange={(e) => handleOpponentChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {opponents.map(o => <option key={o.id} value={o.name}>{o.name} ({o.distanceMiles} mi)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location Type</label>
                  <select 
                    value={formData.locationType} 
                    onChange={(e) => handleLocationTypeChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Home">Home Contest</option>
                    <option value="Away">Away Contest</option>
                    <option value="Neutral">Neutral Site</option>
                    <option value="Tournament">Tournament Hosting / Participation</option>
                    <option value="Postseason">Postseason (Tentative)</option>
                  </select>
                </div>
              </div>

              {formData.locationType === 'Home' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Home Venue (with Warmup Buffer)</label>
                  <select 
                    value={formData.venueId} 
                    onChange={(e) => setFormData({...formData, venueId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                  <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Hours)</label>
                  <input type="number" step="0.5" value={formData.durationHours} onChange={(e) => setFormData({...formData, durationHours: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pregame Warmup Buffer (Minutes)</label>
                  <input type="number" value={formData.warmupMinutes} onChange={(e) => setFormData({...formData, warmupMinutes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Postgame Teardown Buffer (Minutes)</label>
                  <input type="number" value={formData.teardownMinutes} onChange={(e) => setFormData({...formData, teardownMinutes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>

              {/* Automated Budget Estimator Box */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Automated Budget Projections</h3>
                  <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                    <input type="checkbox" checked={formData.overnightTravel} onChange={(e) => setFormData({...formData, overnightTravel: e.target.checked})} className="rounded text-indigo-600 w-4 h-4 bg-slate-950 border-slate-700" />
                    <span>Overnight Travel / Lodging Required</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Transportation ($)</label>
                    <input type="number" value={formData.travelCost} onChange={(e) => setFormData({...formData, travelCost: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Meals & Lodging ($)</label>
                    <input type="number" value={formData.mealCost} onChange={(e) => setFormData({...formData, mealCost: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Hosting / Officials ($)</label>
                    <input type="number" value={formData.hostingCost} onChange={(e) => setFormData({...formData, hostingCost: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Operational Notes</label>
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="Broadcast requirements, security detail, multi-game tournament notes..."></textarea>
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2">
                <span>Submit Schedule & Sync to Cloud</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: VENUE MANAGEMENT & BUFFERS --- */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">Athletic Venues & Warmup Buffer Settings</h2>
              <p className="text-xs text-slate-400">Strict venue allocation rules with pregame warmup and postgame teardown buffers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map(v => {
                const venueBookings = schedules.filter(s => s.venueId === v.id && s.status !== 'Rejected');
                return (
                  <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-bold text-white">{v.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">Cap: {v.capacity}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">{v.type} • Sports: {v.sport}</p>
                      
                      <div className="border-t border-slate-800 pt-3">
                        <p className="text-xs font-semibold text-slate-400 mb-2">Upcoming Events ({venueBookings.length}):</p>
                        {venueBookings.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No scheduled events at this venue.</p>
                        ) : (
                          <div className="space-y-2 max-h-36 overflow-y-auto">
                            {venueBookings.map((vb, i) => (
                              <div key={vb.id || i} className="text-xs bg-slate-900 p-2 rounded-lg flex justify-between items-center">
                                <div>
                                  <span className="font-bold text-slate-200">{vb.sport}</span> vs {vb.opponent}
                                  <div className="text-slate-400">{vb.date} @ {vb.time}</div>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">{vb.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                      <span>Status: <strong className="text-emerald-400">Operational</strong></span>
                      <span className="text-indigo-400 font-semibold">{v.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: MASTER OPPONENTS DIRECTORY --- */}
        {activeTab === 'opponents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div>
                <h2 className="text-lg font-bold text-white">Master Opponents Directory (Cloud Synced)</h2>
                <p className="text-xs text-slate-400">Manage institutional opponents, travel distances, and default lodging profiles.</p>
              </div>
              <button onClick={() => setShowOpponentModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5">
                <Plus className="w-4 h-4" />
                <span>Add Opponent</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Institution Name</th>
                    <th className="pb-3 font-semibold">Athletic Tier</th>
                    <th className="pb-3 font-semibold">Distance (Miles)</th>
                    <th className="pb-3 font-semibold">Overnight Lodging Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {opponents.map((o, idx) => (
                    <tr key={o.id || idx} className="hover:bg-slate-900/40">
                      <td className="py-4 font-bold text-white">{o.name}</td>
                      <td className="py-4 text-slate-300">{o.tier}</td>
                      <td className="py-4 text-slate-300 font-mono">{o.distanceMiles} mi</td>
                      <td className="py-4">
                        {o.defaultLodgingNeeded ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Required</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">Day Trip</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW: BUDGET PROJECTIONS --- */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Transportation</p>
                <h3 className="text-2xl font-bold text-white mt-1">${budgetSummary.totalTravel.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2 flex items-center"><Bus className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Bus charters & travel</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Meals & Lodging</p>
                <h3 className="text-2xl font-bold text-white mt-1">${budgetSummary.totalMeals.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2 flex items-center"><Utensils className="w-3.5 h-3.5 mr-1 text-amber-400" /> Overnight per diems & hotels</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Hosting Costs</p>
                <h3 className="text-2xl font-bold text-white mt-1">${budgetSummary.totalHosting.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2 flex items-center"><Award className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Officials, EMS, game staff</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-slate-950">
                <p className="text-xs text-indigo-300 font-semibold uppercase">Grand Total Budget</p>
                <h3 className="text-2xl font-bold text-indigo-400 mt-1">${budgetSummary.grandTotal.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2">Aggregated Department Financials</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-white mb-4">Budget Breakdown by Sport Program</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Sport Program</th>
                      <th className="pb-3 font-semibold">Total Contests</th>
                      <th className="pb-3 font-semibold">Transportation</th>
                      <th className="pb-3 font-semibold">Meals & Lodging</th>
                      <th className="pb-3 font-semibold">Hosting / Officials</th>
                      <th className="pb-3 font-semibold text-right">Combined Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {Object.entries(budgetSummary.bySport).map(([sportName, data]) => {
                      const sportTotal = data.travel + data.meals + data.hosting;
                      return (
                        <tr key={sportName} className="hover:bg-slate-900/40">
                          <td className="py-4 font-bold text-white">{sportName}</td>
                          <td className="py-4 text-slate-300">{data.count}</td>
                          <td className="py-4 text-slate-300 font-mono">${data.travel.toLocaleString()}</td>
                          <td className="py-4 text-slate-300 font-mono">${data.meals.toLocaleString()}</td>
                          <td className="py-4 text-slate-300 font-mono">${data.hosting.toLocaleString()}</td>
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

        {/* --- VIEW: CONFLICT RESOLUTION QUEUE --- */}
        {activeTab === 'conflicts' && role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white">Admin Conflict Queue & Sport Tier Rules</h2>
              <p className="text-xs text-slate-400">Composite venue double bookings including warmup and teardown buffers.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeConflictsList.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No Conflicts in Queue</h3>
                  <p className="text-xs text-slate-400 mt-1">Master schedule is currently fully harmonized.</p>
                </div>
              ) : (
                activeConflictsList.map(conf => (
                  <div key={conf.id} className="bg-slate-950 border border-rose-950 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-rose-600/10 text-rose-400 rounded-xl mt-0.5"><AlertTriangle className="w-6 h-6" /></div>
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider">Critical Clash</span>
                        <h3 className="text-base font-bold text-white mt-1">{conf.title}</h3>
                        <p className="text-xs text-slate-300 mt-1">{conf.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('matrix')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">
                      Inspect Venue Matrix
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      <footer className="bg-slate-950 border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-500">
        Gryphon Athletics Department • Master Operations & Budget Engine (Real-Time Cloud Synced)
      </footer>

    </div>
  );
}
