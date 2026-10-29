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
  { id: 'opp-1', name: 'State Tech University', location: 'State Tech, PA', distance: 140, travelTime: '2h 15m', isConference: true },
  { id: 'opp-2', name: 'Coastal College', location: 'Coastal, NC', distance: 450, travelTime: '7h 30m', isConference: false },
  { id: 'opp-3', name: 'Metro State University', location: 'Metro, NY', distance: 80, travelTime: '1h 30m', isConference: true },
  { id: 'opp-4', name: 'Northern Polytechnic', location: 'North, MA', distance: 620, travelTime: '10h 0m', isConference: false },
  { id: 'opp-5', name: 'Cascade Valley College', location: 'Cascade, VT', distance: 210, travelTime: '3h 45m', isConference: true }
];

const INITIAL_STAFF_ROLES = [
  { id: 'sr-1', roleName: 'Game Announcer / PA', hourlyRate: 25, defaultHours: 4 },
  { id: 'sr-2', roleName: 'Livestream Operator', hourlyRate: 22, defaultHours: 4 },
  { id: 'sr-3', roleName: 'Ticket Taker / Usher', hourlyRate: 15, defaultHours: 3 },
  { id: 'sr-4', roleName: 'Athletic Trainer', hourlyRate: 35, defaultHours: 5 }
];

