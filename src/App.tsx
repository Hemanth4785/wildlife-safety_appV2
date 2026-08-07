import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { 
  Home as HomeIcon, 
  Layers, 
  MessageCircle, 
  List, 
  User as UserIcon, 
  Shield, 
  Cloud, 
  AlertTriangle, 
  Navigation, 
  BarChart3, 
  MapPin, 
  Filter, 
  Calendar,
  Camera, 
  Image as ImageIcon, 
  Send, 
  ArrowUp, 
  Compass, 
  Plus, 
  CheckCircle2, 
  PhoneCall, 
  Lock, 
  Mail, 
  ChevronRight, 
  RotateCcw,
  Locate,
  Car,
  Bike,
  X,
  Activity,
  Info,
  TrendingUp,
  Clock,
  Eye,
  Check,
  Trash2
} from 'lucide-react';
import { View, AnimalPrediction, Report, User, ChatMessage, TravelMode, WildlifeMarkerData } from './types';
import { ANIMALS, SPECIES_IMAGES } from '../constants/Wildlife';
import { fetchOSRMRoute } from './services/osrmService';
import { generateCorridorPredictions } from './services/predictionService';
import { sendChatMessage } from './services/chatService';
import { InteractiveMap } from './components/InteractiveMap';
import { FilterModal, getItemDateStr, normalizeSpecies } from './components/FilterModal';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Chip } from './components/ui/Chip';
import { Input } from './components/ui/Input';

function getRelativeDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const WILDLIFE_MARKERS: (WildlifeMarkerData & { date?: string })[] = [
  {
    id: 'wm-1',
    scientific: 'Elephas maximus',
    common: 'Asian Elephant',
    emoji: '🐘',
    color: '#64748b',
    image: SPECIES_IMAGES['Elephas maximus'],
    lat: 11.412,
    lon: 76.698,
    locationName: 'Mudumalai Forest Border (km 14)',
    distKm: 1.8,
    riskLevel: 'HIGH',
    confidence: '94%',
    lastSeen: '15 minutes ago',
    date: getRelativeDateStr(0),
    movementStatus: 'Moving North-East toward Moyar River',
    weather: '22°C | Overcast',
    conservationStatus: 'Endangered (IUCN)',
    behaviour: 'Elephants often move in family herds during twilight hours. They frequently cross the highway near natural water streams. Maintain at least 100 meters distance and never use loud horns.',
    trajectory: [
      { lat: 11.412, lon: 76.698, timeAhead: 'Now' },
      { lat: 11.418, lon: 76.702, timeAhead: '+15 min' },
      { lat: 11.425, lon: 76.710, timeAhead: '+30 min' },
      { lat: 11.432, lon: 76.720, timeAhead: '+45 min' }
    ],
    movementPaths: generateCorridorPredictions('Asian Elephant', 11.412, 76.698, 'HIGH')
  },
  {
    id: 'wm-2',
    scientific: 'Panthera tigris',
    common: 'Bengal Tiger',
    emoji: '🐅',
    color: '#f97316',
    image: SPECIES_IMAGES['Panthera tigris'],
    lat: 11.450,
    lon: 76.720,
    locationName: 'Bandipur Sanctuary Boundary',
    distKm: 8.5,
    riskLevel: 'MEDIUM',
    confidence: '91%',
    lastSeen: 'Yesterday (35 mins ago)',
    date: getRelativeDateStr(1),
    movementStatus: 'Patrolling West Corridor',
    weather: '21°C | Mist',
    conservationStatus: 'Endangered (IUCN)',
    behaviour: 'Tigers are solitary, nocturnal predators active near dense teak forests and stream beds. Avoid stopping or walking near reserve borders during dusk and night.',
    trajectory: [
      { lat: 11.450, lon: 76.720, timeAhead: 'Now' },
      { lat: 11.456, lon: 76.726, timeAhead: '+20 min' },
      { lat: 11.462, lon: 76.732, timeAhead: '+40 min' }
    ],
    movementPaths: generateCorridorPredictions('Bengal Tiger', 11.450, 76.720, 'MEDIUM')
  },
  {
    id: 'wm-3',
    scientific: 'Bos gaurus',
    common: 'Indian Gaur',
    emoji: '🦬',
    color: '#854d0e',
    image: SPECIES_IMAGES['Bos gaurus'],
    lat: 11.380,
    lon: 76.710,
    locationName: 'Coonoor Loop 3 Tea Gardens',
    distKm: 3.1,
    riskLevel: 'LOW',
    confidence: '89%',
    lastSeen: 'Aug 5 (2 days ago)',
    date: getRelativeDateStr(2),
    movementStatus: 'Grazing near estate border',
    weather: '19°C | Clear',
    conservationStatus: 'Vulnerable (IUCN)',
    behaviour: 'Indian Gaurs graze in small groups in tea estates and forest clearings. While generally peaceful, solitary bulls can turn aggressive if cornered or startled by sudden noises.',
    trajectory: [
      { lat: 11.380, lon: 76.710, timeAhead: 'Now' },
      { lat: 11.384, lon: 76.714, timeAhead: '+15 min' }
    ],
    movementPaths: generateCorridorPredictions('Indian Gaur', 11.380, 76.710, 'LOW')
  },
  {
    id: 'wm-4',
    scientific: 'Bison bison',
    common: 'Bison',
    emoji: '🦬',
    color: '#451a03',
    image: SPECIES_IMAGES['Bison bison'],
    lat: 11.395,
    lon: 76.680,
    locationName: 'Ketty Valley Pasture Crossing',
    distKm: 2.4,
    riskLevel: 'LOW',
    confidence: '87%',
    lastSeen: 'Aug 4 (3 days ago)',
    date: getRelativeDateStr(3),
    movementStatus: 'Resting near water reservoir',
    weather: '20°C | Partly Cloudy',
    conservationStatus: 'Near Threatened',
    behaviour: 'Bisons remain in open valley pastures near water bodies. Maintain at least 50 meters distance and drive at moderate speeds.',
    trajectory: [
      { lat: 11.395, lon: 76.680, timeAhead: 'Now' },
      { lat: 11.391, lon: 76.676, timeAhead: '+25 min' }
    ],
    movementPaths: generateCorridorPredictions('Bison', 11.395, 76.680, 'LOW')
  },
  {
    id: 'wm-5',
    scientific: 'Panthera pardus',
    common: 'Leopard',
    emoji: '🐆',
    color: '#eab308',
    image: SPECIES_IMAGES['Panthera pardus'],
    lat: 11.415,
    lon: 76.660,
    locationName: 'Pykara Lake Slope',
    distKm: 4.2,
    riskLevel: 'MEDIUM',
    confidence: '92%',
    lastSeen: 'Aug 2 (5 days ago)',
    date: getRelativeDateStr(5),
    movementStatus: 'Moving Southward through rocky terrain',
    weather: '18°C | Cool Breeze',
    conservationStatus: 'Vulnerable (IUCN)',
    behaviour: 'Leopards are secretive, agile hunters present around rocky outcrops and forest fringes. They avoid human contact but are active after twilight.',
    trajectory: [
      { lat: 11.415, lon: 76.660, timeAhead: 'Now' },
      { lat: 11.410, lon: 76.655, timeAhead: '+20 min' }
    ],
    movementPaths: generateCorridorPredictions('Leopard', 11.415, 76.660, 'MEDIUM')
  },
  {
    id: 'wm-6',
    scientific: 'Melursus ursinus',
    common: 'Sloth Bear',
    emoji: '🐻',
    color: '#78350f',
    image: SPECIES_IMAGES['Melursus ursinus'],
    lat: 11.360,
    lon: 76.740,
    locationName: 'Kotagiri Reserved Forest Boundary',
    distKm: 6.8,
    riskLevel: 'MEDIUM',
    confidence: '88%',
    lastSeen: 'Jul 30 (8 days ago)',
    date: getRelativeDateStr(8),
    movementStatus: 'Foraging near termite mounds',
    weather: '20°C | Foggy',
    conservationStatus: 'Vulnerable (IUCN)',
    behaviour: 'Sloth Bears have poor eyesight but acute hearing. They may react defensively if startled at close quarters. Speak in calm tones if walking near forest edges.',
    trajectory: [
      { lat: 11.360, lon: 76.740, timeAhead: 'Now' },
      { lat: 11.364, lon: 76.745, timeAhead: '+30 min' }
    ],
    movementPaths: generateCorridorPredictions('Sloth Bear', 11.360, 76.740, 'MEDIUM')
  }
];

