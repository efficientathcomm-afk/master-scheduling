import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, DollarSign, Users, Shield, AlertTriangle, 
  CheckCircle, XCircle, Plus, Filter, Search, ChevronRight, Download, 
  Bus, Utensils, Award, FileText, Settings, RefreshCw, Layers, Check, X,
  Grid, Globe, Compass, Briefcase, Eye, Edit3, Trash2, Cloud, CloudOff, Award as Trophy, Send, Sun, Moon
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
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

// --- INITIAL STATE ARRAYS ---
const INITIAL_VENUES = [];
const INITIAL_OPPONENTS = [];
const INITIAL_SPORT_CONFIGS = {};
const INITIAL_STAFF_ROLES = [];
const INITIAL_TRANSPORT_MODES = [];
const INITIAL_STUDENT_WORKER_SETTINGS = {
  hourlyRate: 15.00,
  prepAndTeardownMinutes: 90
};
const INITIAL_SCHEDULES = [];

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Local Mode Active');
  const [darkMode, setDarkMode] = useState(true);

  // Application State
  const [role, setRole] = useState('admin');
  const [currentUserSport, setCurrentUserSport] = useState('Football');
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [opponents, setOpponents] = useState(INITIAL_OPPONENTS);
  const [sportConfigs, setSportConfigs] = useState(INITIAL_SPORT_CONFIGS);
  const [staffRoles, setStaffRoles] = useState(INITIAL_STAFF_ROLES);
  const [transportModes, setTransportModes] = useState(INITIAL_TRANSPORT_MODES);
  const [studentWorkerConfig, setStudentWorkerConfig] = useState(INITIAL_STUDENT_WORKER_SETTINGS);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgetSubTab, setBudgetSubTab] = useState('summary');
  const [selectedSportDetail, setSelectedSportDetail] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Modals
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [editingOpponentId, setEditingOpponentId] = useState(null);
  const [newOpponentData, setNewOpponentData] = useState({ name: '', location: '', distance: 100, travelTime: '2h 0m', isConference: true });

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffFormData, setStaffFormData] = useState({ roleName: '', rateType: 'hourly', rateValue: 18, defaultHours: 4 });

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
    defaultVenueId: '',
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

  const [formData, setFormData] = useState({
    sport: 'Football',
    coachName: 'Coach Marcus Vance',
    opponent: '',
    locationType: 'Home',
    venueId: '',
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
        setSchedules(loaded);
        setSyncStatus('Synced');
      },
      (err) => { setSyncStatus('Sync Error: ' + err.message); }
    );

    const unsubscribeOpponents = onSnapshot(opponentsRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        setOpponents(loaded);
      },
      (err) => {}
    );

    const unsubscribeVenues = onSnapshot(venuesRef, 
      (snapshot) => {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        setVenues(loaded);
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
        setSportConfigs(loadedObj);
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
        venueId: config.defaultVenueId || prev.venueId,
        durationHours: config.defaultDuration || 2.5,
        warmupMinutes: config.warmupMinutes || 45,
        teardownMinutes: config.teardownMinutes || 30
      }));
    }
  };

  const calculateCosts = (oppName, locType, overnight, partySize, sportName, tMode, roomsCount, hotelRate, durationHrs) => {
    const oppObj = opponents.find(o => o.name === oppName);
    const config = sportConfigs[sportName] || { officialsCost: 600, staffCost: 300, studentStaffCount: 4 };
    const distance = oppObj ? oppObj.distance : 100;
    
    let travel = 0, meals = 0, hotel = 0, hosting = 0, studentWorkerCost = 0;
    const isHome = locType === 'Home' || locType === 'Tournament';

    if (isHome) {
      let rolesHostingTotal = 0;
      staffRoles.forEach(sr => {
        if (sr.rateType === 'flat') {
          rolesHostingTotal += Number(sr.rateValue || 0);
        } else {
          rolesHostingTotal += Number(sr.rateValue || 0) * Number(sr.defaultHours || 4);
        }
      });

      const totalGameHours = Number(durationHrs || 2.5) + (Number(studentWorkerConfig.prepAndTeardownMinutes || 90) / 60);
      const studentWorkersTotal = Number(config.studentStaffCount || 4) * Number(studentWorkerConfig.hourlyRate || 15) * totalGameHours;

      hosting = Number(config.officialsCost || 600) + rolesHostingTotal + studentWorkersTotal;
      studentWorkerCost = studentWorkersTotal;
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
    return { travel, meals, hotel, hosting, studentWorkerCost };
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
      nextData.customHotelCostPerNight,
      nextData.durationHours
    );
    setFormData({
      ...nextData,
      travelCost: costs.travel,
      mealCost: costs.meals,
      hotelCost: costs.hotel,
      hostingCost: costs.hosting,
      studentWorkerCost: costs.studentWorkerCost
    });
  };

  const handleLocationTypeChange = (locType) => {
    const isHome = locType === 'Home';
    const config = sportConfigs[formData.sport];
    const venueId = isHome ? (config ? config.defaultVenueId : (venues[0]?.id || '')) : 'Away';
    handleOpponentOrTripChange({ locationType: locType, venueId, teardownMinutes: isHome ? 0 : 30 });
  };

  const handleEditScheduleClick = (ev) => {
    setEditingScheduleId(ev.id);
    setFormData({
      sport: ev.sport || Object.keys(sportConfigs)[0] || '',
      coachName: ev.coachName || '',
      opponent: ev.opponent || '',
      locationType: ev.locationType || 'Home',
      venueId: ev.venueId || '',
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
      travelMode: ev.travelMode || '',
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

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
    }
    return dateStr;
  };

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
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sports', key.replace(/[^a-zA-Z0-9]/g, '_')));
    } catch (err) {}
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
    setStaffFormData({ roleName: '', rateType: 'hourly', rateValue: 18, defaultHours: 4 });
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
              sport: sport || '',
              coachName: 'Imported Schedule',
              opponent: opponent || '',
              locationType: locationType || 'Home',
              venueId: venue?.id || '',
              venueName: venue?.name || '',
              date: date || '',
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
              travelMode: '',
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
          showNotice('No valid rows found in CSV.', 'error');
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
    let totalTravel = 0, totalMeals = 0, totalHotel = 0, totalHosting = 0, totalStudentWorkers = 0;
    const bySport = {};

    schedules.forEach(s => {
      if (s.status === 'Rejected') return;
      const t = Number(s.travelCost || 0);
      const m = Number(s.mealCost || 0);
      const h = Number(s.hotelCost || 0);
      const host = Number(s.hostingCost || 0);
      
      const config = sportConfigs[s.sport] || {};
      const isHome = s.locationType === 'Home' || s.locationType === 'Tournament';
      const swCost = isHome ? (Number(config.studentStaffCount || 4) * Number(studentWorkerConfig.hourlyRate || 15) * (Number(s.durationHours || 2.5) + (Number(studentWorkerConfig.prepAndTeardownMinutes || 90) / 60))) : 0;

      totalTravel += t;
      totalMeals += m;
      totalHotel += h;
      totalHosting += host;
      totalStudentWorkers += swCost;

      if (!bySport[s.sport]) {
        bySport[s.sport] = { travel: 0, meals: 0, hotel: 0, hosting: 0, studentWorkers: 0, count: 0 };
      }
      bySport[s.sport].travel += t;
      bySport[s.sport].meals += m;
      bySport[s.sport].hotel += h;
      bySport[s.sport].hosting += host;
      bySport[s.sport].studentWorkers += swCost;
      bySport[s.sport].count += 1;
    });

    const grandTotal = totalTravel + totalMeals + totalHotel + totalHosting;
    return { totalTravel, totalMeals, totalHotel, totalHosting, totalStudentWorkers, grandTotal, bySport };
  }, [schedules, studentWorkerConfig, sportConfigs]);

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
      
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-white transition-all transform animate-bounce ${
          notification.type === 'error' ? 'bg-rose-600' : notification.type === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
        }`}>
          {notification.type === 'error' ? <XCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className={`${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-md sticky top-0 z-40 border-b px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Athletics Master Scheduling & Budget</h1>
            <p className="text-xs text-slate-400">Collegiate Department Portal • {syncStatus}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-800 text-amber-400' : 'border-slate-300 bg-slate-100 text-slate-700'} transition-all`}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-slate-100'}`}>
            <Users className="w-4 h-4 text-indigo-400" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer">
              <option value="admin" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Administrator View</option>
              <option value="coach" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Coach View</option>
            </select>
          </div>

          {role === 'coach' && (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-slate-100'}`}>
              <span className="text-xs font-semibold text-slate-400">Sport:</span>
              <select value={currentUserSport} onChange={(e) => setCurrentUserSport(e.target.value)} className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer">
                {Object.keys(sportConfigs).length > 0 ? (
                  Object.keys(sportConfigs).map(s => <option key={s} value={s} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{s}</option>)
                ) : (
                  <option value="Football">Football</option>
                )}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* SUB-NAV TABS */}
      <nav className={`${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100 border-slate-200'} border-b px-6 flex space-x-2 overflow-x-auto`}>
        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'dashboard' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <Layers className="w-4 h-4" />
          <span>{role === 'admin' ? 'Master Dashboard' : 'My Schedule'}</span>
        </button>

        <button onClick={() => setActiveTab('submit')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'submit' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <Plus className="w-4 h-4" />
          <span>Schedule Actions</span>
        </button>

        <button onClick={() => setActiveTab('calendar')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'calendar' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <Calendar className="w-4 h-4" />
          <span>Master Venue Matrix</span>
        </button>

        <button onClick={() => setActiveTab('venues')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'venues' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <MapPin className="w-4 h-4" />
          <span>Venues</span>
        </button>

        <button onClick={() => setActiveTab('opponents')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'opponents' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <Compass className="w-4 h-4" />
          <span>Opponents</span>
        </button>

        <button onClick={() => setActiveTab('sports')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'sports' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <Award className="w-4 h-4" />
          <span>Sports Config</span>
        </button>

        <button onClick={() => setActiveTab('budget')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'budget' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <DollarSign className="w-4 h-4" />
          <span>Budget & Projections</span>
        </button>

        <button onClick={() => setActiveTab('conflicts')} className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${activeTab === 'conflicts' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <AlertTriangle className="w-4 h-4" />
          <span>Conflict Audit ({activeConflictsList.length})</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Schedule & Budget Overview</h2>
                <p className="text-xs text-slate-400">Review, approve, and audit scheduled athletic contests.</p>
              </div>
              <div className="flex items-center space-x-3">
                <label className={`px-4 py-2 rounded-xl text-xs font-semibold ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} cursor-pointer flex items-center space-x-2`}>
                  <Download className="w-4 h-4" />
                  <span>Import CSV Events</span>
                  <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                </label>
                <button onClick={() => setActiveTab('submit')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/30">
                  <Plus className="w-4 h-4" />
                  <span>Add New Event</span>
                </button>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Scheduled</p>
                <h3 className="text-2xl font-bold mt-1">{displayedSchedules.length}</h3>
              </div>
              <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Budget</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-400">${budgetSummary.grandTotal.toLocaleString()}</h3>
              </div>
              <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Conflicts</p>
                <h3 className="text-2xl font-bold mt-1 text-rose-400">{activeConflictsList.length}</h3>
              </div>
              <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Venues Available</p>
                <h3 className="text-2xl font-bold mt-1">{venues.length}</h3>
              </div>
            </div>

            {/* SCHEDULE TABLE */}
            <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl overflow-hidden shadow-sm`}>
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm">Contest Submissions & Approvals</h3>
                <span className="text-xs text-slate-400">{displayedSchedules.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-900/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b text-xs uppercase tracking-wider`}>
                      <th className="p-4">Sport</th>
                      <th className="p-4">Opponent</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Venue</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {displayedSchedules.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-slate-500 text-xs">No scheduled events found. Click "Add New Event" or import via CSV.</td>
                      </tr>
                    ) : (
                      displayedSchedules.map((ev) => (
                        <tr key={ev.id} className={`${darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'} transition-all`}>
                          <td className="p-4 font-semibold">{ev.sport}</td>
                          <td className="p-4">vs {ev.opponent}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              ev.locationType === 'Home' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              ev.locationType === 'Away' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>{ev.locationType}</span>
                          </td>
                          <td className="p-4 text-xs text-slate-300">
                            {formatDateDisplay(ev.date)} {formatTimeDisplay(ev.time)}
                          </td>
                          <td className="p-4 text-xs text-slate-300">{ev.venueName || 'TBD'}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              ev.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                              ev.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>{ev.status || 'Pending'}</span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => handleEditScheduleClick(ev)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all" title="Edit">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {role === 'admin' && ev.status === 'Pending' && (
                              <>
                                <button onClick={() => updateStatus(ev.id, 'Approved')} className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-all" title="Approve">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => updateStatus(ev.id, 'Rejected')} className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition-all" title="Reject">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button onClick={() => deleteSchedule(ev.id)} className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition-all" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE ACTIONS (QUICK-ACTION SUBMIT) */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{editingScheduleId ? 'Edit Event Schedule' : 'Schedule Quick Actions'}</h2>
                <p className="text-xs text-slate-400">Configure contest logistics, venue allocation, and travel budget parameters.</p>
              </div>
              <button onClick={() => setActiveTab('dashboard')} className="text-xs text-slate-400 hover:text-white">Back to Dashboard</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className={`${darkMode ? 'bg-slate-950/60 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl p-6 shadow-xl space-y-6`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sport</label>
                  <select value={formData.sport} onChange={(e) => handleSportChange(e.target.value)} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                    {Object.keys(sportConfigs).length > 0 ? (
                      Object.keys(sportConfigs).map(s => <option key={s} value={s}>{s}</option>)
                    ) : (
                      <option value="Football">Football</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location Type</label>
                  <select value={formData.locationType} onChange={(e) => handleLocationTypeChange(e.target.value)} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                    <option value="Home">Home Contest</option>
                    <option value="Away">Away Contest</option>
                    <option value="Neutral">Neutral Site</option>
                    <option value="Tournament">Tournament Hosting</option>
                    <option value="Postseason">Postseason (Tentative)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Opponent</label>
                  <select value={formData.opponent} onChange={(e) => handleOpponentOrTripChange({ opponent: e.target.value })} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                    <option value="">-- Select Opponent --</option>
                    {opponents.map(o => <option key={o.id} value={o.name}>{o.name} ({o.location})</option>)}
                  </select>
                </div>
                {formData.locationType === 'Home' || formData.locationType === 'Tournament' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Venue</label>
                    <select value={formData.venueId} onChange={(e) => setFormData({...formData, venueId: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                      {venues.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Neutral / Destination Name</label>
                    <input type="text" value={formData.neutralLocationName} onChange={(e) => setFormData({...formData, neutralLocationName: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="City or Stadium" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                </div>
              </div>

              {formData.locationType !== 'Home' && (
                <div className={`${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4 space-y-4`}>
                  <h4 className="font-semibold text-xs text-indigo-400 uppercase tracking-wider">Travel & Lodging Logistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Mode</label>
                      <select value={formData.travelMode} onChange={(e) => handleOpponentOrTripChange({ travelMode: e.target.value })} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`}>
                        <option value="">-- Select Mode --</option>
                        {transportModes.map(tm => <option key={tm.id} value={tm.modeName}>{tm.modeName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Party Size</label>
                      <input type="number" value={formData.travelPartySize} onChange={(e) => handleOpponentOrTripChange({ travelPartySize: Number(e.target.value) })} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input type="checkbox" id="overnight" checked={formData.overnightTravel} onChange={(e) => handleOpponentOrTripChange({ overnightTravel: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                    <label htmlFor="overnight" className="text-xs font-semibold">Overnight Stay Required</label>
                  </div>

                  {formData.overnightTravel && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Hotel Rooms Count</label>
                        <input type="number" value={formData.hotelRoomsCount} onChange={(e) => handleOpponentOrTripChange({ hotelRoomsCount: Number(e.target.value) })} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Cost Per Room / Night ($)</label>
                        <input type="number" value={formData.customHotelCostPerNight} onChange={(e) => handleOpponentOrTripChange({ customHotelCostPerNight: Number(e.target.value) })} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Additional Info</label>
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} placeholder="Special broadcast requirements, uniform color, etc." />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setActiveTab('dashboard')} className="px-4 py-2 text-xs font-semibold text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30">
                  {editingScheduleId ? 'Update Schedule Entry' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: MASTER VENUE MATRIX CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Master Venue Side-by-Side Matrix</h2>
              <p className="text-xs text-slate-400">Visual calendar representation of facility allocations and schedule overlaps.</p>
            </div>

            <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-6 shadow-sm overflow-x-auto`}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {venues.map(venue => (
                  <div key={venue.id} className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border rounded-xl p-4 flex flex-col space-y-3`}>
                    <div className="border-b border-slate-800 pb-2">
                      <h4 className="font-bold text-sm text-indigo-400">{venue.name}</h4>
                      <p className="text-xs text-slate-400">{venue.type} • Cap: {venue.capacity}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {schedules.filter(s => s.venueId === venue.id && s.status !== 'Rejected').length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-4 text-center">No events scheduled</p>
                      ) : (
                        schedules.filter(s => s.venueId === venue.id && s.status !== 'Rejected').map(ev => (
                          <div key={ev.id} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'} border rounded-lg p-3 text-xs space-y-1 shadow-sm`}>
                            <div className="font-bold text-indigo-300">{ev.sport} vs {ev.opponent}</div>
                            <div className="text-slate-400">{formatDateDisplay(ev.date)} @ {formatTimeDisplay(ev.time)}</div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">{ev.status}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VENUES */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Venue Directory</h2>
                <p className="text-xs text-slate-400">Manage athletic facilities and capacities.</p>
              </div>
              <button onClick={() => { setEditingVenue(null); setShowVenueModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Venue</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map(v => (
                <div key={v.id} className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base">{v.name}</h3>
                    <button onClick={() => handleDeleteVenue(v.id)} className="text-rose-400 hover:text-rose-300 text-xs">Delete</button>
                  </div>
                  <p className="text-xs text-slate-400">Type: {v.type}</p>
                  <p className="text-xs text-slate-400">Capacity: {v.capacity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: OPPONENTS */}
        {activeTab === 'opponents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Master Opponent Directory</h2>
                <p className="text-xs text-slate-400">Configure opponent travel distances, locations, and conference statuses.</p>
              </div>
              <button onClick={() => { setEditingOpponentId(null); setShowOpponentModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Opponent</span>
              </button>
            </div>

            <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl overflow-hidden shadow-sm`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b text-xs uppercase`}>
                    <th className="p-4">Opponent Name</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Distance (Miles)</th>
                    <th className="p-4">Travel Time</th>
                    <th className="p-4">Conference?</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {opponents.map(o => (
                    <tr key={o.id}>
                      <td className="p-4 font-semibold">{o.name}</td>
                      <td className="p-4 text-slate-300">{o.location}</td>
                      <td className="p-4 text-slate-300">{o.distance} mi</td>
                      <td className="p-4 text-slate-300">{o.travelTime}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${o.isConference ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          {o.isConference ? 'Conference' : 'Non-Conf'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => { setEditingOpponentId(o.id); setNewOpponentData(o); setShowOpponentModal(true); }} className="p-1.5 rounded bg-slate-800 text-slate-300"><Edit3 className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteOpponent(o.id)} className="p-1.5 rounded bg-rose-600/20 text-rose-400"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SPORTS CONFIG */}
        {activeTab === 'sports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Sport Configurations & Defaults</h2>
                <p className="text-xs text-slate-400">Configure default venues, warmup times, officials costs, and sport tiers.</p>
              </div>
              <button onClick={() => { setEditingSportKey(null); setSportFormData({name: '', defaultVenueId: venues[0]?.id || '', defaultDuration: 2.5, warmupMinutes: 45, arrivalBufferHours: 2, departureBufferHours: 1, teardownMinutes: 30, tier: 'Tier 2', officialsCost: 600, staffCost: 350, rosterSize: 25, studentStaffCount: 4}); setShowSportModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Sport</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(sportConfigs).length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-xs">No sport configurations defined yet. Click "Add Sport" to configure.</div>
              ) : (
                Object.entries(sportConfigs).map(([key, cfg]) => (
                  <div key={key} className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 shadow-sm space-y-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base">{cfg.name}</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400">{cfg.tier || 'Tier 2'}</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Warmup Buffer: {cfg.warmupMinutes} mins</p>
                      <p>Officials Cost: ${cfg.officialsCost}</p>
                      <p>Student Staff Count: {cfg.studentStaffCount}</p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button onClick={() => { setEditingSportKey(key); setSportFormData(cfg); setShowSportModal(true); }} className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-300">Edit</button>
                      <button onClick={() => handleDeleteSport(key)} className="px-3 py-1 rounded bg-rose-600/20 text-xs text-rose-400">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: BUDGET & PROJECTIONS */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Budget & Cost Projections</h2>
                <p className="text-xs text-slate-400">Comprehensive departmental financial summary and staffing/transportation rates.</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setBudgetSubTab('summary')} className={`px-4 py-2 rounded-xl text-xs font-semibold ${budgetSubTab === 'summary' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Dashboard Summary</button>
                <button onClick={() => setBudgetSubTab('staffing')} className={`px-4 py-2 rounded-xl text-xs font-semibold ${budgetSubTab === 'staffing' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Home Staffing & Student Workers</button>
                <button onClick={() => setBudgetSubTab('transport')} className={`px-4 py-2 rounded-xl text-xs font-semibold ${budgetSubTab === 'transport' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Transportation Rates</button>
              </div>
            </div>

            {budgetSubTab === 'summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Travel Expenses</p>
                    <h3 className="text-xl font-bold mt-1 text-indigo-400">${budgetSummary.totalTravel.toLocaleString()}</h3>
                  </div>
                  <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Meal Expenses</p>
                    <h3 className="text-xl font-bold mt-1 text-emerald-400">${budgetSummary.totalMeals.toLocaleString()}</h3>
                  </div>
                  <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Lodging / Hotel</p>
                    <h3 className="text-xl font-bold mt-1 text-amber-400">${budgetSummary.totalHotel.toLocaleString()}</h3>
                  </div>
                  <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Hosting & Officials</p>
                    <h3 className="text-xl font-bold mt-1 text-purple-400">${budgetSummary.totalHosting.toLocaleString()}</h3>
                  </div>
                  <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Student Workers</p>
                    <h3 className="text-xl font-bold mt-1 text-rose-400">${budgetSummary.totalStudentWorkers.toLocaleString()}</h3>
                  </div>
                </div>

                {/* SPORT BREAKDOWN */}
                <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-6 shadow-sm`}>
                  <h3 className="font-bold text-base mb-4">Budget Breakdown by Sport</h3>
                  <div className="space-y-4">
                    {Object.keys(budgetSummary.bySport).length === 0 ? (
                      <p className="text-xs text-slate-500">No scheduled contests to project budget.</p>
                    ) : (
                      Object.entries(budgetSummary.bySport).map(([sportName, data]) => (
                        <div key={sportName} className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border rounded-xl p-4 flex items-center justify-between`}>
                          <div>
                            <h4 className="font-bold text-sm text-indigo-400">{sportName}</h4>
                            <p className="text-xs text-slate-400">{data.count} contests scheduled</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-base">${(data.travel + data.meals + data.hotel + data.hosting + data.studentWorkers).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {budgetSubTab === 'staffing' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">Student Worker & Home Staffing Roles</h3>
                    <p className="text-xs text-slate-400">Configure hourly rates and flat rates for event staffing.</p>
                  </div>
                  <button onClick={() => { setEditingStaffId(null); setShowStaffModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Staff Role</span>
                  </button>
                </div>

                <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-6 shadow-sm space-y-4`}>
                  <h4 className="font-semibold text-sm text-indigo-400">Student Worker General Settings</h4>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Hourly Rate ($/hr)</label>
                      <input type="number" step="0.5" value={studentWorkerConfig.hourlyRate} onChange={(e) => setStudentWorkerConfig({...studentWorkerConfig, hourlyRate: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Prep & Teardown Time (Mins)</label>
                      <input type="number" value={studentWorkerConfig.prepAndTeardownMinutes} onChange={(e) => setStudentWorkerConfig({...studentWorkerConfig, prepAndTeardownMinutes: Number(e.target.value)})} className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2 text-sm`} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffRoles.map(sr => (
                    <div key={sr.id} className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 shadow-sm space-y-2`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{sr.roleName}</h4>
                        <button onClick={() => handleDeleteStaffRole(sr.id)} className="text-rose-400 text-xs">Delete</button>
                      </div>
                      <p className="text-xs text-slate-400">Rate: ${sr.rateValue} ({sr.rateType})</p>
                      {sr.rateType === 'hourly' && <p className="text-xs text-slate-400">Default Hours: {sr.defaultHours} hrs</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {budgetSubTab === 'transport' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base">Transportation Rate Options</h3>
                  <button onClick={() => { setEditingTransportId(null); setShowTransportModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Transport Mode</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transportModes.map(tm => (
                    <div key={tm.id} className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 shadow-sm space-y-2`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{tm.modeName}</h4>
                        <button onClick={() => handleDeleteTransportMode(tm.id)} className="text-rose-400 text-xs">Delete</button>
                      </div>
                      <p className="text-xs text-slate-400">Rate Type: {tm.rateType}</p>
                      <p className="text-xs text-slate-400">Value: ${tm.rateValue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: CONFLICT AUDIT */}
        {activeTab === 'conflicts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Conflict Audit & Venue Double-Bookings</h2>
              <p className="text-xs text-slate-400">Review venue clashes and warmup buffer overlaps across sports.</p>
            </div>

            <div className={`${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-6 shadow-sm space-y-4`}>
              {activeConflictsList.length === 0 ? (
                <div className="text-center py-12 text-emerald-400 text-sm font-semibold flex flex-col items-center space-y-2">
                  <CheckCircle className="w-8 h-8" />
                  <span>No schedule or venue conflicts detected!</span>
                </div>
              ) : (
                activeConflictsList.map((cf) => (
                  <div key={cf.id} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-3 text-rose-300">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">{cf.title}</h4>
                      <p className="text-xs mt-1">{cf.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