const INITIAL_TRANSPORT_MODES = [
  { id: 'tm-1', modeName: 'Charter Bus', rateType: 'mileage', rateValue: 4.50 },
  { id: 'tm-2', modeName: 'Van Fleet', rateType: 'mileage', rateValue: 1.20 },
  { id: 'tm-3', modeName: 'Commercial Flight', rateType: 'flat', rateValue: 450 }
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
  const [staffRoles, setStaffRoles] = useState(INITIAL_STAFF_ROLES);
  const [transportModes, setTransportModes] = useState(INITIAL_TRANSPORT_MODES);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'calendar', 'matrix', 'submit', 'venues', 'sports', 'opponents', 'budget', 'conflicts'
  const [budgetSubTab, setBudgetSubTab] = useState('summary'); // 'summary', 'staffing', 'transport', 'sport-detail'
  const [selectedSportDetail, setSelectedSportDetail] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Modals
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [editingOpponentId, setEditingOpponentId] = useState(null);
  const [newOpponentData, setNewOpponentData] = useState({ name: '', location: '', distance: 100, travelTime: '2h 0m', isConference: true });

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffFormData, setStaffFormData] = useState({ roleName: '', hourlyRate: 18, defaultHours: 4 });

  const [showTransportModal, setShowTransportModal] = useState(false);
  const [transportFormData, setTransportFormData] = useState({ modeName: '', rateType: 'mileage', rateValue: 3.50 });
  const [editingTransportId, setEditingTransportId] = useState(null);

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
    opponent: '',
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
    hotelRoomsCount: 15,
    customHotelCostPerNight: 160,
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    tournamentDetails: '',
    neutralLocationName: '',
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
        if (loaded.length > 0) {
          setSchedules(loaded);
        } else {
          setSchedules([]);
        }
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
        teardownMinutes: config.locationType === 'Home' ? 0 : (config.teardownMinutes || 30),
        travelPartySize: config.rosterSize || 30
      }));
    } else {
      setFormData(prev => ({ ...prev, sport: sportName }));
    }
  };

  const calculateCosts = (oppName, locType, overnight, partySize, sportName, tMode, roomsCount, hotelRate) => {
    const oppObj = opponents.find(o => o.name === oppName);
    const config = sportConfigs[sportName] || sportConfigs['Football'] || { officialsCost: 600, staffCost: 300 };
    const distance = oppObj ? oppObj.distance : 100;
    
    let travel = 0, meals = 0, hotel = 0, hosting = 0;
    const isHome = locType === 'Home' || locType === 'Tournament';

    if (isHome) {
      hosting = Number(config.officialsCost || 600) + Number(config.staffCost || 300);
    } else {
      const transportModeObj = transportModes.find(tm => tm.modeName === tMode);
      const rateVal = transportModeObj ? transportModeObj.rateValue : 4.50;
      const rateType = transportModeObj ? transportModeObj.rateType : 'mileage';

      if (rateType === 'mileage') {
        travel = (distance * 2) * rateVal;
      } else if (rateType === 'hourly') {
        const estHours = 4 + (distance / 50);
        travel = estHours * rateVal;
      } else {
        travel = rateVal;
      }

      meals = partySize * 45 * (overnight ? 3 : 1);
      hotel = overnight ? roomsCount * hotelRate * 1 : 0;
    }
    return { travel, meals, hotel, hosting };
  };

  const handleOpponentOrTripChange = (updates) => {
    const nextData = { ...formData, ...updates };
    const costs = calculateCosts(
      nextData.opponent, 
      nextData.locationType, 
      nextData.overnightTravel, 
      nextData.travelPartySize, 
      nextData.sport, 
      nextData.travelMode,
      nextData.hotelRoomsCount,
      nextData.customHotelCostPerNight
    );
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
    handleOpponentOrTripChange({ locationType: locType, venueId, teardownMinutes: isHome ? 0 : 30 });
  };

  const handleEditScheduleClick = (ev) => {
    setEditingScheduleId(ev.id);
    setFormData({
      sport: ev.sport || 'Football',
      coachName: ev.coachName || '',
      opponent: ev.opponent || '',
      locationType: ev.locationType || 'Home',
      venueId: ev.venueId || 'v1',
      date: ev.date || '',
      time: ev.time || '14:00',
      durationHours: ev.durationHours || 2.5,
      warmupMinutes: ev.warmupMinutes || 45,
      teardownMinutes: ev.teardownMinutes || 30,
      travelCost: ev.travelCost || 0,
      mealCost: ev.mealCost || 0,
      hotelCost: ev.hotelCost || 0,
      hostingCost: ev.hostingCost || 0,
      overnightTravel: ev.overnightTravel || false,
      travelPartySize: ev.travelPartySize || 30,
      travelMode: ev.travelMode || 'Charter Bus',
      hotelRoomsCount: ev.hotelRoomsCount || 15,
      customHotelCostPerNight: ev.customHotelCostPerNight || 160,
      departureDate: ev.departureDate || '',
      departureTime: ev.departureTime || '',
      returnDate: ev.returnDate || '',
      returnTime: ev.returnTime || '',
      tournamentDetails: ev.tournamentDetails || '',
      neutralLocationName: ev.neutralLocationName || '',
      notes: ev.notes || ''
    });
    setActiveTab('submit');
  };

  // Format date helper (2026-09-12 -> 9/12/2026)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
    }
    return dateStr;
  };

  // Format time helper (14:00 -> 2:00 PM)
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hour = parseInt(parts[0], 10);
      const minute = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour}:${minute} ${ampm}`;
    }
    return timeStr;
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
      if (editingOpponentId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'opponents', editingOpponentId), newOpponentData);
        setOpponents(opponents.map(o => o.id === editingOpponentId ? { ...o, ...newOpponentData } : o));
        showNotice('Opponent updated.');
      } else {
        await addDoc(opponentsRef, oppPayload);
        setOpponents([...opponents, oppPayload]);
        showNotice(`Opponent "${newOpponentData.name}" added.`);
      }
    } catch (e) {
      if (editingOpponentId) {
        setOpponents(opponents.map(o => o.id === editingOpponentId ? { ...o, ...newOpponentData } : o));
      } else {
        setOpponents([...opponents, oppPayload]);
      }
      showNotice('Opponent saved.');
    }
    setShowOpponentModal(false);
    setEditingOpponentId(null);
    setNewOpponentData({ name: '', location: '', distance: 100, travelTime: '2h 0m', isConference: true });
  };

  const handleDeleteOpponent = (id) => {
    setOpponents(opponents.filter(o => o.id !== id));
    showNotice('Opponent removed.');
  };

  const handleSaveStaffRole = (e) => {
    e.preventDefault();
    if (!staffFormData.roleName) return;
    if (editingStaffId) {
      setStaffRoles(staffRoles.map(sr => sr.id === editingStaffId ? { ...sr, ...staffFormData } : sr));
      showNotice('Staff role updated.');
    } else {
      const newRole = { id: 'sr-' + Date.now(), ...staffFormData };
      setStaffRoles([...staffRoles, newRole]);
      showNotice('Staff role added.');
    }
    setShowStaffModal(false);
    setEditingStaffId(null);
    setStaffFormData({ roleName: '', hourlyRate: 18, defaultHours: 4 });
  };

  const handleDeleteStaffRole = (id) => {
    setStaffRoles(staffRoles.filter(sr => sr.id !== id));
    showNotice('Staff role removed.');
  };

  const handleSaveTransportMode = (e) => {
    e.preventDefault();
    if (!transportFormData.modeName) return;
    if (editingTransportId) {
      setTransportModes(transportModes.map(tm => tm.id === editingTransportId ? { ...tm, ...transportFormData } : tm));
      showNotice('Transportation mode updated.');
    } else {
      const newMode = { id: 'tm-' + Date.now(), ...transportFormData };
      setTransportModes([...transportModes, newMode]);
      showNotice('Transportation mode added.');
    }
    setShowTransportModal(false);
    setEditingTransportId(null);
    setTransportFormData({ modeName: '', rateType: 'mileage', rateValue: 3.50 });
  };

  const handleDeleteTransportMode = (id) => {
    setTransportModes(transportModes.filter(tm => tm.id !== id));
    showNotice('Transportation mode removed.');
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        let importedCount = 0;
        const newEvents = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const [sport, opponent, locationType, venueName, date, time, notes] = line.split(',').map(s => s ? s.trim() : '');
          if (sport && opponent && date) {
            const venue = venues.find(v => v.name.toLowerCase() === (venueName || '').toLowerCase()) || venues[0];
            const eventObj = {
              id: 'imp-' + Date.now() + '-' + i,
              sport: sport || 'Football',
              coachName: 'Imported Schedule',
              opponent: opponent || 'Opponent',
              locationType: locationType || 'Home',
              venueId: venue?.id || 'v1',
              venueName: venue?.name || 'Alumni Memorial Stadium',
              date: date || '2026-09-01',
              time: time || '14:00',
              durationHours: 2.5,
              warmupMinutes: 45,
              teardownMinutes: 30,
              travelCost: 0,
              mealCost: 0,
              hotelCost: 0,
              hostingCost: 2500,
              overnightTravel: false,
              travelPartySize: 30,
              travelMode: 'Charter Bus',
              status: 'Approved',
              notes: notes || 'Imported via CSV'
            };
            newEvents.push(eventObj);
            importedCount++;
          }
        }
        
        if (importedCount > 0) {
          setSchedules(prev => [...prev, ...newEvents]);
          showNotice(`Successfully imported ${importedCount} schedule events.`);
        } else {
          showNotice('No valid rows found in CSV. Format: Sport,Opponent,LocationType,VenueName,Date,Time,Notes', 'error');
        }
      } catch (err) {
        showNotice('Failed to parse CSV file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const checkConflictsForEvent = (newEvent, existingList, ignoreId = null) => {
    const conflicts = [];
    const isTentative = newEvent.locationType === 'Postseason' && newEvent.status === 'Tentative';
    if (!newEvent.date || !newEvent.time) return conflicts;

    const newStart = new Date(`${newEvent.date}T${newEvent.time}`);
    const config = sportConfigs[newEvent.sport] || {};
    const warmupOffsetMs = (Number(config.warmupMinutes || newEvent.warmupMinutes || 45)) * 60000;
    const teardownOffsetMs = newEvent.locationType === 'Home' ? 0 : (Number(config.teardownMinutes || newEvent.teardownMinutes || 30)) * 60000;
    
    const effectiveStart = new Date(newStart.getTime() - warmupOffsetMs);
    const effectiveEnd = new Date(newStart.getTime() + (parseFloat(newEvent.durationHours || 3) * 3600000) + teardownOffsetMs);

    existingList.forEach(item => {
      if (ignoreId && item.id === ignoreId) return;
      if (item.status === 'Rejected') return;
      if (!item.date || !item.time) return;

      const itemStart = new Date(`${item.date}T${item.time}`);
      const itemConfig = sportConfigs[item.sport] || {};
      const itemWarmupMs = (Number(itemConfig.warmupMinutes || item.warmupMinutes || 45)) * 60000;
      const itemTeardownMs = item.locationType === 'Home' ? 0 : (Number(itemConfig.teardownMinutes || item.teardownMinutes || 30)) * 60000;

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

    const conflicts = checkConflictsForEvent(submissionPayload, schedules, editingScheduleId);
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
      if (editingScheduleId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingScheduleId), newRecord);
        showNotice('Schedule updated successfully!');
      } else {
        await addDoc(eventsRef, newRecord);
        showNotice(conflicts.length > 0 ? 'Submitted with conflict warning notes.' : 'Schedule saved successfully!');
      }
    } catch (err) {
      showNotice('Schedule saved locally / offline.');
    }
    setEditingScheduleId(null);
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
            <h3 className="text-lg font-bold mb-2">{editingOpponentId ? 'Edit Opponent' : 'Add Opponent to Master Directory'}</h3>
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
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Time Estimate</label>
                <input type="text" value={newOpponentData.travelTime} onChange={(e) => setNewOpponentData({...newOpponentData, travelTime: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="e.g. 3h 15m" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="isConference" checked={newOpponentData.isConference} onChange={(e) => setNewOpponentData({...newOpponentData, isConference: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <label htmlFor="isConference" className="text-xs">Conference Opponent (Yes/No Check)</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setShowOpponentModal(false); setEditingOpponentId(null); }} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">{editingOpponentId ? 'Update Opponent' : 'Save Opponent'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Role Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl max-w-md w-full p-6 shadow-2xl`}>
            <h3 className="text-lg font-bold mb-3">{editingStaffId ? 'Edit Home Staffing Role' : 'Add Home Staffing Role'}</h3>
            <form onSubmit={handleSaveStaffRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role Title</label>
                <input type="text" required value={staffFormData.roleName} onChange={(e) => setStaffFormData({...staffFormData, roleName: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="e.g. Statisticians" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hourly Rate ($)</label>
                  <input type="number" step="0.5" value={staffFormData.hourlyRate} onChange={(e) => setStaffFormData({...staffFormData, hourlyRate: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Default Hours / Game</label>
                  <input type="number" step="0.5" value={staffFormData.defaultHours} onChange={(e) => setStaffFormData({...staffFormData, defaultHours: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => { setShowStaffModal(false); setEditingStaffId(null); }} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">{editingStaffId ? 'Update Role' : 'Save Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transport Modal */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl max-w-md w-full p-6 shadow-2xl`}>
            <h3 className="text-lg font-bold mb-3">{editingTransportId ? 'Edit Transportation Option' : 'Add Transportation Option'}</h3>
            <form onSubmit={handleSaveTransportMode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Transport Mode Name</label>
                <input type="text" required value={transportFormData.modeName} onChange={(e) => setTransportFormData({...transportFormData, modeName: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="e.g. Luxury Motorcoach" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Rate Type</label>
                  <select value={transportFormData.rateType} onChange={(e) => setTransportFormData({...transportFormData, rateType: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                    <option value="mileage">Mileage ($/mi)</option>
                    <option value="hourly">Hourly ($/hr)</option>
                    <option value="flat">Flat Rate ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Rate Value</label>
                  <input type="number" step="0.05" value={transportFormData.rateValue} onChange={(e) => setTransportFormData({...transportFormData, rateValue: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => { setShowTransportModal(false); setEditingTransportId(null); }} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">{editingTransportId ? 'Update Mode' : 'Save Mode'}</button>
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
                <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Sport Name</label>
                <input type="text" required disabled={editingSportKey} value={sportFormData.name} onChange={(e) => setSportFormData({...sportFormData, name: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="e.g. Field Hockey" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Primary Home Venue</label>
                  <select value={sportFormData.defaultVenueId} onChange={(e) => setSportFormData({...sportFormData, defaultVenueId: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Sport Tier</label>
                  <select value={sportFormData.tier || 'Tier 2'} onChange={(e) => setSportFormData({...sportFormData, tier: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                    <option value="Tier 1 (Revenue)">Tier 1 (Revenue)</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Warmup (Mins)</label>
                  <input type="number" value={sportFormData.warmupMinutes} onChange={(e) => setSportFormData({...sportFormData, warmupMinutes: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Arrival Buffer (Hrs)</label>
                  <input type="number" step="0.5" value={sportFormData.arrivalBufferHours} onChange={(e) => setSportFormData({...sportFormData, arrivalBufferHours: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Departure (Hrs)</label>
                  <input type="number" step="0.5" value={sportFormData.departureBufferHours} onChange={(e) => setSportFormData({...sportFormData, departureBufferHours: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Roster Size (Travel)</label>
                  <input type="number" value={sportFormData.rosterSize} onChange={(e) => setSportFormData({...sportFormData, rosterSize: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Student Staff Count</label>
                  <input type="number" value={sportFormData.studentStaffCount} onChange={(e) => setSportFormData({...sportFormData, studentStaffCount: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Officials Cost ($)</label>
                  <input type="number" value={sportFormData.officialsCost} onChange={(e) => setSportFormData({...sportFormData, officialsCost: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-1`}>Staffing Cost ($)</label>
                  <input type="number" value={sportFormData.staffCost} onChange={(e) => setSportFormData({...sportFormData, staffCost: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setShowSportModal(false)} className={`px-4 py-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Cancel</button>
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
        <aside className={`w-full md:w-64 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-300 shadow-sm'} border-r p-4 flex flex-col space-y-1`}>
          <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-600'} px-3 pb-2`}>Navigation</p>
          
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'dashboard' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <Layers className="w-4 h-4" />
            <span>Master Dashboard</span>
          </button>

          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'calendar' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <Calendar className="w-4 h-4" />
            <span>Schedule Calendar</span>
          </button>

          <button onClick={() => setActiveTab('matrix')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'matrix' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <Grid className="w-4 h-4" />
            <span>Venue Matrix View</span>
          </button>

          <button onClick={() => { setEditingScheduleId(null); setActiveTab('submit'); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'submit' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <Plus className="w-4 h-4" />
            <span>{role === 'admin' ? 'Add Schedule Event' : 'Submit / Request'}</span>
          </button>

          <button onClick={() => setActiveTab('sports')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'sports' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <Award className="w-4 h-4" />
            <span>Sports Management</span>
          </button>

          <button onClick={() => setActiveTab('venues')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'venues' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <MapPin className="w-4 h-4" />
            <span>Venue Management</span>
          </button>

          <button onClick={() => setActiveTab('opponents')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'opponents' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <Users className="w-4 h-4" />
            <span>Opponent Directory</span>
          </button>

          <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'budget' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
            <DollarSign className="w-4 h-4" />
            <span>Budget & Projections</span>
          </button>

          <button onClick={() => setActiveTab('conflicts')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'conflicts' ? (darkMode ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900')}`}>
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
                  <button onClick={() => { setEditingScheduleId(null); setActiveTab('submit'); }} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
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
                          <td className="py-3 text-slate-400">{formatDateDisplay(s.date)} @ {formatTimeDisplay(s.time)}</td>
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
                            <button onClick={() => handleEditScheduleClick(s)} className="p-1 bg-indigo-600/20 text-indigo-400 rounded" title="Edit"><Edit3 className="w-3.5 h-3.5"/></button>
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
            <div className={`max-w-3xl mx-auto ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl p-6 shadow-xl space-y-6`}>
              
              {/* CSV Importer */}
              <div className={`p-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4`}>
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Bulk CSV Schedule Importer</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Format: Sport, Opponent, LocationType, VenueName, Date (YYYY-MM-DD), Time, Notes</p>
                </div>
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow">
                  Upload CSV File
                  <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                </label>
              </div>

              <div>
                <h3 className="text-base font-bold">
                  {editingScheduleId ? 'Edit Schedule Event' : (role === 'admin' ? 'Administrative Master Schedule Entry' : `Submit Schedule for ${currentUserSport}`)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Enter contest details below to evaluate venue availability and projected travel/hosting budgets.</p>
              </div>

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
                  {editingScheduleId && (
                    <button type="button" onClick={() => { setEditingScheduleId(null); setActiveTab('dashboard'); }} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg">
                    {editingScheduleId ? 'Update Schedule Event' : (role === 'admin' ? 'Save Master Schedule Event' : 'Submit Schedule for Review')}
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
                      <p className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500"/> {formatDateDisplay(s.date)} @ {formatTimeDisplay(s.time)} ({s.durationHours}h)</p>
                    </div>
                    <div className={`pt-4 mt-4 border-t ${darkMode ? 'border-slate-900' : 'border-slate-100'} flex items-center justify-between`}>
                      <span className="text-[11px] text-slate-500">By {s.coachName}</span>
                      <div className="space-x-2">
                        <button onClick={() => handleEditScheduleClick(s)} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                        <button onClick={() => deleteSchedule(s.id)} className="text-xs text-rose-400 hover:text-rose-300">Remove</button>
                      </div>
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
                                <span>{formatTimeDisplay(e.time)}</span>
                              </div>
                              <p className="text-slate-400 text-[10px]">{formatDateDisplay(e.date)} &bull; Warmup: {e.warmupMinutes}m</p>
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
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>Manage sports, primary home venues, sport tiers, default warmup/travel buffers, and staffing budgets.</p>
                </div>
                <button onClick={() => { setEditingSportKey(null); setSportFormData({ name: '', defaultVenueId: venues[0]?.id || 'v1', defaultDuration: 2.5, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 600, staffCost: 350, rosterSize: 25, studentStaffCount: 4 }); setShowSportModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow">
                  <Plus className="w-4 h-4"/> Add Sport
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(sportConfigs).map(([key, config]) => {
                  const venueObj = venues.find(v => v.id === config.defaultVenueId);
                  return (
                    <div key={key} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-5 flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{config.name || key}</h4>
                          <span className="text-[10px] bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">{config.tier || 'Tier 2'}</span>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-700'} mb-3 flex items-center gap-1`}><MapPin className="w-3.5 h-3.5"/> Primary Venue: {venueObj ? venueObj.name : 'Unassigned'}</p>
                        <div className={`grid grid-cols-2 gap-2 text-xs ${darkMode ? 'text-slate-400 bg-slate-900/40' : 'text-slate-800 bg-slate-100 border border-slate-200'} p-3 rounded-xl`}>
                          <div>Warmup Time: <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{config.warmupMinutes || 45} mins</span></div>
                          <div>Arrival Buffer: <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{config.arrivalBufferHours || 2} hrs</span></div>
                          <div>Roster Size: <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{config.rosterSize || 25}</span></div>
                          <div>Student Staff: <span className={`${darkMode ? 'text-white' : 'text-slate-900'} font-semibold`}>{config.studentStaffCount || 4}</span></div>
                          <div>Officials Cost: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${config.officialsCost || 600}</span></div>
                          <div>Staff Cost: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${config.staffCost || 350}</span></div>
                        </div>
                      </div>
                      <div className={`pt-4 mt-4 border-t ${darkMode ? 'border-slate-900' : 'border-slate-200'} flex justify-end space-x-2`}>
                        <button onClick={() => { setEditingSportKey(key); setSportFormData(config); setShowSportModal(true); }} className={`px-3 py-1.5 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'} rounded-xl hover:opacity-90 text-xs`}>Edit</button>
                        <button onClick={() => handleDeleteSport(key)} className={`px-3 py-1.5 ${darkMode ? 'bg-slate-900 text-rose-400' : 'bg-rose-50 text-rose-700 font-semibold'} rounded-xl hover:opacity-90 text-xs`}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'venues' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Venue Management & Facilities</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>Add, edit, and configure athletic venues and seating capacities.</p>
                </div>
                <button onClick={() => { setEditingVenue(null); setVenueFormData({ name: '', type: 'Outdoor Turf', capacity: 2000 }); setShowVenueModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow">
                  <Plus className="w-4 h-4"/> Add Venue
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {venues.map(v => (
                  <div key={v.id} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-5 flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{v.name}</h4>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{v.type}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">Capacity: {v.capacity} spectators</p>
                    </div>
                    <div className={`pt-3 border-t ${darkMode ? 'border-slate-900' : 'border-slate-200'} flex justify-end space-x-2`}>
                      <button onClick={() => { setEditingVenue(v); setVenueFormData({ name: v.name, type: v.type, capacity: v.capacity }); setShowVenueModal(true); }} className={`px-3 py-1.5 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'} rounded-xl text-xs`}>Edit</button>
                      <button onClick={() => handleDeleteVenue(v.id)} className={`px-3 py-1.5 ${darkMode ? 'bg-slate-900 text-rose-400' : 'bg-rose-50 text-rose-700 font-semibold'} rounded-xl text-xs`}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'opponents' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Master Opponent Directory</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>Manage opponent institutions, travel distances, travel times, and conference affiliations.</p>
                </div>
                <button onClick={() => { setEditingOpponentId(null); setNewOpponentData({ name: '', location: '', distance: 100, travelTime: '2h 0m', isConference: true }); setShowOpponentModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow">
                  <Plus className="w-4 h-4"/> Add Opponent
                </button>
              </div>

              <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-6`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                        <th className="pb-3 font-semibold">Opponent Institution</th>
                        <th className="pb-3 font-semibold">Location / City</th>
                        <th className="pb-3 font-semibold">Distance</th>
                        <th className="pb-3 font-semibold">Travel Time</th>
                        <th className="pb-3 font-semibold">Conference Check</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-900' : 'divide-slate-200'}`}>
                      {opponents.map(o => (
                        <tr key={o.id}>
                          <td className={`py-3 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{o.name}</td>
                          <td className="py-3 text-slate-400">{o.location}</td>
                          <td className="py-3 text-slate-400">{o.distance} mi</td>
                          <td className="py-3 text-slate-400">{o.travelTime || '2h 0m'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${o.isConference ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                              {o.isConference ? 'Conference' : 'Non-Conference'}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <button onClick={() => { setEditingOpponentId(o.id); setNewOpponentData({ name: o.name, location: o.location, distance: o.distance, travelTime: o.travelTime || '2h 0m', isConference: o.isConference }); setShowOpponentModal(true); }} className={`px-2.5 py-1 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'} rounded-lg`}>Edit</button>
                            <button onClick={() => handleDeleteOpponent(o.id)} className="px-2.5 py-1 bg-rose-600/20 text-rose-400 rounded-lg">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Budget, Staffing & Transportation Control</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>Comprehensive financial models, home staffing rates, and transportation options.</p>
                </div>
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                  <button onClick={() => { setBudgetSubTab('summary'); setSelectedSportDetail(null); }} className={`px-3 py-1.5 rounded-lg font-medium transition-all ${budgetSubTab === 'summary' && !selectedSportDetail ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Sport Summary</button>
                  <button onClick={() => setBudgetSubTab('staffing')} className={`px-3 py-1.5 rounded-lg font-medium transition-all ${budgetSubTab === 'staffing' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Home Staffing</button>
                  <button onClick={() => setBudgetSubTab('transport')} className={`px-3 py-1.5 rounded-lg font-medium transition-all ${budgetSubTab === 'transport' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Transportation</button>
                </div>
              </div>

              {selectedSportDetail ? (
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-6 space-y-4`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-400">{selectedSportDetail} - Scheduled Event Breakdown</h4>
                      <p className="text-xs text-slate-400">All scheduled contests and individual event budget allocations.</p>
                    </div>
                    <button onClick={() => setSelectedSportDetail(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Back to Summary</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                          <th className="pb-3 font-semibold">Opponent</th>
                          <th className="pb-3 font-semibold">Type</th>
                          <th className="pb-3 font-semibold">Date & Time</th>
                          <th className="pb-3 font-semibold">Travel</th>
                          <th className="pb-3 font-semibold">Hotel</th>
                          <th className="pb-3 font-semibold">Meals</th>
                          <th className="pb-3 font-semibold">Hosting</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-900' : 'divide-slate-200'}`}>
                        {schedules.filter(s => s.sport === selectedSportDetail && s.status !== 'Rejected').map(ev => (
                          <tr key={ev.id}>
                            <td className={`py-3 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ev.opponent}</td>
                            <td className="py-3 text-slate-400">{ev.locationType}</td>
                            <td className="py-3 text-slate-400">{formatDateDisplay(ev.date)} @ {formatTimeDisplay(ev.time)}</td>
                            <td className="py-3 text-slate-400">${Number(ev.travelCost || 0).toLocaleString()}</td>
                            <td className="py-3 text-slate-400">${Number(ev.hotelCost || 0).toLocaleString()}</td>
                            <td className="py-3 text-slate-400">${Number(ev.mealCost || 0).toLocaleString()}</td>
                            <td className="py-3 text-slate-400">${Number(ev.hostingCost || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : budgetSubTab === 'summary' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border p-5 rounded-2xl`}>
                      <p className="text-xs text-slate-400">Transportation</p>
                      <h3 className="text-xl font-bold text-indigo-400 mt-1">${budgetSummary.totalTravel.toLocaleString()}</h3>
                    </div>
                    <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border p-5 rounded-2xl`}>
                      <p className="text-xs text-slate-400">Lodging (Hotel)</p>
                      <h3 className="text-xl font-bold text-amber-400 mt-1">${budgetSummary.totalHotel.toLocaleString()}</h3>
                    </div>
                    <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border p-5 rounded-2xl`}>
                      <p className="text-xs text-slate-400">Per Diem Meals</p>
                      <h3 className="text-xl font-bold text-emerald-400 mt-1">${budgetSummary.totalMeals.toLocaleString()}</h3>
                    </div>
                    <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border p-5 rounded-2xl`}>
                      <p className="text-xs text-slate-400">Hosting & Officials</p>
                      <h3 className="text-xl font-bold text-purple-400 mt-1">${budgetSummary.totalHosting.toLocaleString()}</h3>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-6`}>
                    <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-2`}>Sport-by-Sport Budget Summary</h4>
                    <p className="text-xs text-slate-400 mb-4">Click any sport row below to inspect its detailed event-by-event breakdown.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                            <th className="pb-3 font-semibold">Sport</th>
                            <th className="pb-3 font-semibold">Events</th>
                            <th className="pb-3 font-semibold">Travel</th>
                            <th className="pb-3 font-semibold">Hotel</th>
                            <th className="pb-3 font-semibold">Meals</th>
                            <th className="pb-3 font-semibold">Hosting</th>
                            <th className="pb-3 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-900' : 'divide-slate-200'}`}>
                          {Object.entries(budgetSummary.bySport).map(([sport, b]) => {
                            const subTotal = b.travel + b.meals + b.hotel + b.hosting;
                            return (
                              <tr key={sport} onClick={() => setSelectedSportDetail(sport)} className="cursor-pointer hover:bg-indigo-600/10 transition-colors">
                                <td className={`py-3 font-bold text-indigo-400 flex items-center gap-1.5`}>{sport} <ChevronRight className="w-3 h-3"/></td>
                                <td className="py-3 text-slate-400">{b.count}</td>
                                <td className="py-3 text-slate-400">${b.travel.toLocaleString()}</td>
                                <td className="py-3 text-slate-400">${b.hotel.toLocaleString()}</td>
                                <td className="py-3 text-slate-400">${b.meals.toLocaleString()}</td>
                                <td className="py-3 text-slate-400">${b.hosting.toLocaleString()}</td>
                                <td className="py-3 text-right font-bold text-emerald-400">${subTotal.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : budgetSubTab === 'staffing' ? (
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-6 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Home Game Staffing Roles & Pay Rates</h4>
                      <p className="text-xs text-slate-400">Define student worker and support staff hourly rates to calculate hosting expenses.</p>
                    </div>
                    <button onClick={() => { setEditingStaffId(null); setStaffFormData({ roleName: '', hourlyRate: 18, defaultHours: 4 }); setShowStaffModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow">
                      <Plus className="w-4 h-4"/> Add Staff Role
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                          <th className="pb-3 font-semibold">Staff Role</th>
                          <th className="pb-3 font-semibold">Hourly Rate</th>
                          <th className="pb-3 font-semibold">Default Duration</th>
                          <th className="pb-3 font-semibold">Est. Cost / Game</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-900' : 'divide-slate-200'}`}>
                        {staffRoles.map(sr => (
                          <tr key={sr.id}>
                            <td className={`py-3 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sr.roleName}</td>
                            <td className="py-3 text-slate-400">${sr.hourlyRate.toFixed(2)} / hr</td>
                            <td className="py-3 text-slate-400">{sr.defaultHours} hours</td>
                            <td className="py-3 font-bold text-emerald-400">${(sr.hourlyRate * sr.defaultHours).toFixed(2)}</td>
                            <td className="py-3 text-right space-x-2">
                              <button onClick={() => { setEditingStaffId(sr.id); setStaffFormData({ roleName: sr.roleName, hourlyRate: sr.hourlyRate, defaultHours: sr.defaultHours }); setShowStaffModal(true); }} className={`px-2.5 py-1 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'} rounded-lg`}>Edit</button>
                              <button onClick={() => handleDeleteStaffRole(sr.id)} className="px-2.5 py-1 bg-rose-600/20 text-rose-400 rounded-lg">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-6 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Transportation Rate Options</h4>
                      <p className="text-xs text-slate-400">Define transportation billing types (mileage, hourly, or flat rate) applied to away trips.</p>
                    </div>
                    <button onClick={() => { setEditingTransportId(null); setTransportFormData({ modeName: '', rateType: 'mileage', rateValue: 3.50 }); setShowTransportModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow">
                      <Plus className="w-4 h-4"/> Add Transport Option
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                          <th className="pb-3 font-semibold">Mode Name</th>
                          <th className="pb-3 font-semibold">Rate Type</th>
                          <th className="pb-3 font-semibold">Rate Value</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-900' : 'divide-slate-200'}`}>
                        {transportModes.map(tm => (
                          <tr key={tm.id}>
                            <td className={`py-3 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{tm.modeName}</td>
                            <td className="py-3 text-slate-400 uppercase text-[10px] font-semibold">{tm.rateType}</td>
                            <td className="py-3 font-bold text-indigo-400">
                              {tm.rateType === 'mileage' ? `$${tm.rateValue.toFixed(2)} / mi` : tm.rateType === 'hourly' ? `$${tm.rateValue.toFixed(2)} / hr` : `$${tm.rateValue.toFixed(2)} flat`}
                            </td>
                            <td className="py-3 text-right space-x-2">
                              <button onClick={() => { setEditingTransportId(tm.id); setTransportFormData({ modeName: tm.modeName, rateType: tm.rateType, rateValue: tm.rateValue }); setShowTransportModal(true); }} className={`px-2.5 py-1 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'} rounded-lg`}>Edit</button>
                              <button onClick={() => handleDeleteTransportMode(tm.id)} className="px-2.5 py-1 bg-rose-600/20 text-rose-400 rounded-lg">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submit' && (
            <div className={`max-w-3xl mx-auto ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl p-6 shadow-xl space-y-6`}>
              
              {/* CSV Importer */}
              <div className={`p-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4`}>
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Bulk CSV Schedule Importer</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Format: Sport, Opponent, LocationType, VenueName, Date (YYYY-MM-DD), Time, Notes</p>
                </div>
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow">
                  Upload CSV File
                  <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                </label>
              </div>

              <div>
                <h3 className="text-base font-bold">
                  {editingScheduleId ? 'Edit Schedule Event' : (role === 'admin' ? 'Administrative Master Schedule Entry' : `Submit Schedule for ${currentUserSport}`)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Enter contest details below to evaluate venue availability and projected travel/hosting budgets.</p>
              </div>

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
                        <option value="">-- Select Opponent --</option>
                        {opponents.map(o => <option key={o.id} value={o.name}>{o.name} ({o.isConference ? 'Conf' : 'Non-Conf'})</option>)}
                      </select>
                      <button type="button" onClick={() => { setEditingOpponentId(null); setNewOpponentData({ name: '', location: '', distance: 100, travelTime: '2h 0m', isConference: true }); setShowOpponentModal(true); }} className="px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-semibold">
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

                {formData.locationType === 'Neutral' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Neutral Site / Location Name</label>
                    <input type="text" value={formData.neutralLocationName} onChange={(e) => setFormData({...formData, neutralLocationName: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="e.g. Regional Championship Complex" />
                  </div>
                )}

                {formData.locationType === 'Tournament' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tournament Details (Other Teams & Game Times)</label>
                    <textarea rows="2" value={formData.tournamentDetails} onChange={(e) => setFormData({...formData, tournamentDetails: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="Game 2 vs Team B @ 7:00 PM, etc."></textarea>
                  </div>
                )}

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
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Teardown Buffer</label>
                    <input type="text" disabled value={formData.locationType === 'Home' ? '0 mins (None)' : `${(sportConfigs[formData.sport] || {}).teardownMinutes || 30} mins`} className={`w-full ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'} border rounded-xl px-3 py-2 text-sm`} />
                  </div>
                </div>

                {formData.locationType === 'Away' && (
                  <div className={`p-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl space-y-3`}>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Travel, Logistics & Projected Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Party Size</label>
                        <input type="number" value={formData.travelPartySize} onChange={(e) => handleOpponentOrTripChange({ travelPartySize: Number(e.target.value) })} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Mode</label>
                        <select value={formData.travelMode} onChange={(e) => handleOpponentOrTripChange({ travelMode: e.target.value })} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                          {transportModes.map(tm => <option key={tm.id} value={tm.modeName}>{tm.modeName}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center pt-5">
                        <input type="checkbox" id="overnight" checked={formData.overnightTravel} onChange={(e) => handleOpponentOrTripChange({ overnightTravel: e.target.checked })} className="rounded text-indigo-600 w-4 h-4" />
                        <label htmlFor="overnight" className="ml-2 text-xs font-medium">Overnight Trip (Hotel & Meals)</label>
                      </div>
                    </div>

                    {formData.overnightTravel && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Hotel Rooms Count</label>
                          <input type="number" value={formData.hotelRoomsCount} onChange={(e) => handleOpponentOrTripChange({ hotelRoomsCount: Number(e.target.value) })} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Cost Per Room / Night ($)</label>
                          <input type="number" value={formData.customHotelCostPerNight} onChange={(e) => handleOpponentOrTripChange({ customHotelCostPerNight: Number(e.target.value) })} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Departure Date & Time</label>
                          <input type="datetime-local" value={formData.departureDate} onChange={(e) => setFormData({...formData, departureDate: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Return Date & Time</label>
                          <input type="datetime-local" value={formData.returnDate} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 text-xs text-indigo-300 flex justify-between">
                      <span>Projected Travel Expense: <strong>${formData.travelCost.toLocaleString()}</strong></span>
                      <span>Projected Lodging: <strong>${formData.hotelCost.toLocaleString()}</strong></span>
                      <span>Projected Meals: <strong>${formData.mealCost.toLocaleString()}</strong></span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Special Requirements</label>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="Broadcast needs, equipment truck, etc."></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  {editingScheduleId && (
                    <button type="button" onClick={() => { setEditingScheduleId(null); setActiveTab('dashboard'); }} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg">
                    {editingScheduleId ? 'Update Schedule Event' : (role === 'admin' ? 'Save Master Schedule Event' : 'Submit Schedule for Review')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Active Venue Conflicts & Audit Log</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>Real-time detection of overlapping venue assignments including warmup and teardown buffers.</p>
              </div>

              <div className="space-y-3">
                {activeConflictsList.length === 0 ? (
                  <div className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-md'} border rounded-2xl p-8 text-center`}>
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3"/>
                    <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Zero Venue Conflicts Detected</h4>
                    <p className="text-xs text-slate-400 mt-1">All scheduled athletic contests comply with facility availability rules.</p>
                  </div>
                ) : (
                  activeConflictsList.map(c => (
                    <div key={c.id} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-3 text-rose-400">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                      <div>
                        <h4 className="text-sm font-bold">{c.title}</h4>
                        <p className="text-xs mt-0.5 text-slate-300">{c.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