const PRESET_DESTINATIONS = [
  { name: 'Mudumalai National Park, Nilgiris', lat: 11.564, lon: 76.534, distanceKm: 48.2 },
  { name: 'Bandipur Tiger Reserve, Karnataka', lat: 11.666, lon: 76.626, distanceKm: 62.0 },
  { name: 'Kotagiri Corridor, Tamil Nadu', lat: 11.420, lon: 76.880, distanceKm: 28.5 },
  { name: 'Coonoor Tea Estate Road, Nilgiris', lat: 11.353, lon: 76.795, distanceKm: 19.4 },
  { name: 'Wayanad Wildlife Sanctuary, Kerala', lat: 11.685, lon: 76.368, distanceKm: 78.3 }
];

const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-101',
    wildlifeType: 'Asian Elephant',
    location: 'Ooty-Gudalur Highway km 14',
    description: 'Herd of 3 elephants crossing road near stream bridge. Traffic temporarily stopped.',
    timestamp: '10 mins ago',
    lat: 11.412,
    lon: 76.698,
    userEmail: 'ranger.kumar@forest.gov.in',
    ai: {
      common: 'Asian Elephant',
      scientific: 'Elephas maximus',
      risk: 'Low',
      summary: 'Keep 100m distance and remain inside vehicle.'
    }
  }
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    role: 'model',
    text: "Hello! I'm Wildlife Guardian AI. I can help you with wildlife safety, route planning, movement predictions, travel precautions, and conservation information in South India. How can I help you today?"
  }
];

