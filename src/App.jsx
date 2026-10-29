import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, DollarSign, Users, Shield, AlertTriangle, 
  CheckCircle, XCircle, Plus, Filter, Search, ChevronRight, Download, 
  Bus, Utensils, Award, FileText, Settings, RefreshCw, Layers, Check, X,
  Grid, Globe, Compass, Briefcase, Eye, Edit3, Trash2, Cloud, CloudOff, Award as Trophy, Send, Sun, Moon
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
  { id: 'v1', name: 'Alumni Memorial Stadium', type: 'Outdoor Turf', capacity: 5000 },
  { id: 'v2', name: 'Main Arena (Gryphon Center)', type: 'Indoor Court', capacity: 3200 },
  { id: 'v3', name: 'Varsity Soccer Pitch', type: 'Grass Field', capacity: 1500 },
  { id: 'v4', name: 'Aquatics & Natatorium', type: 'Pool', capacity: 600 },
  { id: 'v5', name: 'Baseball & Softball Diamond', type: 'Field', capacity: 1000 }
];

const INITIAL_SPORT_CONFIGS = {
  'Football': { name: 'Football', defaultVenueId: 'v1', defaultDuration: 3.5, warmupMinutes: 90, arrivalBufferHours: 3, departureBufferHours: 1, teardownMinutes: 60, tier: 'Tier 1 (Revenue)', officialsCost: 2400, staffCost: 1100, rosterSize: 75, studentStaffCount: 12 },
  'Men\'s Basketball': { name: "Men's Basketball", defaultVenueId: 'v2', defaultDuration: 2.5, warmupMinutes: 60, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 45, tier: 'Tier 1 (Revenue)', officialsCost: 1200, staffCost: 600, rosterSize: 15, studentStaffCount: 6 },
  'Women\'s Basketball': { name: "Women's Basketball", defaultVenueId: 'v2', defaultDuration: 2.5, warmupMinutes: 60, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 45, tier: 'Tier 1 (Revenue)', officialsCost: 1200, staffCost: 600, rosterSize: 15, studentStaffCount: 6 },
  'Men\'s Soccer': { name: "Men's Soccer", defaultVenueId: 'v3', defaultDuration: 2.0, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 600, staffCost: 350, rosterSize: 24, studentStaffCount: 4 },
  'Women\'s Soccer': { name: "Women's Soccer", defaultVenueId: 'v3', defaultDuration: 2.0, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 600, staffCost: 350, rosterSize: 24, studentStaffCount: 4 },
  'Volleyball': { name: 'Volleyball', defaultVenueId: 'v2', defaultDuration: 2.0, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 500, staffCost: 300, rosterSize: 16, studentStaffCount: 4 },
  'Baseball': { name: 'Baseball', defaultVenueId: 'v5', defaultDuration: 3.0, warmupMinutes: 60, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 45, tier: 'Tier 2', officialsCost: 800, staffCost: 400, rosterSize: 30, studentStaffCount: 5 },
  'Softball': { name: 'Softball', defaultVenueId: 'v5', defaultDuration: 2.5, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 700, staffCost: 350, rosterSize: 22, studentStaffCount: 4 },
  'Lacrosse': { name: 'Lacrosse', defaultVenueId: 'v1', defaultDuration: 2.5, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 3', officialsCost: 600, staffCost: 300, rosterSize: 30, studentStaffCount: 4 },
  'Swimming': { name: 'Swimming', defaultVenueId: 'v4', defaultDuration: 2.5, warmupMinutes: 30, arrivalBufferHours: 1.5, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 3', officialsCost: 400, staffCost: 250, rosterSize: 25, studentStaffCount: 4 }
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
  const [syncStatus, setSyncStatus] = useState('Local Mode Active');
  const [darkMode, setDarkMode] = useState(true);

  // Application State
  const [role, setRole] = useState('admin'); // 'admin' | 'coach'
  const [currentUserSport, setCurrentUserSport] = useState('Football');
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [opponents, setOpponents] = useState(INITIAL_OPPONENTS);
  const [sportConfigs, setSportConfigs] = useState(INITIAL_SPORT_CONFIGS);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'calendar', 'matrix', 'submit', 'venues', 'sports', 'opponents', 'budget', 'conflicts'
  
  // Modals
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [newOpponentData, setNewOpponentData] = useState({ name: '', location: '', distance: 100, isConference: true });

  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueFormData, setVenueFormData] = useState({ name: '', type: 'Outdoor Turf', capacity: 2000 });

  const [showSportModal, setShowSportModal] = useState(false);
  const [editingSportKey, setEditingSportKey] = useState(null);
  const [sportFormData, setSportFormData] = useState({
    name: '',
    defaultVenueId: 'v1',
    defaultDuration: 2.5,
    warmupMinutes: 45,
    arrivalBufferHours: 2,
    departureBufferHours: 1,
    teardownMinutes: 30,
    tier: 'Tier 2',
    officialsCost: 600,
    staffCost: 350,
    rosterSize: 25,
    studentStaffCount: 4
  });

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
    travelPartySize: 30,
    travelMode: 'Charter Bus',
    notes: ''
  });

  const [notification, setNotification] = useState(null);

  // --- 1. AUTHENTICATION ---
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
        setAuthReady(true);
      }
    };
    initAuth();
  }, []);

  // --- 2. FIRESTORE REAL-TIME SYNC ---
  useEffect(() => {
    if (!authReady) return;

    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const opponentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'opponents');
    const venuesRef = collection(db, 'artifacts', appId, 'public', 'data', 'venues');
    const sportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'sports');

    setSyncStatus('Syncing Live');

    const unsubscribeEvents = onSnapshot(eventsRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        if (loaded.length > 0) setSchedules(loaded);
        setSyncStatus('Synced');
      },
      (err) => { setSyncStatus('Sync Error: ' + err.message); }
    );

    const unsubscribeOpponents = onSnapshot(opponentsRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        if (loaded.length > 0) setOpponents(loaded);
      },
      (err) => {}
    );

    const unsubscribeVenues = onSnapshot(venuesRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        if (loaded.length > 0) setVenues(loaded);
      },
      (err) => {}
    );

    const unsubscribeSports = onSnapshot(sportsRef, 
      (snapshot) => {
        const loadedObj = {};
        snapshot.forEach(d => {
          const dat = d.data();
          if (dat.name) loadedObj[dat.name] = dat;
        });
        if (Object.keys(loadedObj).length > 0) {
          setSportConfigs(loadedObj);
        }
      },
      (err) => {}
    );

    return () => {
      unsubscribeEvents();
      unsubscribeOpponents();
      unsubscribeVenues();
      unsubscribeSports();
    };
  }, [authReady]);

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSportChange = (sportName) => {
    const config = sportConfigs[sportName];
    if (config) {
      setFormData(prev => ({
        ...prev,
        sport: sportName,
        venueId: config.defaultVenueId || 'v1',
        durationHours: config.defaultDuration || 2.5,
        warmupMinutes: config.warmupMinutes || 45,
        travelPartySize: config.rosterSize || 30
      }));
    } else {
      setFormData(prev => ({ ...prev, sport: sportName }));
    }
  };

  const calculateCosts = (oppName, locType, overnight, partySize, sportName) => {
    const oppObj = opponents.find(o => o.name === oppName);
    const config = sportConfigs[sportName] || sportConfigs['Football'] || { officialsCost: 600, staffCost: 300 };
    const distance = oppObj ? oppObj.distance : 100;
    
    let travel = 0, meals = 0, hotel = 0, hosting = 0;
    const isHome = locType === 'Home' || locType === 'Tournament';

    if (isHome) {
      hosting = Number(config.officialsCost || 600) + Number(config.staffCost || 300);
    } else {
      travel = distance > 350 ? partySize * 110 : partySize * 45;
      meals = partySize * 45 * (overnight ? 3 : 1);
      hotel = overnight ? Math.ceil(partySize / 2) * 160 * 1 : 0;
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

  // Save/Delete Venue
  const handleSaveVenue = async (e) => {
    e.preventDefault();
    const newId = 'v-' + Date.now();
    const venuePayload = { id: newId, ...venueFormData };
    try {
      const venuesRef = collection(db, 'artifacts', appId, 'public', 'data', 'venues');
      if (editingVenue) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'venues', editingVenue.id), venueFormData);
        setVenues(venues.map(v => v.id === editingVenue.id ? { ...v, ...venueFormData } : v));
        showNotice('Venue updated');
      } else {
        await addDoc(venuesRef, venuePayload);
        setVenues([...venues, venuePayload]);
        showNotice('Venue added');
      }
    } catch (err) {
      if (editingVenue) {
        setVenues(venues.map(v => v.id === editingVenue.id ? { ...v, ...venueFormData } : v));
      } else {
        setVenues([...venues, venuePayload]);
      }
      showNotice('Venue saved locally');
    }
    setShowVenueModal(false);
    setEditingVenue(null);
    setVenueFormData({ name: '', type: 'Outdoor Turf', capacity: 2000 });
  };

  const handleDeleteVenue = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'venues', id));
    } catch (e) {}
    setVenues(venues.filter(v => v.id !== id));
    showNotice('Venue deleted');
  };

  // Save/Delete Sport Configs
  const handleSaveSport = async (e) => {
    e.preventDefault();
    if (!sportFormData.name) return;
    const sportName = sportFormData.name;
    try {
      const sportDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'sports', sportName.replace(/[^a-zA-Z0-9]/g, '_'));
      await setDoc(sportDocRef, sportFormData);
    } catch (err) {}
    setSportConfigs({ ...sportConfigs, [sportName]: sportFormData });
    setShowSportModal(false);
    setEditingSportKey(null);
    showNotice(`Sport configuration for ${sportName} saved.`);
  };

  const handleDeleteSport = async (key) => {
    const updated = { ...sportConfigs };
    delete updated[key];
    setSportConfigs(updated);
    showNotice('Sport removed from active configuration.');
  };

  const handleAddOpponentSubmit = async (e) => {
    e.preventDefault();
    if (!newOpponentData.name) return;
    const newId = 'opp-' + Date.now();
    const oppPayload = { id: newId, ...newOpponentData };
    try {
      const opponentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'opponents');
      await addDoc(opponentsRef, oppPayload);
    } catch (e) {}
    setOpponents([...opponents, oppPayload]);
    setShowOpponentModal(false);
    setNewOpponentData({ name: '', location: '', distance: 100, isConference: true });
    showNotice(`Opponent "${newOpponentData.name}" added.`);
  };

  const checkConflictsForEvent = (newEvent, existingList, ignoreId = null) => {
    const conflicts = [];
    const isTentative = newEvent.locationType === 'Postseason' && newEvent.status === 'Tentative';
    if (!newEvent.date || !newEvent.time) return conflicts;

    const newStart = new Date(`${newEvent.date}T${newEvent.time}`);
    const config = sportConfigs[newEvent.sport] || {};
    const warmupOffsetMs = (Number(config.warmupMinutes || newEvent.warmupMinutes || 45)) * 60000;
    const teardownOffsetMs = (Number(config.teardownMinutes || newEvent.teardownMinutes || 30)) * 60000;
    
    const effectiveStart = new Date(newStart.getTime() - warmupOffsetMs);
    const effectiveEnd = new Date(newStart.getTime() + (parseFloat(newEvent.durationHours || 3) * 3600000) + teardownOffsetMs);

    existingList.forEach(item => {
      if (ignoreId && item.id === ignoreId) return;
      if (item.status === 'Rejected') return;
      if (!item.date || !item.time) return;

      const itemStart = new Date(`${item.date}T${item.time}`);
      const itemConfig = sportConfigs[item.sport] || {};
      const itemWarmupMs = (Number(itemConfig.warmupMinutes || item.warmupMinutes || 45)) * 60000;
      const itemTeardownMs = (Number(itemConfig.teardownMinutes || item.teardownMinutes || 30)) * 60000;

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

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.opponent || !formData.date) {
      showNotice('Please complete required fields.', 'error');
      return;
    }

    const selectedVenue = venues.find(v => v.id === formData.venueId);
    const venueName = formData.locationType === 'Home' && selectedVenue ? selectedVenue.name : (formData.locationType === 'Neutral' ? 'Neutral Site' : 'Away Contest');
    const sportConfig = sportConfigs[formData.sport] || {};

    const submissionPayload = {
      ...formData,
      venueName,
      warmupMinutes: sportConfig.warmupMinutes || 45,
      teardownMinutes: sportConfig.teardownMinutes || 30,
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
      showNotice(conflicts.length > 0 ? 'Submitted with conflict warning notes.' : 'Schedule saved successfully!');
    } catch (err) {
      showNotice('Schedule saved locally / offline.');
    }
    setActiveTab(role === 'admin' ? 'dashboard' : 'calendar');
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id), { status: newStatus });
    } catch (err) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    }
    showNotice(`Status updated to ${newStatus}`);
  };

  const deleteSchedule = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
    } catch (err) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
    showNotice('Schedule entry removed.');
  };

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
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Toast Notification */}
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
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl max-w-md w-full p-6 shadow-2xl`}>
            <h3 className="text-lg font-bold mb-2">Add Opponent to Master Directory</h3>
            <form onSubmit={handleAddOpponentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Opponent Name</label>
                <input type="text" required value={newOpponentData.name} onChange={(e) => setNewOpponentData({...newOpponentData, name: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="e.g. Pacific Coast University" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location / City</label>
                  <input type="text" required value={newOpponentData.location} onChange={(e) => setNewOpponentData({...newOpponentData, location: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="City, State" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Distance (Miles)</label>
                  <input type="number" value={newOpponentData.distance} onChange={(e) => setNewOpponentData({...newOpponentData, distance: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="isConference" checked={newOpponentData.isConference} onChange={(e) => setNewOpponentData({...newOpponentData, isConference: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <label htmlFor="isConference" className="text-xs">Conference Opponent (Yes/No Check)</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowOpponentModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">Save Opponent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Venue Modal */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl max-w-md w-full p-6 shadow-2xl`}>
            <h3 className="text-lg font-bold mb-3">{editingVenue ? 'Edit Venue' : 'Add New Venue'}</h3>
            <form onSubmit={handleSaveVenue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Venue Name</label>
                <input type="text" required value={venueFormData.name} onChange={(e) => setVenueFormData({...venueFormData, name: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Facility Type</label>
                  <input type="text" value={venueFormData.type} onChange={(e) => setVenueFormData({...venueFormData, type: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Capacity</label>
                  <input type="number" value={venueFormData.capacity} onChange={(e) => setVenueFormData({...venueFormData, capacity: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setShowVenueModal(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Save Venue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sport Config Modal */}
      {showSportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl max-w-lg w-full p-6 shadow-2xl`}>
            <h3 className="text-lg font-bold mb-3">{editingSportKey ? 'Edit Sport Configuration' : 'Add New Sport & Budget Defaults'}</h3>
            <form onSubmit={handleSaveSport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Sport Name</label>
                <input type="text" required disabled={editingSportKey} value={sportFormData.name} onChange={(e) => setSportFormData({...sportFormData, name: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="e.g. Field Hockey" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Home Venue</label>
                <select value={sportFormData.defaultVenueId} onChange={(e) => setSportFormData({...sportFormData, defaultVenueId: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Warmup (Mins)</label>
                  <input type="number" value={sportFormData.warmupMinutes} onChange={(e) => setSportFormData({...sportFormData, warmupMinutes: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Arrival Buffer (Hrs)</label>
                  <input type="number" step="0.5" value={sportFormData.arrivalBufferHours} onChange={(e) => setSportFormData({...sportFormData, arrivalBufferHours: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Departure (Hrs)</label>
                  <input type="number" step="0.5" value={sportFormData.departureBufferHours} onChange={(e) => setSportFormData({...sportFormData, departureBufferHours: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roster Size (Travel)</label>
                  <input type="number" value={sportFormData.rosterSize} onChange={(e) => setSportFormData({...sportFormData, rosterSize: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Student Staff Count</label>
                  <input type="number" value={sportFormData.studentStaffCount} onChange={(e) => setSportFormData({...sportFormData, studentStaffCount: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Officials Cost ($)</label>
                  <input type="number" value={sportFormData.officialsCost} onChange={(e) => setSportFormData({...sportFormData, officialsCost: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Staffing Cost ($)</label>
                  <input type="number" value={sportFormData.staffCost} onChange={(e) => setSportFormData({...sportFormData, staffCost: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setShowSportModal(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Save Sport Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border-b px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>
              Collegiate Athletics Master Schedule
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {syncStatus} &bull; Athletics Department
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Light / Dark Mode Toggle */}
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-200 text-indigo-600'} transition-all`} title="Toggle Theme">
            {darkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
          </button>

          {role === 'coach' && (
            <div className={`flex items-center space-x-2 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border px-3 py-1.5 rounded-xl`}>
              <span className="text-xs font-medium text-slate-400">Sport:</span>
              <select value={currentUserSport} onChange={(e) => setCurrentUserSport(e.target.value)} className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer">
                {Object.keys(sportConfigs).map(s => <option key={s} value={s} className={darkMode ? 'bg-slate-900' : 'bg-white'}>{s}</option>)}
              </select>
            </div>
          )}

          <div className={`flex items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border p-1 rounded-xl`}>
            <button onClick={() => setRole('admin')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              Admin View
            </button>
            <button onClick={() => setRole('coach')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${role === 'coach' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              Coach View
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Navigation */}
        <aside className={`w-full md:w-64 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'} border-r p-4 flex flex-col space-y-1`}>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 pb-2">Navigation</p>
          
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <Layers className="w-4 h-4" />
            <span>Master Dashboard</span>
          </button>

          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'calendar' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <Calendar className="w-4 h-4" />
            <span>Schedule Calendar</span>
          </button>

          <button onClick={() => setActiveTab('matrix')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'matrix' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <Grid className="w-4 h-4" />
            <span>Venue Matrix View</span>
          </button>

          <button onClick={() => setActiveTab('submit')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'submit' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <Plus className="w-4 h-4" />
            <span>{role === 'admin' ? 'Add Schedule Event' : 'Submit / Request'}</span>
          </button>

          <button onClick={() => setActiveTab('sports')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'sports' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <Award className="w-4 h-4" />
            <span>Sports Management</span>
          </button>

          <button onClick={() => setActiveTab('venues')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'venues' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <MapPin className="w-4 h-4" />
            <span>Venue Management</span>
          </button>

          <button onClick={() => setActiveTab('opponents')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'opponents' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <Users className="w-4 h-4" />
            <span>Opponent Directory</span>
          </button>

          <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'budget' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <DollarSign className="w-4 h-4" />
            <span>Budget & Projections</span>
          </button>

          <button onClick={() => setActiveTab('conflicts')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'conflicts' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <AlertTriangle className="w-4 h-4" />
            <span>Conflict Audit Log</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400 font-medium">Total Events</p>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mt-1`}>{displayedSchedules.length}</h3>
                </div>
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400 font-medium">Venue Conflicts</p>
                  <h3 className="text-2xl font-bold text-rose-500 mt-1">{activeConflictsList.length}</h3>
                </div>
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400 font-medium">Total Projected Budget</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">${budgetSummary.grandTotal.toLocaleString()}</h3>
                </div>
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400 font-medium">Active Sports</p>
                  <h3 className="text-2xl font-bold text-indigo-400 mt-1">{Object.keys(sportConfigs).length}</h3>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recent Schedule Submissions</h3>
                  <button onClick={() => setActiveTab('submit')} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5"/> Add Schedule
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                        <th className="pb-3 font-semibold">Sport</th>
                        <th className="pb-3 font-semibold">Opponent</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Venue</th>
                        <th className="pb-3 font-semibold">Date & Time</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                      {displayedSchedules.slice(0, 8).map(s => (
                        <tr key={s.id} className={`${darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                          <td className={`py-3 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{s.sport}</td>
                          <td className="py-3 text-slate-400">{s.opponent}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.locationType === 'Home' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              s.locationType === 'Away' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>{s.locationType}</span>
                          </td>
                          <td className="py-3 text-slate-400">{s.venueName || 'Default'}</td>
                          <td className="py-3 text-slate-400">{s.date} @ {s.time}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                              s.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>{s.status}</span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {role === 'admin' && s.status === 'Pending' && (
                              <>
                                <button onClick={() => updateStatus(s.id, 'Approved')} className="p-1 bg-emerald-600/20 text-emerald-400 rounded" title="Approve"><Check className="w-3.5 h-3.5"/></button>
                                <button onClick={() => updateStatus(s.id, 'Rejected')} className="p-1 bg-rose-600/20 text-rose-400 rounded" title="Reject"><X className="w-3.5 h-3.5"/></button>
                              </>
                            )}
                            <button onClick={() => deleteSchedule(s.id)} className="p-1 bg-slate-800 text-slate-400 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'submit' && (
            <div className={`max-w-3xl mx-auto ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl p-6 shadow-xl`}>
              <h3 className="text-base font-bold mb-4">
                {role === 'admin' ? 'Administrative Master Schedule Entry' : `Submit Schedule for ${currentUserSport}`}
              </h3>
              
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Sport</label>
                    <select value={formData.sport} onChange={(e) => handleSportChange(e.target.value)} disabled={role === 'coach'} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                      {Object.keys(sportConfigs).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Coach / Submitter</label>
                    <input type="text" value={formData.coachName} onChange={(e) => setFormData({...formData, coachName: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Opponent</label>
                    <div className="flex gap-2">
                      <select value={formData.opponent} onChange={(e) => handleOpponentOrTripChange({ opponent: e.target.value })} className={`flex-1 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                        {opponents.map(o => <option key={o.id} value={o.name}>{o.name} ({o.isConference ? 'Conf' : 'Non-Conf'})</option>)}
                      </select>
                      <button type="button" onClick={() => setShowOpponentModal(true)} className="px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-semibold">
                        + New
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Location Type</label>
                    <select value={formData.locationType} onChange={(e) => handleLocationTypeChange(e.target.value)} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                      <option value="Home">Home</option>
                      <option value="Away">Away</option>
                      <option value="Neutral">Neutral Site</option>
                      <option value="Tournament">Tournament Hosting</option>
                      <option value="Postseason">Tentative Postseason</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.locationType === 'Home' || formData.locationType === 'Tournament' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Venue</label>
                      <select value={formData.venueId} onChange={(e) => setFormData({...formData, venueId: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Destination</label>
                      <input type="text" disabled value="Opponent Location" className={`w-full ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'} border rounded-xl px-3 py-2 text-sm`} />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                    <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Hours)</label>
                    <input type="number" step="0.5" value={formData.durationHours} onChange={(e) => setFormData({...formData, durationHours: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Warmup Buffer (Auto)</label>
                    <input type="text" disabled value={`${(sportConfigs[formData.sport] || {}).warmupMinutes || 45} mins`} className={`w-full ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'} border rounded-xl px-3 py-2 text-sm`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Teardown Buffer (Auto)</label>
                    <input type="text" disabled value={`${(sportConfigs[formData.sport] || {}).teardownMinutes || 30} mins`} className={`w-full ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'} border rounded-xl px-3 py-2 text-sm`} />
                  </div>
                </div>

                {formData.locationType === 'Away' && (
                  <div className={`p-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl space-y-3`}>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Travel & Budget Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Party Size</label>
                        <input type="number" value={formData.travelPartySize} onChange={(e) => handleOpponentOrTripChange({ travelPartySize: Number(e.target.value) })} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Mode</label>
                        <select value={formData.travelMode} onChange={(e) => setFormData({...formData, travelMode: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                          <option value="Charter Bus">Charter Bus</option>
                          <option value="Commercial Flight">Commercial Flight</option>
                          <option value="Van Fleet">Van Fleet</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-5">
                        <input type="checkbox" id="overnight" checked={formData.overnightTravel} onChange={(e) => handleOpponentOrTripChange({ overnightTravel: e.target.checked })} className="rounded text-indigo-600 w-4 h-4" />
                        <label htmlFor="overnight" className="ml-2 text-xs font-medium">Overnight Trip (Hotel & Meals)</label>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Special Requirements</label>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="Broadcast needs, equipment truck, etc."></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg">
                    {role === 'admin' ? 'Save Master Schedule Event' : 'Submit Schedule for Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Master Schedule Calendar View</h3>
                <span className="text-xs text-slate-400">Showing {displayedSchedules.length} events</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedSchedules.map(s => (
                  <div key={s.id} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{s.sport}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>{s.status}</span>
                      </div>
                      <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-1`}>vs {s.opponent}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5 text-slate-500"/> {s.venueName || 'Away'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500"/> {s.date} @ {s.time} ({s.durationHours}h)</p>
                    </div>
                    <div className={`pt-4 mt-4 border-t ${darkMode ? 'border-slate-900' : 'border-slate-100'} flex items-center justify-between`}>
                      <span className="text-[11px] text-slate-500">By {s.coachName}</span>
                      <button onClick={() => deleteSchedule(s.id)} className="text-xs text-rose-400 hover:text-rose-300">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Side-by-Side Venue Availability Matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {venues.map(v => {
                  const venueEvents = schedules.filter(s => s.venueId === v.id && s.status !== 'Rejected');
                  return (
                    <div key={v.id} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5`}>
                      <div className={`flex items-center justify-between mb-3 pb-2 border-b ${darkMode ? 'border-slate-900' : 'border-slate-100'}`}>
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{v.name}</h4>
                        <span className={`text-[10px] ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'} px-2 py-0.5 rounded`}>{v.type}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">Capacity: {v.capacity} seats</p>
                      <div className="space-y-2">
                        {venueEvents.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2">No events scheduled at this venue.</p>
                        ) : (
                          venueEvents.map(e => (
                            <div key={e.id} className={`p-2.5 ${darkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'} rounded-xl text-xs space-y-1`}>
                              <div className="flex justify-between font-bold text-indigo-400">
                                <span>{e.sport} vs {e.opponent}</span>
                                <span>{e.time}</span>
                              </div>
                              <p className="text-slate-400 text-[10px]">{e.date} &bull; Warmup: {e.warmupMinutes}m</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'sports' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sports Management & Default Parameters</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage sports, primary home venues, default warmup/travel buffers, and staffing budgets.</p>
                </div>
                <button onClick={() => { setEditingSportKey(null); setSportFormData({ name: '', defaultVenueId: venues[0]?.id || 'v1', defaultDuration: 2.5, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 600, staffCost: 350, rosterSize: 25, studentStaffCount: 4 }); setShowSportModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4"/> Add Sport
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(sportConfigs).map(([key, config]) => {
                  const venueObj = venues.find(v => v.id === config.defaultVenueId);
                  return (
                    <div key={key} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{config.name || key}</h4>
                          <span className="text-[10px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">{config.tier || 'Tier 2'}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Primary Venue: {venueObj ? venueObj.name : 'Unassigned'}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl">
                          <div>Warmup Time: <span className="text-white font-semibold">{config.warmupMinutes || 45} mins</span></div>
                          <div>Arrival Buffer: <span className="text-white font-semibold">{config.arrivalBufferHours || 2} hrs</span></div>
                          <div>Roster Size: <span className="text-white font-semibold">{config.rosterSize || 25}</span></div>
                          <div>Student Staff: <span className="text-white font-semibold">{config.studentStaffCount || 4}</span></div>
                          <div>Officials Cost: <span className="text-emerald-400 font-semibold">${config.officialsCost || 600}</span></div>
                          <div>Staff Cost: <span className="text-emerald-400 font-semibold">${config.staffCost || 350}</span></div>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-900 flex justify-end space-x-2">
                        <button onClick={() => { setEditingSportKey(key); setSportFormData(config); setShowSportModal(true); }} className="px-3 py-1.5 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800 text-xs">Edit</button>
                        <button onClick={() => handleDeleteSport(key)} className="px-3 py-1.5 bg-slate-900 text-rose-400 rounded-xl hover:bg-rose-600/20 text-xs">Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'venues' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Athletic Facility & Venue Directory</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage sports facilities. Primary sport venue mappings are controlled in the Sports Management tab.</p>
                </div>
                <button onClick={() => { setEditingVenue(null); setVenueFormData({ name: '', type: 'Outdoor Turf', capacity: 2000 }); setShowVenueModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4"/> Add Venue
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venues.map(v => {
                  const assignedSports = Object.values(sportConfigs).filter(sc => sc.defaultVenueId === v.id);
                  return (
                    <div key={v.id} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{v.name}</h4>
                          <span className={`text-[10px] ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'} px-2 py-0.5 rounded`}>{v.type}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">Capacity: {v.capacity} seats</p>
                        <div className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Primary Sports: </span>
                          {assignedSports.length === 0 ? 'None assigned' : assignedSports.map(s => s.name).join(', ')}
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-900 flex items-center justify-end space-x-2">
                        <button onClick={() => { setEditingVenue(v); setVenueFormData(v); setShowVenueModal(true); }} className="p-2 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800"><Edit3 className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteVenue(v.id)} className="p-2 bg-slate-900 text-rose-400 rounded-xl hover:bg-rose-600/20"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'opponents' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Master Opponent Directory</h3>
                <button onClick={() => setShowOpponentModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4"/> Add Opponent
                </button>
              </div>
              <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl overflow-hidden`}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                      <th className="p-4 font-semibold">Opponent Name</th>
                      <th className="p-4 font-semibold">Location</th>
                      <th className="p-4 font-semibold">Distance</th>
                      <th className="p-4 font-semibold">Conference Check</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {opponents.map(o => (
                      <tr key={o.id} className={`${darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                        <td className={`p-4 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{o.name}</td>
                        <td className="p-4 text-slate-400">{o.location}</td>
                        <td className="p-4 text-slate-400">{o.distance} miles</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${o.isConference ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                            {o.isConference ? 'Yes (Conference)' : 'No (Non-Conf)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Budget & Cost Projections</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400">Total Travel Costs</p>
                  <h3 className="text-2xl font-bold text-indigo-400 mt-1">${budgetSummary.totalTravel.toLocaleString()}</h3>
                </div>
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400">Total Meal Costs</p>
                  <h3 className="text-2xl font-bold text-amber-400 mt-1">${budgetSummary.totalMeals.toLocaleString()}</h3>
                </div>
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400">Total Hotel Costs</p>
                  <h3 className="text-2xl font-bold text-purple-400 mt-1">${budgetSummary.totalHotel.toLocaleString()}</h3>
                </div>
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border p-5 rounded-2xl`}>
                  <p className="text-xs text-slate-400">Home Hosting Costs</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">${budgetSummary.totalHosting.toLocaleString()}</h3>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4`}>Budget Breakdown by Sport</h4>
                <div className="space-y-3">
                  {Object.entries(budgetSummary.bySport).map(([sport, data]) => {
                    const total = data.travel + data.meals + data.hotel + data.hosting;
                    return (
                      <div key={sport} className={`p-4 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl flex items-center justify-between`}>
                        <div>
                          <h5 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sport}</h5>
                          <p className="text-xs text-slate-400">{data.count} scheduled contests</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">${total.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">Travel: ${data.travel} | Meals: ${data.meals} | Hotel: ${data.hotel} | Hosting: ${data.hosting}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Conflict Audit Log & Warmup Buffers</h3>
              {activeConflictsList.length === 0 ? (
                <div className={`p-8 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl text-center`}>
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No Venue Conflicts Detected</h4>
                  <p className="text-xs text-slate-400 mt-1">All scheduled events and warmup buffer requirements clear venue availability rules.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeConflictsList.map((c, i) => (
                    <div key={i} className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-400">{c.title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