export default function App() {
  const {
    currentUser,
    isAuthenticated,
    authMode,
    setAuthMode,
    currentView,
    setCurrentView,
    reports,
    login,
    signup,
    logout,
    addReport: addFirestoreReport,
    deleteReport: deleteFirestoreReport
  } = useApp();

  const [email, setEmail] = useState('ranger@wildlife.gov.in');
  const [password, setPassword] = useState('••••••••');
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);


  // Route Planner States
  const [fromAddress, setFromAddress] = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number }>({ lat: 0, lon: 0 });
  const [toAddress, setToAddress] = useState('');
  const [toCoords, setToCoords] = useState<{ lat: number; lon: number }>({ lat: 0, lon: 0 });
  const [travelMode, setTravelMode] = useState<TravelMode>('car');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeSuccessMsg, setRouteSuccessMsg] = useState('');
  const [routeErrorMsg, setRouteErrorMsg] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSafeRouteActive, setIsSafeRouteActive] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'map' | 'config'>('map');

  // Dynamic Geocoding & Search Suggestions State
  const [fromSuggestions, setFromSuggestions] = useState<Array<{ name: string; address: string; lat: number; lon: number }>>([]);
  const [toSuggestions, setToSuggestions] = useState<Array<{ name: string; address: string; lat: number; lon: number }>>([]);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // Calculated Route Details
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);
  const [routeRiskLevel, setRouteRiskLevel] = useState<'LOW' | 'MODERATE' | 'HIGH'>('LOW');
  const [isFallbackRoute, setIsFallbackRoute] = useState(false);
  const [routeWarningMsg, setRouteWarningMsg] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]>>([]);

  // Handle Dynamic Geocoding Search Queries
  const handleSearchLocation = async (query: string, field: 'from' | 'to') => {
    if (!query || query.trim().length < 2) {
      if (field === 'from') {
        setFromSuggestions([]);
        setShowFromDropdown(false);
      } else {
        setToSuggestions([]);
        setShowToDropdown(false);
      }
      return;
    }

    if (field === 'from') setIsSearchingFrom(true);
    else setIsSearchingTo(true);

    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          if (field === 'from') {
            setFromSuggestions(data.results);
            setShowFromDropdown(data.results.length > 0);
          } else {
            setToSuggestions(data.results);
            setShowToDropdown(data.results.length > 0);
          }
        }
      }
    } catch (_e) {
      // Fail silently for search lookups
    } finally {
      if (field === 'from') setIsSearchingFrom(false);
      else setIsSearchingTo(false);
    }
  };

  const handleSelectFromSuggestion = (item: { name: string; address: string; lat: number; lon: number }) => {
    setFromAddress(item.name);
    setFromCoords({ lat: item.lat, lon: item.lon });
    setShowFromDropdown(false);
    setFromSuggestions([]);
  };

  const handleSelectToSuggestion = (item: { name: string; address: string; lat: number; lon: number }) => {
    setToAddress(item.name);
    setToCoords({ lat: item.lat, lon: item.lon });
    setShowToDropdown(false);
    setToSuggestions([]);
  };

  // Selected Animal for Bottom Sheet
  const [selectedAnimal, setSelectedAnimal] = useState<WildlifeMarkerData | null>(null);
  const [showingTrajectory, setShowingTrajectory] = useState(false);
  const [predictionData, setPredictionData] = useState<any | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Report Form State
  const [reportSubTab, setReportSubTab] = useState<'submit' | 'recent'>('submit');
  const [selectedAnimalChip, setSelectedAnimalChip] = useState('Asian Elephant');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [submittedReportIds, setSubmittedReportIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('my_submitted_report_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (_e) {
      return new Set();
    }
  });

  // Convert user reports into interactive map markers
  const reportMarkers: WildlifeMarkerData[] = reports.map((rep, idx) => {
    const animalType = rep.wildlifeType || 'Asian Elephant';
    let emoji = '🐘';
    let scientific = 'Elephas maximus';
    let color = '#64748b';
    let defaultImg = SPECIES_IMAGES['Elephas maximus'];

    if (animalType.toLowerCase().includes('tiger')) {
      emoji = '🐅';
      scientific = 'Panthera tigris';
      color = '#f97316';
      defaultImg = SPECIES_IMAGES['Panthera tigris'];
    } else if (animalType.toLowerCase().includes('leopard')) {
      emoji = '🐆';
      scientific = 'Panthera pardus';
      color = '#f97316';
      defaultImg = SPECIES_IMAGES['Panthera pardus'];
    } else if (animalType.toLowerCase().includes('bear')) {
      emoji = '🐻';
      scientific = 'Melursus ursinus';
      color = '#78350f';
      defaultImg = SPECIES_IMAGES['Melursus ursinus'];
    } else if (animalType.toLowerCase().includes('gaur')) {
      emoji = '🦬';
      scientific = 'Bos gaurus';
      color = '#854d0e';
      defaultImg = SPECIES_IMAGES['Bos gaurus'];
    } else if (animalType.toLowerCase().includes('bison')) {
      emoji = '🦬';
      scientific = 'Bison bison';
      color = '#451a03';
      defaultImg = SPECIES_IMAGES['Bison bison'];
    }

    let lat = rep.lat;
    let lon = rep.lon;

    if (!lat || !lon) {
      const match = PRESET_DESTINATIONS.find(p => p.name.toLowerCase().includes((rep.location || '').toLowerCase()));
      if (match) {
        lat = match.lat;
        lon = match.lon;
      } else {
        const charCode = (String(rep.id).charCodeAt(String(rep.id).length - 1) || idx) % 8;
        lat = 11.412 + (charCode - 4) * 0.012;
        lon = 76.698 + (charCode - 4) * 0.012;
      }
    }

    return {
      id: `rep-marker-${rep.id}`,
      isUserSubmitted: true,
      scientific: rep.ai?.scientific || scientific,
      common: animalType,
      emoji: emoji,
      color: color,
      image: rep.imageUri || defaultImg,
      lat: lat,
      lon: lon,
      locationName: rep.location || 'Reported Location',
      distKm: 1.2,
      riskLevel: (rep.ai?.risk?.toUpperCase() === 'HIGH' ? 'HIGH' : rep.ai?.risk?.toUpperCase() === 'MEDIUM' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
      confidence: 'Verified Sighting Report',
      lastSeen: rep.timestamp || 'Just now',
      date: rep.date,
      created_at: rep.created_at,
      movementStatus: `Reported by ${rep.userEmail || 'Ranger'}`,
      weather: 'Live Field Observation',
      conservationStatus: 'User Submission',
      behaviour: `${rep.description}${rep.userEmail ? `\n\nSubmitted by: ${rep.userEmail}` : ''}`,
      trajectory: [
        { lat, lon, timeAhead: 'Reported Location' }
      ]
    };
  });

  const allWildlifeMarkers = [...reportMarkers, ...WILDLIFE_MARKERS];

  // Filter Modal & Date Filter States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const filteredWildlifeMarkers = React.useMemo(() => {
    return allWildlifeMarkers.filter((wm) => {
      const itemDateStr = getItemDateStr(wm);
      if (fromDate && itemDateStr < fromDate) return false;
      if (toDate && itemDateStr > toDate) return false;
      if (filterSpecies && filterSpecies !== 'ALL' && normalizeSpecies(wm.common) !== normalizeSpecies(filterSpecies)) return false;
      if (filterRisk && filterRisk !== 'ALL' && wm.riskLevel !== filterRisk) return false;
      return true;
    });
  }, [allWildlifeMarkers, fromDate, toDate, filterSpecies, filterRisk]);

  const filteredReports = React.useMemo(() => {
    return reports.filter((rep) => {
      const itemDateStr = getItemDateStr(rep);
      if (fromDate && itemDateStr < fromDate) return false;
      if (toDate && itemDateStr > toDate) return false;
      if (filterSpecies && filterSpecies !== 'ALL' && normalizeSpecies(rep.wildlifeType || rep.ai?.common || '') !== normalizeSpecies(filterSpecies)) return false;
      if (filterRisk && filterRisk !== 'ALL' && rep.ai?.risk?.toUpperCase() !== filterRisk) return false;
      return true;
    });
  }, [reports, fromDate, toDate, filterSpecies, filterRisk]);

  const isDateFilterActive = Boolean(fromDate || toDate || (filterSpecies && filterSpecies !== 'ALL') || (filterRisk && filterRisk !== 'ALL'));

  // Keep selectedAnimal in sync with filtered items
  React.useEffect(() => {
    if (selectedAnimal && isDateFilterActive) {
      const isStillVisible = filteredWildlifeMarkers.some(m => m.id === selectedAnimal.id);
      if (!isStillVisible) {
        setSelectedAnimal(filteredWildlifeMarkers[0] || null);
      }
    }
  }, [filteredWildlifeMarkers, selectedAnimal, isDateFilterActive]);

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterSpecies('ALL');
    setFilterRisk('ALL');
  };

  const handleSelectInteractionFromFilter = (item: Report | WildlifeMarkerData) => {
    if ('scientific' in item) {
      setSelectedAnimal(item as WildlifeMarkerData);
      handleViewPrediction(item as WildlifeMarkerData);
    } else {
      const matching = allWildlifeMarkers.find(m => m.id === `rep-marker-${item.id}`);
      if (matching) {
        setSelectedAnimal(matching);
        handleViewPrediction(matching);
      }
    }
    setCurrentView(View.MAP);
    setMapViewMode('map');
  };

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);


  // Calculate ETA dynamically based on Distance, Mode, and Fallback Status
  const calculateEta = (distance: number, mode: TravelMode, isFallback = false) => {
    // Normal corridor speed: Car ~40 km/h, Bike ~30 km/h
    // Conservative fallback speed multiplier: Car ~32 km/h, Bike ~22 km/h
    const speedKmH = isFallback 
      ? (mode === 'car' ? 32 : 22) 
      : (mode === 'car' ? 40 : 30);

    const hours = distance / speedKmH;
    const totalMinutes = Math.max(1, Math.round(hours * 60));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    // Arrival Time calculation
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + totalMinutes * 60000);
    const arrivalString = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      durationText: hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`,
      minutes: totalMinutes,
      arrivalString
    };
  };

  const etaInfo = calculateEta(routeDistanceKm, travelMode, isFallbackRoute);

  // Action: Handle GPS Location Button Click
  const handleGetGpsLocation = async () => {
    setIsGettingLocation(true);
    setRouteErrorMsg('');
    setRouteSuccessMsg('');

    const applyDefaultRegionalLocation = (reasonMsg?: string) => {
      const defaultLat = 11.4102;
      const defaultLon = 76.6950;
      const defaultAddress = 'Udhagamandalam (Ooty Town Center)';

      setFromCoords({ lat: defaultLat, lon: defaultLon });
      setFromAddress(defaultAddress);
      setIsGettingLocation(false);
      handleCalculateRoute({ lat: defaultLat, lon: defaultLon });
      setRouteSuccessMsg(reasonMsg || `Location set to Ooty Town Center (${defaultLat.toFixed(3)}, ${defaultLon.toFixed(3)})`);
      setTimeout(() => setRouteSuccessMsg(''), 4000);
    };

    if (!('geolocation' in navigator)) {
      applyDefaultRegionalLocation('Location set to regional Ooty Corridor GPS center');
      return;
    }

    // Check permission status if navigator.permissions API is available
    if ('permissions' in navigator) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          applyDefaultRegionalLocation('Location set to regional Ooty Corridor GPS center');
          return;
        }
      } catch (_permErr) {
        // Ignore permission query failure on sandboxed/unsupported browsers
      }
    }

    const processPosition = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setFromCoords({ lat, lon });

      try {
        const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
        if (res.ok) {
          const data = await res.json();
          if (data.address) {
            setFromAddress(data.address);
            setRouteSuccessMsg(`Location acquired: ${data.address}`);
          } else {
            const fallbackStr = `GPS Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
            setFromAddress(fallbackStr);
            setRouteSuccessMsg(`GPS coordinates acquired!`);
          }
        } else {
          const fallbackStr = `GPS Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
          setFromAddress(fallbackStr);
          setRouteSuccessMsg(`GPS coordinates acquired!`);
        }
      } catch (_e) {
        const fallbackStr = `GPS Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
        setFromAddress(fallbackStr);
        setRouteSuccessMsg(`GPS coordinates acquired!`);
      } finally {
        setIsGettingLocation(false);
        handleCalculateRoute({ lat, lon });
        setTimeout(() => setRouteSuccessMsg(''), 4000);
      }
    };

    // Attempt 1: High Accuracy with adequate timeout for permission prompt
    navigator.geolocation.getCurrentPosition(
      processPosition,
      (_err) => {
        // Fallback to low accuracy
        navigator.geolocation.getCurrentPosition(
          processPosition,
          () => {
            applyDefaultRegionalLocation('Location set to regional Ooty Corridor GPS center');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Action: Recalculate Route
  const handleCalculateRoute = async (
    overrideFrom?: { lat: number; lon: number },
    overrideTo?: { lat: number; lon: number },
    overrideMode?: TravelMode,
    overrideDestName?: string
  ) => {
    const startPt = overrideFrom || fromCoords;
    const endPt = overrideTo || toCoords;
    const currentMode = overrideMode || travelMode;
    const targetDest = overrideDestName || toAddress;

    // Do NOT calculate if start, destination, or valid coordinates are missing
    if (!fromAddress || !targetDest || startPt.lat === 0 || endPt.lat === 0) {
      setRouteDistanceKm(0);
      setRouteCoordinates([]);
      setRouteRiskLevel('LOW');
      setIsCalculatingRoute(false);
      return;
    }

    setIsCalculatingRoute(true);
    setRouteErrorMsg('');

    let isSuccess = false;

    try {
      // 1. Fetch precise route info from backend endpoint
      const res = await fetch(
        `/api/route/osrm?fromLat=${startPt.lat}&fromLon=${startPt.lon}&toLat=${endPt.lat}&toLon=${endPt.lon}&mode=${currentMode}`
      );

      // Secondary Validation Layer: Verify response status & JSON payload
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'OK' && typeof data.distanceKm === 'number' && data.distanceKm > 0) {
          setRouteDistanceKm(data.distanceKm);
          if (Array.isArray(data.coordinates)) {
            setRouteCoordinates(data.coordinates);
          } else {
            setRouteCoordinates([]);
          }
          const isNearMudumalai = targetDest.toLowerCase().includes('mudumalai') || targetDest.toLowerCase().includes('bandipur');
          setRouteRiskLevel(isSafeRouteActive ? 'LOW' : (isNearMudumalai || data.distanceKm > 40) ? 'HIGH' : 'LOW');
          setIsFallbackRoute(false);
          setRouteWarningMsg('');
          isSuccess = true;
          return;
        }
      }

      // 2. Client-side OSRM fallback attempt if backend 404s or returns invalid payload
      const osrmResult = await fetchOSRMRoute(
        { latitude: startPt.lat, longitude: startPt.lon },
        { latitude: endPt.lat, longitude: endPt.lon }
      );

      if (osrmResult && typeof osrmResult.distanceKm === 'number' && osrmResult.distanceKm > 0) {
        setRouteDistanceKm(osrmResult.distanceKm);
        if (Array.isArray(osrmResult.coordinates)) {
          setRouteCoordinates(osrmResult.coordinates);
        } else {
          setRouteCoordinates([]);
        }
        const isNearMudumalai = targetDest.toLowerCase().includes('mudumalai') || targetDest.toLowerCase().includes('bandipur');
        setRouteRiskLevel(isSafeRouteActive ? 'LOW' : (isNearMudumalai || osrmResult.distanceKm > 40) ? 'HIGH' : 'LOW');
        setIsFallbackRoute(false);
        setRouteWarningMsg('');
        isSuccess = true;
        return;
      }
    } catch (_e) {
      // Catch network or parsing errors
    } finally {
      setIsCalculatingRoute(false);
    }

    // 3. Graceful Haversine Fallback if backend returned 404, error, or route-not-found
    if (!isSuccess) {
      setRouteCoordinates([]);
      const R = 6371; // Earth radius in km
      const dLat = ((endPt.lat - startPt.lat) * Math.PI) / 180;
      const dLon = ((endPt.lon - startPt.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((startPt.lat * Math.PI) / 180) * Math.cos((endPt.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const straightDist = R * c;
      const fallbackDist = Number((straightDist * 1.3).toFixed(1)) || 48.2;

      setRouteDistanceKm(fallbackDist);
      const isNearMudumalai = targetDest.toLowerCase().includes('mudumalai') || targetDest.toLowerCase().includes('bandipur');
      setRouteRiskLevel(isSafeRouteActive ? 'LOW' : (isNearMudumalai || fallbackDist > 40) ? 'HIGH' : 'LOW');
      
      // Apply conservative speed multiplier & non-intrusive warning
      setIsFallbackRoute(true);
      setRouteWarningMsg('Estimated via corridor geometry (Network routing unavailable)');
    }
  };

  // Automatically recalculate route when coordinates, travel mode, or safe route toggle changes
  useEffect(() => {
    if (fromAddress && toAddress && fromCoords.lat !== 0 && toCoords.lat !== 0) {
      handleCalculateRoute(fromCoords, toCoords, travelMode, toAddress);
    } else {
      setRouteDistanceKm(0);
      setRouteCoordinates([]);
    }
  }, [fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon, travelMode, isSafeRouteActive, fromAddress, toAddress]);

  // Action: View Prediction for Animal
  const handleViewPrediction = async (animal: WildlifeMarkerData) => {
    setIsPredicting(true);
    setShowingTrajectory(true);

    try {
      const res = await fetch('/api/predict-animal-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species: animal.common || animal.scientific,
          lat: animal.lat,
          lon: animal.lon,
          riskLevel: animal.riskLevel
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPredictionData(data);
      } else {
        const generatedPaths = generateCorridorPredictions(animal.common, animal.lat, animal.lon, animal.riskLevel);
        setPredictionData({
          confidence: `${generatedPaths[0]?.confidence || 88}%`,
          paths: generatedPaths,
          predictedSteps: animal.trajectory
        });
      }
    } catch (_e) {
      const generatedPaths = generateCorridorPredictions(animal.common, animal.lat, animal.lon, animal.riskLevel);
      setPredictionData({
        confidence: `${generatedPaths[0]?.confidence || 88}%`,
        paths: generatedPaths,
        predictedSteps: animal.trajectory
      });
    } finally {
      setIsPredicting(false);
    }
  };

  // Action: Navigate Safely (Bypass animal hotspot)
  const handleNavigateSafely = (animal: WildlifeMarkerData) => {
    setIsSafeRouteActive(true);
    setIsNavigating(true);
    setRouteRiskLevel('LOW');
    setRouteSuccessMsg(`Safe bypass route activated! Avoiding ${animal.common} movement corridor.`);
    setTimeout(() => setRouteSuccessMsg(''), 4000);
    setSelectedAnimal(null);
  };

  const handleSendChatMessage = async (promptText?: string) => {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    const routeContext = {
      start: fromAddress,
      end: toAddress,
      riskLevel: routeRiskLevel,
      travelMode: travelMode
    };

    try {
      const reply = await sendChatMessage(textToSend, chatMessages, routeContext, allWildlifeMarkers);
      setChatMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (_e) {
      setTimeout(() => {
        let aiReply = "I am Wildlife Guardian AI. Always keep a 100m distance from elephants and stay inside your vehicle.";
        const lower = textToSend.toLowerCase();

        if (lower.includes('lion') || lower.includes('cheetah') || lower.includes('wolf')) {
          aiReply = "I am Wildlife Guardian AI. This application supports 6 regional species: Asian Elephant, Tiger, Leopard, Sloth Bear, Indian Gaur, and Bison.";
        } else if (lower.includes('elephant')) {
          aiReply = "Asian Elephants are active near Mudumalai & Pykara lake areas during twilight. Never sound horns or flash high beams.";
        } else if (lower.includes('tiger') || lower.includes('leopard')) {
          aiReply = "Big cats are nocturnal hunters in Nilgiris. Avoid solitary walks in tea estates after 6 PM.";
        } else if (lower.includes('gaur') || lower.includes('bison')) {
          aiReply = "Indian Gaur & Bison require a minimum 50m safety distance. Give bulls space to cross corridors.";
        } else if (lower.includes('bear')) {
          aiReply = "Sloth Bears have keen hearing but poor eyesight. Speak calmly if walking near forest edges.";
        }

        setChatMessages((prev) => [...prev, { role: 'model', text: aiReply }]);
      }, 500);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportLocation || !reportDescription) return;

    const reportId = `rep-${Date.now()}`;
    const userEmail = currentUser?.email || 'ranger@wildlife.gov.in';

    setSubmittedReportIds(prev => {
      const updated = new Set(prev);
      updated.add(reportId);
      try {
        localStorage.setItem('my_submitted_report_ids', JSON.stringify([...updated]));
      } catch (_e) {
        // ignore
      }
      return updated;
    });

    // Calculate coordinates for map placement
    let repLat = fromCoords.lat !== 0 ? fromCoords.lat : 11.412;
    let repLon = fromCoords.lon !== 0 ? fromCoords.lon : 76.698;

    const matchedPreset = PRESET_DESTINATIONS.find(
      p => p.name.toLowerCase().includes(reportLocation.toLowerCase()) || reportLocation.toLowerCase().includes(p.name.toLowerCase().split(',')[0])
    );

    if (matchedPreset) {
      repLat = matchedPreset.lat;
      repLon = matchedPreset.lon;
    } else {
      const jitter = (Date.now() % 100) / 2000 - 0.025;
      repLat = Number((repLat + jitter).toFixed(4));
      repLon = Number((repLon + jitter).toFixed(4));
    }

    const newRep: Report = {
      id: reportId,
      wildlifeType: selectedAnimalChip,
      location: reportLocation,
      description: reportDescription,
      timestamp: 'Just now',
      userEmail,
      imageUri: reportPhoto || undefined,
      lat: repLat,
      lon: repLon,
      ai: {
        common: selectedAnimalChip,
        scientific: 'Observed Species',
        risk: 'Low',
        summary: 'Sighting verified and logged to regional wildlife network.'
      }
    };

    addFirestoreReport({
      wildlifeType: selectedAnimalChip,
      location: reportLocation,
      description: reportDescription,
      userEmail,
      imageUri: reportPhoto || undefined,
      lat: repLat,
      lon: repLon,
      ai: newRep.ai
    });

    setReportLocation('');
    setReportDescription('');
    setReportPhoto(null);
    setReportSubTab('recent');
  };

  const handleDeleteReport = async (reportId: string) => {
    setSubmittedReportIds(prev => {
      const updated = new Set(prev);
      updated.delete(reportId);
      try {
        localStorage.setItem('my_submitted_report_ids', JSON.stringify([...updated]));
      } catch (_e) {
        // ignore
      }
      return updated;
    });
    await deleteFirestoreReport(reportId);
  };

  const handleClearRoute = () => {
    setIsNavigating(false);
    setFromCoords({ lat: 0, lon: 0 });
    setToCoords({ lat: 0, lon: 0 });
    setFromAddress('');
    setToAddress('');
    setRouteCoordinates([]);
    setSelectedAnimal(null);
    setIsSafeRouteActive(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
        <Card className="max-w-md w-full p-6 sm:p-8 space-y-5 bg-white border-slate-100 shadow-xl rounded-3xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#059669] flex items-center justify-center text-white mx-auto shadow-md">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wildlife Guardian</h1>
            <p className="text-xs text-slate-500 font-medium">Travel Safely in Wildlife Corridors</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                authMode === 'login' ? 'bg-white text-[#059669] shadow-sm' : 'text-slate-500'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                authMode === 'signup' ? 'bg-white text-[#059669] shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />
            <Button type="submit" size="lg" className="w-full mt-2 cursor-pointer" disabled={isAuthSubmitting}>
              {isAuthSubmitting 
                ? 'Authenticating...' 
                : (authMode === 'login' ? 'Access Wildlife App' : 'Create Account')}
            </Button>
          </form>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased w-full relative min-h-screen h-screen max-h-screen overflow-hidden">
      {/* Toast Feedback Messages */}
      {routeSuccessMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#059669] text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 transition animate-bounce">
          <CheckCircle2 size={16} />
          <span>{routeSuccessMsg}</span>
        </div>
      )}

      {routeErrorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 transition">
          <AlertTriangle size={16} />
          <span>{routeErrorMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className={`flex-1 w-full max-w-7xl mx-auto min-h-0 ${currentView === View.MAP ? 'p-0 flex flex-col overflow-hidden' : 'px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 overflow-y-auto no-scrollbar'}`}>

        
        {/* ===================================================================== */}
        {/* 1. SCREEN: HOME ("Stay Safe Out There") - Matches Screenshot 5 */}
        {/* ===================================================================== */}
        {currentView === View.HOME && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Stay Safe Out There
                </h1>
              </div>
            </div>

            {/* Active Date Filter Banner */}
            {isDateFilterActive && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold min-w-0 flex-1">
                  <Calendar size={16} className="text-[#059669] shrink-0" />
                  <span className="truncate">
                    Date Range: {fromDate || 'Any'} → {toDate || 'Any'}
                    {filterSpecies !== 'ALL' && ` • ${filterSpecies}`}
                    {filterRisk !== 'ALL' && ` • ${filterRisk} Risk`}
                  </span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ml-2 cursor-pointer"
                  id="home-clear-filter-btn"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Risk Banner & Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Risk Level Banner */}
              <div className="lg:col-span-2 bg-[#059669] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                      <Shield size={16} />
                      <span>Current Corridor Risk Level</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight pt-1">
                      {routeRiskLevel}
                    </h2>
                  </div>

                  <div className="text-right space-y-1 bg-emerald-800/40 px-4 py-2.5 rounded-2xl border border-emerald-500/30 backdrop-blur-xs">
                    <div className="flex items-center justify-end gap-1.5 text-white">
                      <Cloud size={24} />
                      <span className="text-2xl font-black">29°C</span>
                    </div>
                    <p className="text-xs text-emerald-100 font-medium">Overcast Corridor</p>
                    <p className="text-[11px] text-emerald-100/80 pt-1 flex items-center justify-end gap-1 font-semibold">
                      <span>💡 Wind:</span> 15 km/h
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-emerald-500/40 flex items-center justify-between text-xs text-emerald-100 font-medium">
                  <span>Risk Score: {routeRiskLevel === 'HIGH' ? '88/100' : '0/100'}</span>
                  <span>{filteredWildlifeMarkers.length} active animal sightings tracked</span>
                </div>
              </div>

              {/* 3 Metrics Cards */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex flex-col justify-between gap-2.5 hover:border-red-200 transition">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {filteredWildlifeMarkers.filter(m => m.riskLevel === 'HIGH').length}
                    </div>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 font-bold leading-snug">
                    High Risk Alerts
                  </div>
                </div>

                <div 
                  onClick={() => setCurrentView(View.MAP)}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex flex-col justify-between gap-2.5 cursor-pointer hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                      <Navigation size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      1
                    </div>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 font-bold leading-snug">
                    Safe Route Active
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex flex-col justify-between gap-2.5 hover:border-blue-200 transition">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <BarChart3 size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {filteredWildlifeMarkers.length}
                    </div>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 font-bold leading-snug">
                    Total Sightings
                  </div>
                </div>
              </div>
            </div>

            {/* Species Sightings Grid */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Sightings & Field Reports</h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {filteredWildlifeMarkers.length} active sightings
                </span>
              </div>

              {filteredWildlifeMarkers.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  No sightings found for the selected date range.
                  <button
                    onClick={handleResetFilters}
                    className="block mx-auto mt-2 text-[#059669] font-bold underline cursor-pointer"
                  >
                    Reset Date Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredWildlifeMarkers.map((wm) => (
                    <div
                      key={wm.id}
                      onClick={() => {
                        setSelectedAnimal(wm);
                        handleViewPrediction(wm);
                        setCurrentView(View.MAP);
                      }}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md hover:border-[#059669] cursor-pointer transition flex items-start gap-3.5"
                    >
                      <span className="text-3xl p-2.5 bg-slate-50 rounded-2xl shrink-0">{wm.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{wm.common}</h3>
                            {wm.isUserSubmitted && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                                REPORT
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            wm.riskLevel === 'HIGH' ? 'bg-red-50 text-red-600' : wm.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-[#059669]'
                          }`}>
                            {wm.riskLevel} RISK
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">{wm.locationName}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-400">
                          <span>Confidence: {wm.confidence}</span>
                          <span>{getItemDateStr(wm)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 2. SCREEN: MAP VIEW & ROUTE PLANNER */}
        {/* ===================================================================== */}
        {currentView === View.MAP && (
          <div className="relative flex-1 flex flex-col justify-between w-full max-w-full overflow-hidden min-h-0">
            {/* Top Bar Header */}
            <div className="flex flex-row items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-3 py-2 sm:p-3 sm:rounded-2xl border-b sm:border border-slate-100 shadow-sm overflow-hidden shrink-0 w-full">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap truncate shrink min-w-0">
                Wildlife Safety Map
              </h1>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
                {(fromCoords.lat !== 0 || toCoords.lat !== 0) && (
                  <button
                    onClick={handleClearRoute}
                    className="px-2.5 py-1.5 sm:px-3 rounded-full font-bold text-[11px] sm:text-xs bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1 border border-red-200 shrink-0 whitespace-nowrap active:scale-95"
                    title="Clear route"
                  >
                    <X size={13} className="shrink-0" />
                    <span>Clear</span>
                  </button>
                )}

                <button 
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shrink-0 active:scale-95 relative cursor-pointer ${
                    isDateFilterActive
                      ? 'bg-[#059669] text-white shadow-md ring-2 ring-emerald-300'
                      : 'bg-[#e6f7f0] text-[#059669] hover:bg-[#d1fae5]'
                  }`}
                  title="Filter past interaction dates & species"
                  id="map-filter-modal-btn"
                >
                  <Filter size={16} />
                  {isDateFilterActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-white rounded-full"></span>
                  )}
                </button>

                <button 
                  onClick={() => setMapViewMode(mapViewMode === 'map' ? 'config' : 'map')}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition shrink-0 whitespace-nowrap active:scale-95 ${
                    mapViewMode === 'config'
                      ? 'bg-[#059669] text-white shadow-sm'
                      : 'bg-[#e6f7f0] text-[#059669] hover:bg-[#d1fae5]'
                  }`}
                >
                  <Navigation size={13} className="shrink-0 fill-current" />
                  <span>{mapViewMode === 'map' ? 'Route' : 'Map View'}</span>
                </button>
              </div>
            </div>

            {/* IF IN MAP CANVAS VIEW MODE */}
            {mapViewMode === 'map' && (
              <div className="w-full relative flex-1 flex flex-col min-h-0 animate-in fade-in duration-200">
                {/* Active Date Filter Top Floating Pill */}
                {isDateFilterActive && (
                  <div className="absolute top-3 left-3 right-3 z-30 bg-emerald-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center justify-between text-xs animate-in slide-in-from-top duration-200 pointer-events-auto">
                    <div className="flex items-center gap-2 font-bold min-w-0 flex-1">
                      <Calendar size={15} className="text-emerald-300 shrink-0" />
                      <span className="truncate">
                        Date Range: {fromDate || 'Any'} → {toDate || 'Any'}
                        {filterSpecies !== 'ALL' && ` • ${filterSpecies}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleResetFilters}
                        className="bg-red-500/80 hover:bg-red-600 px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Height Map Canvas with Embedded Floating Overlays */}
                <div className="flex-1 w-full rounded-none sm:rounded-3xl overflow-hidden border-0 sm:border border-slate-200/80 shadow-none sm:shadow-sm relative min-h-0">
                  <InteractiveMap
                    fromCoords={fromCoords}
                    toCoords={toCoords}
                    fromAddress={fromAddress}
                    toAddress={toAddress}
                    routeCoordinates={routeCoordinates}
                    wildlifeMarkers={filteredWildlifeMarkers}
                    selectedAnimal={selectedAnimal}
                    onSelectAnimal={(animal) => {
                      setSelectedAnimal(animal);
                      handleViewPrediction(animal);
                    }}
                    isSafeRouteActive={isSafeRouteActive}
                    routeRiskLevel={routeRiskLevel}
                    isNavigating={isNavigating}
                    routeDistanceKm={routeDistanceKm}
                    containerHeightClass="h-full min-h-0 flex-1"
                    onPlanSafeRoute={() => setMapViewMode('config')}
                    showingTrajectory={showingTrajectory}
                    predictionData={predictionData}
                  />
                </div>

                {/* ACTIVE NAVIGATION TRAY HUD (ONLY IF NAVIGATING) */}
                {isNavigating && (
                  <div className="w-full pt-2 pb-20 px-3 sm:px-4 z-40 relative">
                    <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{etaInfo.durationText}</h2>
                          <p className="text-xs text-slate-500">{routeDistanceKm} km remaining • Mode: {travelMode}</p>
                        </div>
                        <button 
                          onClick={handleClearRoute}
                          className="bg-[#fee2e2] text-[#dc2626] hover:bg-[#fca5a5] px-4 py-2 rounded-full font-bold text-xs transition"
                        >
                          End Navigation
                        </button>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2 gap-2">
                        <span className="truncate min-w-0">
                          Weather ({toAddress ? toAddress.split(',')[0].split('(')[0].trim() : 'Destination Corridor'}): <strong>☁️ 22°C | Clouds</strong>
                        </span>
                        <span className="text-[#059669] font-bold shrink-0">Arrive by {etaInfo.arrivalString}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IF IN ROUTE PLANNER CONFIGURATION MODE (IMAGE 1 FORM) */}
            {mapViewMode === 'config' && (
              <div className="flex-1 w-full overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-4 pb-28 animate-in fade-in duration-200">
                {/* ROUTE PLANNING CONTROLS PANEL WITH REAL GEOCODING */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3 relative z-30">
                  {/* FROM Location Input with Dynamic Suggestions & GPS Button */}
                  <div className="space-y-1 relative">
                    <label className="block text-xs font-semibold text-slate-700">From Location</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={fromAddress}
                          onChange={(e) => {
                            setFromAddress(e.target.value);
                            handleSearchLocation(e.target.value, 'from');
                          }}
                          onFocus={() => {
                            if (fromSuggestions.length > 0) setShowFromDropdown(true);
                          }}
                          placeholder="Type starting place (e.g. Ooty, Arakkonam, Chennai)..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#059669]"
                        />
                        <MapPin size={16} className="absolute left-3 top-3 text-[#059669]" />
                        {isSearchingFrom && (
                          <div className="absolute right-3 top-3 w-3.5 h-3.5 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>

                      {/* GPS LOCATION BUTTON */}
                      <button
                        type="button"
                        onClick={handleGetGpsLocation}
                        disabled={isGettingLocation}
                        className="w-10 h-10 rounded-full bg-[#059669] hover:bg-[#047857] active:bg-[#03694f] text-white flex items-center justify-center shrink-0 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                        title="Get Current GPS Location"
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          {isGettingLocation ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Locate size={18} />
                          )}
                        </div>
                      </button>
                    </div>

                    {/* FROM Autocomplete Dropdown List */}
                    {showFromDropdown && fromSuggestions.length > 0 && (
                      <div className="absolute left-0 right-12 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                        {fromSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectFromSuggestion(item)}
                            className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition flex items-center gap-2.5 text-xs"
                          >
                            <MapPin size={14} className="text-[#059669] shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{item.address}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TO Destination Input with Dynamic Suggestions & Presets */}
                  <div className="space-y-1 relative">
                    <label className="block text-xs font-semibold text-slate-700">Destination</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={toAddress}
                        onChange={(e) => {
                          setToAddress(e.target.value);
                          handleSearchLocation(e.target.value, 'to');
                        }}
                        onFocus={() => {
                          if (toSuggestions.length > 0) setShowToDropdown(true);
                        }}
                        placeholder="Search destination (e.g. Mudumalai, Mysore, Bangalore)..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#059669]"
                      />
                      <Compass size={16} className="absolute left-3 top-3 text-red-500" />
                      {isSearchingTo && (
                        <div className="absolute right-3 top-3 w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {/* TO Autocomplete Dropdown List */}
                    {showToDropdown && toSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                        {toSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectToSuggestion(item)}
                            className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition flex items-center gap-2.5 text-xs"
                          >
                            <Compass size={14} className="text-red-500 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{item.address}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Preset Destination Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 pb-0.5">
                      {PRESET_DESTINATIONS.map((dest) => (
                        <button
                          key={dest.name}
                          type="button"
                          onClick={() => {
                            if (!fromAddress || fromCoords.lat === 0) {
                              setFromAddress('Udhagamandalam (Ooty Town Center)');
                              setFromCoords({ lat: 11.4102, lon: 76.6950 });
                            }
                            setToAddress(dest.name);
                            setToCoords({ lat: dest.lat, lon: dest.lon });
                            setShowToDropdown(false);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition border ${
                            toAddress === dest.name 
                              ? 'bg-[#059669] text-white border-[#059669]' 
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          📍 {dest.name.split(',')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TRAVEL MODES TOGGLE: Car 🚗 vs Bike 🏍️ */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs font-semibold text-slate-700">Travel Mode</span>

                    <div className="flex bg-slate-100 p-1 rounded-full gap-1">
                      <button
                        type="button"
                        onClick={() => setTravelMode('car')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                          travelMode === 'car' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Car size={14} /> Car
                      </button>

                      <button
                        type="button"
                        onClick={() => setTravelMode('bike')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                          travelMode === 'bike' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Bike size={14} /> Bike
                      </button>
                    </div>
                  </div>
                </div>

                {/* ROUTE SUMMARY / ETA CARD */}
                {(!fromAddress || !toAddress || routeDistanceKm === 0) ? (
                  <div className="bg-white p-5 rounded-3xl border border-dashed border-slate-200 shadow-sm space-y-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center font-bold text-lg mx-auto">
                      📍
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Enter Start & Destination Locations</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Enter your details above to calculate distance, duration, risk level, and display Police Stations & Forest Offices along your route.
                    </p>
                  </div>
                ) : (
                  <div 
                    onClick={() => setMapViewMode('map')}
                    className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3 cursor-pointer hover:border-[#059669]/50 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#e6f7f0] text-[#059669] flex items-center justify-center font-bold text-xs">
                          {travelMode === 'car' ? '🚗' : '🏍️'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{etaInfo.durationText}</h3>
                          <p className="text-[11px] text-slate-500">{routeDistanceKm} km • Arrive by {etaInfo.arrivalString}</p>
                        </div>
                      </div>

                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                        routeRiskLevel === 'HIGH' 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : routeRiskLevel === 'MODERATE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-[#e6f7f0] text-[#059669] border-[#a7f3d0]'
                      }`}>
                        {routeRiskLevel} RISK
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                      <div className="bg-slate-50 p-2.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">From</span>
                        <span className="font-semibold text-slate-900 truncate block">{fromAddress.split('(')[0] || 'Selected Start'}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">To</span>
                        <span className="font-semibold text-slate-900 truncate block">{toAddress.split(',')[0] || 'Selected Destination'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span>Route Status: <strong className="text-[#059669]">Real Coordinate Routing Active</strong></span>
                      <span className="text-[#059669] font-bold">Tap to View Map ➔</span>
                    </div>

                    {routeWarningMsg && (
                      <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50/80 px-3 py-1.5 rounded-2xl border border-amber-200/70 font-medium">
                        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                        <span className="leading-tight">{routeWarningMsg}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* PRIMARY CTA BUTTON: PLAN SAFE ROUTE & VIEW LIVE MAP */}
                <button 
                  onClick={() => {
                    if (fromAddress && toAddress && routeDistanceKm > 0) {
                      setMapViewMode('map');
                      setIsNavigating(true);
                    }
                  }}
                  disabled={!fromAddress || !toAddress || routeDistanceKm === 0}
                  className="w-full bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-full font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <Navigation size={16} /> 
                  {!fromAddress || !toAddress 
                    ? 'Enter From & Destination To Calculate' 
                    : `Plan Safe Route & View Live Map (${etaInfo.durationText})`}
                </button>
              </div>
            )}

            {/* ================================================================= */}
            {/* ANIMAL MARKER INTERACTION BOTTOM SHEET / MODAL CARD */}
            {/* ================================================================= */}
            {selectedAnimal && (
              <div className="fixed inset-x-0 bottom-[64px] z-[60] bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-6 max-w-md mx-auto space-y-4 animate-in slide-in-from-bottom duration-300 max-h-[calc(100vh-80px)] overflow-y-auto">
                {/* Header with Close X */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-[#e6f7f0] rounded-2xl">{selectedAnimal.emoji}</span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{selectedAnimal.common}</h2>
                      <p className="text-xs italic text-slate-500">{selectedAnimal.scientific}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setSelectedAnimal(null); setShowingTrajectory(false); }}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Animal Image */}
                <div className="relative rounded-2xl overflow-hidden h-44 bg-slate-100 border border-slate-100 shadow-sm">
                  <img 
                    src={selectedAnimal.image} 
                    alt={selectedAnimal.common}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {selectedAnimal.conservationStatus}
                  </div>
                </div>

                {/* Key Animal Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-2xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Risk Level</span>
                    <span className={`font-bold block ${selectedAnimal.riskLevel === 'HIGH' ? 'text-red-600' : 'text-[#059669]'}`}>
                      {selectedAnimal.riskLevel} RISK
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      {selectedAnimal.isUserSubmitted ? 'Verification' : 'Prediction Confidence'}
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {selectedAnimal.isUserSubmitted ? 'Community Report' : selectedAnimal.confidence}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Last Seen</span>
                    <span className="font-semibold text-slate-800 block">{selectedAnimal.lastSeen}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Distance from User</span>
                    <span className="font-semibold text-slate-800 block">{selectedAnimal.distKm} km</span>
                  </div>
                </div>

                {/* Status & Location Details */}
                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>Last Known Location:</strong> {selectedAnimal.locationName}</p>
                  <p><strong>Movement Status:</strong> {selectedAnimal.movementStatus}</p>
                  <p><strong>Weather:</strong> {selectedAnimal.weather}</p>
                  <div className="bg-[#e6f7f0] p-3 rounded-2xl text-xs text-[#059669] leading-relaxed">
                    <strong>Behaviour Description:</strong> {selectedAnimal.behaviour}
                  </div>
                </div>

                {/* Multiple Movement Predictions Panel (Only for Telemetry Tracked Regional Wildlife) */}
                {showingTrajectory && !selectedAnimal.isUserSubmitted && (
                  <div className="bg-[#0b1329] text-white p-4 rounded-2xl space-y-3.5 border border-slate-800 shadow-xl animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-tight">
                        <TrendingUp size={16} className="text-amber-400 shrink-0" />
                        <span>LSTM & Spatial ML Movement Predictions</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 font-extrabold px-2.5 py-1 rounded-full border border-amber-500/30 shrink-0">
                        3 Corridors Active
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(
                        predictionData?.paths || 
                        selectedAnimal.movementPaths || 
                        generateCorridorPredictions(selectedAnimal.common, selectedAnimal.lat, selectedAnimal.lon, selectedAnimal.riskLevel)
                      ).map((path: any) => (
                        <div key={path.id || path.name} className="bg-[#131d33] border border-slate-800 p-3 rounded-xl space-y-2 shadow-sm">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: path.color }}></span>
                              {path.name}
                            </span>
                            <span className="font-extrabold text-[11px] px-2.5 py-0.5 rounded-md bg-[#064e3b]/90 border border-[#10b981]/40 text-[#34d399]">
                              {path.confidence}% Confidence
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {path.description}
                          </p>

                          {/* Next Possible Location Card */}
                          <div className="bg-[#0b1329] border border-slate-700/60 rounded-lg p-2 flex items-center gap-2 text-xs">
                            <MapPin size={14} className="text-amber-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Next Possible Location</div>
                              <div className="text-[11px] font-bold text-emerald-300 truncate">
                                {path.nextLocation || `${path.points[path.points.length - 1]?.lat}, ${path.points[path.points.length - 1]?.lon}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            <span className="flex items-center gap-1">
                              <span>Time Window:</span>
                              <strong className="text-amber-300 font-bold">
                                {path.timeWindow || (path.type === 'PRIMARY' ? '+15m ➔ +45m' : path.type === 'SECONDARY' ? '+30m ➔ +60m' : '+45m ➔ +90m')}
                              </strong>
                            </span>
                            <span>Risk Factor: <strong className={path.riskLevel === 'HIGH' ? 'text-red-400 font-extrabold' : path.riskLevel === 'MEDIUM' ? 'text-amber-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>{path.riskLevel}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Sheet Action Buttons */}
                {selectedAnimal.isUserSubmitted ? (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 text-center font-medium leading-snug">
                      📍 User Submitted Field Sighting • Telemetry ML predictions are active only for tracked regional wildlife species.
                    </div>
                    <button
                      onClick={() => { setSelectedAnimal(null); setShowingTrajectory(false); }}
                      className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 py-3 rounded-full font-bold text-xs flex items-center justify-center transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        if (showingTrajectory) {
                          setShowingTrajectory(false);
                        } else {
                          handleViewPrediction(selectedAnimal);
                        }
                      }}
                      disabled={isPredicting}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <TrendingUp size={15} /> {showingTrajectory ? 'Hide Predictions' : 'View Predictions'}
                    </button>

                    <button
                      onClick={() => { setSelectedAnimal(null); setShowingTrajectory(false); }}
                      className="bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 py-3 rounded-full font-bold text-xs flex items-center justify-center transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* 3. SCREEN: REPORTS VIEW ("Wildlife Reports") */}
        {/* ===================================================================== */}
        {currentView === View.REPORTS && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Wildlife Reports</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Community field observations and wildlife sightings</p>
              </div>
            </div>

            {/* Active Date Filter Banner in Reports */}
            {isDateFilterActive && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold min-w-0 flex-1">
                  <Calendar size={16} className="text-[#059669] shrink-0" />
                  <span className="truncate">
                    Date Range: {fromDate || 'Any'} → {toDate || 'Any'}
                  </span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ml-2 cursor-pointer"
                  id="reports-clear-filter-btn"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md">
              <button
                onClick={() => setReportSubTab('submit')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  reportSubTab === 'submit' ? 'bg-white text-[#059669] shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Plus size={15} /> Submit Sighting
              </button>
              <button
                onClick={() => setReportSubTab('recent')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  reportSubTab === 'recent' ? 'bg-white text-[#059669] shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🗓️ Recent Reports ({filteredReports.length})
              </button>
            </div>

            {reportSubTab === 'submit' ? (
              <form onSubmit={handleAddReport} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-4xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Species *</label>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {['Asian Elephant', 'Gaur', 'Bison', 'Tiger', 'Leopard'].map((animal) => (
                          <Chip
                            key={animal}
                            label={animal}
                            active={selectedAnimalChip === animal}
                            onClick={() => setSelectedAnimalChip(animal)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Location *</label>
                      <input
                        type="text"
                        placeholder="e.g., Trail Junction A, Mile Marker 3"
                        value={reportLocation}
                        onChange={(e) => setReportLocation(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669]"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setReportLocation('Ooty - Gudalur Highway km 18')}
                        className="text-[11px] text-[#059669] font-bold flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        📍 Use Current Location
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Description *</label>
                      <textarea
                        rows={4}
                        placeholder="Describe what you observed (behavior, herd size, direction of travel, etc.)"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Photo Attachment (Optional)</label>
                      
                      <input
                        type="file"
                        ref={galleryInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoFileChange}
                      />
                      <input
                        type="file"
                        ref={cameraInputRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handlePhotoFileChange}
                      />

                      {reportPhoto ? (
                        <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-emerald-50/80 p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={reportPhoto} alt="Report Upload Preview" className="w-16 h-16 object-cover rounded-xl border border-emerald-300 shrink-0 shadow-sm" />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">Photo Attached</span>
                              <span className="text-[10px] text-emerald-700 font-medium block">Ready to submit with report</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReportPhoto(null)}
                            className="w-8 h-8 rounded-full bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center border border-slate-200 transition shadow-xs cursor-pointer"
                            title="Remove photo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div
                            onClick={() => galleryInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center space-y-2 cursor-pointer hover:border-[#059669] hover:bg-emerald-50/40 transition active:scale-[0.98]"
                          >
                            <ImageIcon size={28} className="text-slate-400 mx-auto" />
                            <span className="text-xs font-semibold text-slate-600 block">Pick from gallery</span>
                          </div>

                          <div
                            onClick={() => cameraInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center space-y-2 cursor-pointer hover:border-[#059669] hover:bg-emerald-50/40 transition active:scale-[0.98]"
                          >
                            <Camera size={28} className="text-slate-400 mx-auto" />
                            <span className="text-xs font-semibold text-slate-600 block">Capture photo</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#059669] hover:bg-[#047857] text-white py-4 rounded-2xl font-bold text-sm shadow-md transition cursor-pointer"
                    >
                      Submit Community Report
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs text-slate-500 font-medium">No community reports match the selected date range filter.</p>
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-[#059669] font-bold underline cursor-pointer"
                    >
                      Reset Date Filters
                    </button>
                  </div>
                ) : (
                  filteredReports.map((rep) => {
                    const matchingMarker = reportMarkers.find(m => m.id === `rep-marker-${rep.id}`);
                    const userEmail = currentUser?.email?.trim().toLowerCase();
                    const repEmail = rep.userEmail?.trim().toLowerCase();
                    const isUploader = Boolean(
                      (userEmail && repEmail && userEmail === repEmail) ||
                      submittedReportIds.has(String(rep.id))
                    );

                    return (
                      <Card key={rep.id} className="space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                              <span className="text-sm font-bold text-slate-900 block">{rep.wildlifeType}</span>
                              <span className="text-[10px] text-slate-400 font-mono">By: {rep.userEmail || 'Ranger'} • {rep.timestamp}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {matchingMarker && (
                                <button
                                  onClick={() => {
                                    setSelectedAnimal(matchingMarker);
                                    handleViewPrediction(matchingMarker);
                                    setCurrentView(View.MAP);
                                  }}
                                  className="flex items-center gap-1 text-xs font-semibold text-[#059669] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200 cursor-pointer shadow-xs"
                                  title="View marker on interactive map"
                                >
                                  <MapPin size={13} />
                                  <span>Map</span>
                                </button>
                              )}
                              {isUploader && (
                                <button
                                  onClick={() => handleDeleteReport(String(rep.id))}
                                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border border-rose-200 cursor-pointer shadow-xs"
                                  title="Delete your report"
                                  id={`delete-report-${rep.id}`}
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                          {rep.imageUri && (
                            <div className="rounded-xl overflow-hidden h-48 border border-slate-100 bg-slate-50">
                              <img src={rep.imageUri} alt={rep.wildlifeType} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <p className="text-xs text-slate-700"><strong>Location:</strong> {rep.location}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{rep.description}</p>
                        </div>

                        {rep.ai?.summary && (
                          <div className="bg-[#e6f7f0] p-2.5 rounded-xl text-xs text-[#059669] font-medium mt-2">
                            {rep.ai.summary}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* 4. SCREEN: AI GUIDE VIEW ("AI Wildlife Guide") */}
        {/* ===================================================================== */}
        {currentView === View.GUIDE && (
          <div className="space-y-6">
            <div className="bg-[#e6f7f0] rounded-3xl p-5 border border-[#d1fae5] flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900">AI Wildlife Assistant</h1>
                  <p className="text-xs text-slate-600 font-medium">Smart corridor intelligence, species advice & route safety analysis</p>
                </div>
              </div>
            </div>

            <div className="w-full">
              {/* AI Interactive Chat */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[500px] space-y-4">
                <div className="space-y-3 overflow-y-auto max-h-[440px] pr-1 no-scrollbar">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">AI Advisory Messages</h3>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-slate-100 text-slate-900 ml-auto max-w-[85%]'
                          : 'bg-emerald-50/80 border border-emerald-100 text-slate-800 shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 shadow-xs focus-within:border-[#059669]">
                    <input
                      type="text"
                      placeholder="Ask about wildlife risks, safe routes, animal encounters..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none pr-10"
                    />
                    <button
                      onClick={() => handleSendChatMessage()}
                      className="absolute right-2 w-8 h-8 rounded-full bg-[#059669] hover:bg-[#047857] text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <ArrowUp size={16} />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    Always follow forest department guidelines in reserve zones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 5. SCREEN: PROFILE VIEW */}
        {/* ===================================================================== */}
        {currentView === View.PROFILE && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">User Profile</h1>

            <Card className="space-y-6 p-6 sm:p-8">
              <div className="flex items-center gap-5 border-b border-slate-100 pb-5">
                <div className="w-16 h-16 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                  {(currentUser?.name || 'Ranger').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{currentUser?.name || 'Wildlife Guardian'}</h2>
                  <p className="text-xs text-slate-500">{currentUser?.email || 'ranger@wildlife.gov.in'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferences & Settings</h3>
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl text-xs font-medium text-slate-700 border border-slate-100">
                  <span>Proximity Warning Radius</span>
                  <span className="font-bold text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">5 km</span>
                </div>
              </div>

              <Button 
                variant="danger" 
                onClick={() => logout()} 
                className="w-full mt-4 cursor-pointer"
              >
                Log Out
              </Button>
            </Card>
          </div>
        )}

      </main>

      {/* ======================================================================= */}
      {/* FIXED NAVIGATION TAB BAR (Visible on Mobile, Tablet & Desktop Views) */}
      {/* ======================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around z-50 max-w-md mx-auto sm:rounded-t-2xl sm:border-x sm:shadow-lg">
        <button
          onClick={() => setCurrentView(View.HOME)}
          className={`flex flex-col items-center gap-1 transition ${
            currentView === View.HOME ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HomeIcon size={22} />
          <span className="text-[11px] font-semibold">Home</span>
        </button>

        <button
          onClick={() => setCurrentView(View.MAP)}
          className={`flex flex-col items-center gap-1 transition ${
            currentView === View.MAP ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers size={22} />
          <span className="text-[11px] font-semibold">Map</span>
        </button>

        <button
          onClick={() => setCurrentView(View.GUIDE)}
          className={`flex flex-col items-center gap-1 transition relative ${
            currentView === View.GUIDE ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1 rounded-full ${currentView === View.GUIDE ? 'bg-[#e6f7f0]' : ''}`}>
            <MessageCircle size={22} />
          </div>
          <span className="text-[11px] font-semibold">AI Guide</span>
        </button>

        <button
          onClick={() => setCurrentView(View.REPORTS)}
          className={`flex flex-col items-center gap-1 transition ${
            currentView === View.REPORTS ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <List size={22} />
          <span className="text-[11px] font-semibold">Reports</span>
        </button>

        <button
          onClick={() => setCurrentView(View.PROFILE)}
          className={`flex flex-col items-center gap-1 transition ${
            currentView === View.PROFILE ? 'text-[#059669]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserIcon size={22} />
          <span className="text-[11px] font-semibold">Profile</span>
        </button>
      </div>

      {/* Filter Modal for Past Interaction Date Range & Attributes */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        selectedSpecies={filterSpecies}
        onSpeciesChange={setFilterSpecies}
        selectedRisk={filterRisk}
        onRiskChange={setFilterRisk}
        onReset={handleResetFilters}
        markers={allWildlifeMarkers}
        reports={reports}
        onSelectInteraction={handleSelectInteractionFromFilter}
      />
    </div>
  );
}
