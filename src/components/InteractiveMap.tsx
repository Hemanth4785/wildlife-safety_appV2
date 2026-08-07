import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WildlifeMarkerData } from '../types';
import { generateCorridorPredictions } from '../services/predictionService';
import { Navigation, Maximize2, ShieldAlert, Layers, Crosshair, AlertTriangle, ShieldCheck } from 'lucide-react';

interface InteractiveMapProps {
  fromCoords: { lat: number; lon: number };
  toCoords: { lat: number; lon: number };
  fromAddress: string;
  toAddress: string;
  routeCoordinates?: Array<[number, number]>;
  wildlifeMarkers: WildlifeMarkerData[];
  selectedAnimal: WildlifeMarkerData | null;
  onSelectAnimal: (animal: WildlifeMarkerData) => void;
  isSafeRouteActive?: boolean;
  routeRiskLevel?: 'LOW' | 'MODERATE' | 'HIGH';
  isNavigating?: boolean;
  routeDistanceKm?: number;
  containerHeightClass?: string;
  onGetLocation?: () => void;
  onPlanSafeRoute?: () => void;
  showingTrajectory?: boolean;
  predictionData?: any;
}

interface SafetyStation {
  id: string;
  name: string;
  type: 'police' | 'forest';
  lat: number;
  lon: number;
  phone: string;
  address: string;
}

const REGIONAL_SAFETY_STATIONS: SafetyStation[] = [
  { id: 'pol-1', name: 'Gudalur Highway Police Patrol', type: 'police', lat: 11.502, lon: 76.492, phone: '04262-261200', address: 'NH67 Ooty-Gudalur Road, km 22' },
  { id: 'pol-2', name: 'Mudumalai Checkpost Outpost', type: 'police', lat: 11.568, lon: 76.538, phone: '0423-2220100', address: 'Thorapalli Gate Checkpost, Nilgiris' },
  { id: 'pol-3', name: 'Ooty Town Police HQ', type: 'police', lat: 11.412, lon: 76.696, phone: '0423-2442222', address: 'Commercial Road, Ooty Center' },
  { id: 'pol-4', name: 'Bandipur Border Police Post', type: 'police', lat: 11.668, lon: 76.628, phone: '0821-2400100', address: 'TN-KA Interstate Checkpost' },
  { id: 'pol-5', name: 'Arakkonam Highway Police Station', type: 'police', lat: 13.078, lon: 79.668, phone: '044-27891200', address: 'Main Road, Arakkonam Circle' },
  
  { id: 'for-1', name: 'Mudumalai Tiger Reserve HQ', type: 'forest', lat: 11.562, lon: 76.530, phone: '1800-425-4545', address: 'Mudumalai Forest Office, Abhayaranyam' },
  { id: 'for-2', name: 'Nilgiris South Forest Division', type: 'forest', lat: 11.408, lon: 76.692, phone: '0423-2444083', address: 'Forest Office Road, Ooty' },
  { id: 'for-3', name: 'Bandipur Forest Range Office', type: 'forest', lat: 11.664, lon: 76.624, phone: '08229-236060', address: 'Bandipur Tiger Reserve Entry' },
  { id: 'for-4', name: 'Theppakadu Elephant Camp Office', type: 'forest', lat: 11.572, lon: 76.582, phone: '0423-2230105', address: 'Theppakadu Forest Depot, Nilgiris' },
  { id: 'for-5', name: 'Arakkonam Forest Beat Office', type: 'forest', lat: 13.082, lon: 79.672, phone: '044-27892300', address: 'Social Forestry Office, Arakkonam' }
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  fromCoords,
  toCoords,
  fromAddress,
  toAddress,
  routeCoordinates = [],
  wildlifeMarkers,
  selectedAnimal,
  onSelectAnimal,
  isSafeRouteActive = false,
  routeRiskLevel = 'LOW',
  isNavigating = false,
  routeDistanceKm = 0,
  containerHeightClass = 'h-[420px]',
  onGetLocation,
  onPlanSafeRoute,
  showingTrajectory = false,
  predictionData
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const [safeCount, setSafeCount] = React.useState<number>(0);
  const [userGpsCoords, setUserGpsCoords] = React.useState<[number, number] | null>(null);
  const [isLocatingGps, setIsLocatingGps] = React.useState<boolean>(false);
  const [gpsToast, setGpsToast] = React.useState<string>('');

  // GPS Locate Handler using Geolocation API
  const handleGpsLocate = () => {
    const map = mapInstanceRef.current;
    setIsLocatingGps(true);

    const applyGpsPosition = (lat: number, lon: number, isRealGps = true) => {
      setUserGpsCoords([lat, lon]);
      setIsLocatingGps(false);
      setGpsToast(isRealGps ? 'GPS Location Centered' : 'Centered on Regional GPS');

      if (map) {
        map.setView([lat, lon], 15, { animate: true });
      }

      setTimeout(() => setGpsToast(''), 3000);
    };

    const handleFallback = () => {
      const fallbackLat = fromCoords.lat !== 0 ? fromCoords.lat : 11.4102;
      const fallbackLon = fromCoords.lon !== 0 ? fromCoords.lon : 76.6950;
      applyGpsPosition(fallbackLat, fallbackLon, false);
    };

    if (!('geolocation' in navigator)) {
      handleFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyGpsPosition(pos.coords.latitude, pos.coords.longitude, true);
      },
      (_err) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applyGpsPosition(pos.coords.latitude, pos.coords.longitude, true);
          },
          () => {
            handleFallback();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initialize Map Instance on Mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center between start and end or default
    const hasValidCoords = fromCoords.lat !== 0 && toCoords.lat !== 0;
    const midLat = hasValidCoords ? (fromCoords.lat + toCoords.lat) / 2 : 11.4102;
    const midLon = hasValidCoords ? (fromCoords.lon + toCoords.lon) / 2 : 76.6950;

    const map = L.map(mapContainerRef.current, {
      center: [midLat, midLon],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    // High Quality Google Maps style Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    // Handle container resize to ensure tiles fit edge-to-edge
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Auto-acquire user's live GPS location on map mount
  useEffect(() => {
    handleGpsLocate();
  }, []);

  // Update Polyline, Markers, and Bounds whenever props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    const hasRouteDetails = fromCoords.lat !== 0 && toCoords.lat !== 0 && (!!fromAddress || !!toAddress);

    // 1. Determine Route Coordinates (Use actual fetched polyline or interpolate path if details supplied)
    let pathPts: Array<[number, number]> = [];
    if (hasRouteDetails) {
      if (routeCoordinates && routeCoordinates.length >= 2) {
        pathPts = routeCoordinates;
      } else {
        // Smooth 5-point interpolated corridor path
        const midLat = (fromCoords.lat + toCoords.lat) / 2;
        const midLon = (fromCoords.lon + toCoords.lon) / 2;
        // Slight curvature shift to simulate winding road
        const curveLat = midLat + (toCoords.lon - fromCoords.lon) * 0.15;
        const curveLon = midLon - (toCoords.lat - fromCoords.lat) * 0.15;

        pathPts = [
          [fromCoords.lat, fromCoords.lon],
          [(fromCoords.lat + curveLat) / 2, (fromCoords.lon + curveLon) / 2],
          [curveLat, curveLon],
          [(curveLat + toCoords.lat) / 2, (curveLon + toCoords.lon) / 2],
          [toCoords.lat, toCoords.lon]
        ];
      }
    }

    if (hasRouteDetails && pathPts.length >= 2) {
      // 2. Draw Route Outer Casing & Inner Polyline
      const routeColor = isSafeRouteActive ? '#059669' : routeRiskLevel === 'HIGH' ? '#dc2626' : '#059669';

      // Casing (glow shadow)
      L.polyline(pathPts, {
        color: '#ffffff',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layersGroup);

      // Main Polyline
      L.polyline(pathPts, {
        color: routeColor,
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isSafeRouteActive ? '10, 5' : undefined
      }).addTo(layersGroup);

      // If Safe Route is active, render alternative safe detour buffer line
      if (isSafeRouteActive) {
        const altPts = pathPts.map(([lat, lon]) => [lat + 0.02, lon + 0.02] as [number, number]);
        L.polyline(altPts, {
          color: '#10b981',
          weight: 3,
          dashArray: '5, 5',
          opacity: 0.8
        }).addTo(layersGroup);
      }

      // 3. Start Marker (Green Compact Icon Pin)
      const startLabel = fromAddress ? fromAddress.split('(')[0].split(',')[0] : 'Start Location';
      const startIcon = L.divIcon({
        className: 'custom-start-pin',
        html: `
          <div style="
            background-color: #059669;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(5,150,105,0.4);
            border: 2px solid white;
            font-size: 14px;
            cursor: pointer;
          " title="Start: ${startLabel}">
            🟢
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const startMarker = L.marker([fromCoords.lat, fromCoords.lon], { icon: startIcon }).addTo(layersGroup);
      startMarker.bindPopup(`
        <div style="padding: 6px; font-family: system-ui, -apple-system, sans-serif; min-width: 150px;">
          <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: #059669; display: flex; align-items: center; gap: 4px;">
            <span>🟢</span> <span>Start Location</span>
          </div>
          <p style="font-weight: 800; font-size: 13px; color: #0f172a; margin: 3px 0 2px 0;">${startLabel}</p>
          <p style="font-size: 10px; color: #64748b; margin: 0;">📍 Coordinates: ${fromCoords.lat.toFixed(4)}, ${fromCoords.lon.toFixed(4)}</p>
        </div>
      `);

      // 4. Destination Marker (Red Compact Icon Pin)
      const endLabel = toAddress ? toAddress.split(',')[0] : 'Destination';
      const endIcon = L.divIcon({
        className: 'custom-end-pin',
        html: `
          <div style="
            background-color: #dc2626;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(220,38,38,0.4);
            border: 2px solid white;
            font-size: 14px;
            cursor: pointer;
          " title="Destination: ${endLabel}">
            🏁
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const endMarker = L.marker([toCoords.lat, toCoords.lon], { icon: endIcon }).addTo(layersGroup);
      endMarker.bindPopup(`
        <div style="padding: 6px; font-family: system-ui, -apple-system, sans-serif; min-width: 150px;">
          <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: #dc2626; display: flex; align-items: center; gap: 4px;">
            <span>🏁</span> <span>Destination</span>
          </div>
          <p style="font-weight: 800; font-size: 13px; color: #0f172a; margin: 3px 0 2px 0;">${endLabel}</p>
          <p style="font-size: 10px; color: #64748b; margin: 0;">📍 Coordinates: ${toCoords.lat.toFixed(4)}, ${toCoords.lon.toFixed(4)}</p>
        </div>
      `);
    }

    // 5. Police Stations & Forest Department Offices along / near the route
    const activeStations: SafetyStation[] = [...REGIONAL_SAFETY_STATIONS];

    if (hasRouteDetails && pathPts.length >= 2) {
      const idx1 = Math.floor(pathPts.length * 0.3);
      const idx2 = Math.floor(pathPts.length * 0.7);
      const pt1 = pathPts[idx1] || pathPts[0];
      const pt2 = pathPts[idx2] || pathPts[pathPts.length - 1];

      const fromTitle = fromAddress ? fromAddress.split('(')[0].split(',')[0].trim() : 'Route';
      const toTitle = toAddress ? toAddress.split(',')[0].trim() : 'Corridor';

      activeStations.push({
        id: 'dyn-pol-route',
        name: `${fromTitle} Police Station & Highway Patrol`,
        type: 'police',
        lat: pt1[0] + 0.002,
        lon: pt1[1] - 0.002,
        phone: '112',
        address: 'Active Highway Safety Outpost'
      });

      activeStations.push({
        id: 'dyn-for-route',
        name: `${toTitle} Forest Department Range Office`,
        type: 'forest',
        lat: pt2[0] - 0.002,
        lon: pt2[1] + 0.002,
        phone: '1800-425-4545',
        address: 'Forest Department Wildlife Protection Depot'
      });
    }

    let renderedStationCount = 0;
    activeStations.forEach((station) => {
      const isPolice = station.type === 'police';
      const bg = isPolice ? '#1e3a8a' : '#065f46';
      const border = isPolice ? '#60a5fa' : '#34d399';
      const iconEmoji = isPolice ? '👮' : '🌲';
      const badgeText = isPolice ? 'Police Station' : 'Forest Dept Office';

      const stationIcon = L.divIcon({
        className: `custom-station-pin-${station.id}`,
        html: `
          <div style="
            background-color: ${bg};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px ${isPolice ? 'rgba(30,58,138,0.45)' : 'rgba(6,95,70,0.45)'};
            border: 2px solid ${border};
            font-size: 15px;
            cursor: pointer;
            transition: transform 0.15s ease;
          " title="${station.name}">
            ${iconEmoji}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const stationMarker = L.marker([station.lat, station.lon], { icon: stationIcon }).addTo(layersGroup);

      const popupContent = `
        <div style="padding: 6px; font-family: system-ui, -apple-system, sans-serif; min-width: 170px;">
          <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: ${isPolice ? '#1e3a8a' : '#065f46'}; display: flex; align-items: center; gap: 4px;">
            <span>${iconEmoji}</span>
            <span>${badgeText}</span>
          </div>
          <p style="font-weight: 800; font-size: 13px; color: #0f172a; margin: 3px 0 2px 0;">${station.name}</p>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">📍 ${station.address}</p>
          <div style="padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 10px; font-weight: 800; color: #059669; display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; background-color: #059669; border-radius: 9999px; display: inline-block;"></span> 24x7 Safety Outpost Active
            </span>
          </div>
        </div>
      `;

      stationMarker.bindPopup(popupContent);
      renderedStationCount++;
    });

    setSafeCount(renderedStationCount);

    // 6. User Live GPS Pulsating Blue Pulse Marker (Rendered ALWAYS)
    const activeGpsLatLon: [number, number] | null =
      userGpsCoords || (fromCoords.lat !== 0 && fromCoords.lon !== 0 ? [fromCoords.lat, fromCoords.lon] : null);

    if (activeGpsLatLon) {
      const userGpsIcon = L.divIcon({
        className: 'custom-user-gps-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div class="gps-pulse-ring"></div>
            <div class="gps-dot"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const gpsMarker = L.marker(activeGpsLatLon, { icon: userGpsIcon, zIndexOffset: 1000 }).addTo(layersGroup);
      gpsMarker.bindPopup(`
        <div style="padding: 6px; font-family: system-ui, -apple-system, sans-serif; min-width: 150px; text-align: center;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: #2563eb; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span>📍</span> <span>Your GPS Position</span>
          </div>
          <p style="font-weight: 800; font-size: 12px; color: #0f172a; margin: 4px 0 2px 0;">
            ${fromAddress || 'Live Device Location'}
          </p>
          <p style="font-size: 10px; color: #64748b; margin: 0;">
            Lat: ${activeGpsLatLon[0].toFixed(5)}, Lon: ${activeGpsLatLon[1].toFixed(5)}
          </p>
        </div>
      `);
    }

    // 7. Interactive Wildlife Risk Marker Pins (Rendered ALWAYS)
    wildlifeMarkers.forEach((animal) => {
      const isSelected = selectedAnimal?.id === animal.id;
      const riskBg = animal.riskLevel === 'HIGH' ? '#fef2f2' : animal.riskLevel === 'MEDIUM' ? '#fffbe1' : '#f0fdf4';
      const riskBorder = animal.riskLevel === 'HIGH' ? '#dc2626' : animal.riskLevel === 'MEDIUM' ? '#eab308' : '#059669';
      const riskBadgeBg = animal.riskLevel === 'HIGH' ? '#dc2626' : animal.riskLevel === 'MEDIUM' ? '#ca8a04' : '#059669';

      const animalIcon = L.divIcon({
        className: `custom-wildlife-pin-${animal.id}`,
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="
              background-color: ${riskBg};
              width: 36px;
              height: 36px;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: ${isSelected ? '0 0 0 3px #059669, 0 8px 18px rgba(0,0,0,0.35)' : '0 3px 10px rgba(0,0,0,0.2)'};
              border: 2.5px solid ${riskBorder};
              font-size: 18px;
              transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
              transition: transform 0.15s ease;
            " title="${animal.common} (${animal.riskLevel} Risk)">
              ${animal.emoji}
            </div>
            <span style="
              position: absolute;
              top: -1px;
              right: -1px;
              width: 10px;
              height: 10px;
              background-color: ${riskBadgeBg};
              border: 1.5px solid white;
              border-radius: 9999px;
            "></span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([animal.lat, animal.lon], { icon: animalIcon }).addTo(layersGroup);

      const animalPopup = `
        <div style="padding: 6px; font-family: system-ui, -apple-system, sans-serif; min-width: 190px; max-width: 250px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 22px; line-height: 1;">${animal.emoji}</span>
            <span style="background-color: ${riskBadgeBg}; color: white; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; text-transform: uppercase;">
              ${animal.riskLevel} RISK
            </span>
          </div>
          <p style="font-weight: 800; font-size: 13px; color: #0f172a; margin: 0 0 2px 0;">${animal.common}</p>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">📍 ${animal.locationName}</p>
          ${animal.image ? `<div style="border-radius: 8px; overflow: hidden; margin: 6px 0; max-height: 110px;"><img src="${animal.image}" alt="${animal.common}" style="width: 100%; height: 100px; object-fit: cover;" /></div>` : ''}
          <div style="padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #475569; display: flex; flex-direction: column; gap: 3px;">
            <div><strong>Status:</strong> ${animal.movementStatus}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>Seen: <strong>${animal.lastSeen}</strong></span>
              <span style="color: #059669; font-weight: 700;">${animal.confidence}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(animalPopup);

      marker.on('click', () => {
        onSelectAnimal(animal);
      });

      // If this animal is currently selected, draw 2 to 3 distinct predicted movement trajectories!
      if (isSelected) {
        let pathsToDraw = predictionData?.paths || animal.movementPaths;

        if (!pathsToDraw || pathsToDraw.length === 0) {
          pathsToDraw = generateCorridorPredictions(animal.common, animal.lat, animal.lon, animal.riskLevel);
        }

        pathsToDraw.forEach((path: any) => {
          const pts = path.points.map((p: any) => [p.lat, p.lon] as [number, number]);
          if (pts.length >= 2) {
            const poly = L.polyline(pts, {
              color: path.color || '#10b981',
              weight: path.type === 'PRIMARY' ? 4.5 : 3,
              dashArray: path.type === 'PRIMARY' ? '6, 4' : path.type === 'SECONDARY' ? '4, 4' : '2, 4',
              opacity: 0.95
            }).addTo(layersGroup);

            poly.bindPopup(`
              <div style="padding: 4px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${path.color};">
                  ${path.type || 'PATH'} (${path.confidence}% CONFIDENCE)
                </div>
                <p style="font-weight: 800; font-size: 12px; margin: 2px 0 4px 0; color: #0f172a;">${path.name}</p>
                <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0;">${path.description}</p>
                <div style="font-size: 10.5px; background: #f1f5f9; padding: 6px; border-radius: 6px; color: #0f172a; line-height: 1.4;">
                  <div style="font-weight: 700; color: #047857;">📍 Next Location:</div>
                  <div style="color: #1e293b; font-weight: 600;">${path.nextLocation || 'Projected Zone'}</div>
                  <div style="margin-top: 3px; font-size: 10px; color: #64748b;">⏱️ Window: <strong>${path.timeWindow || '+15m'}</strong></div>
                </div>
              </div>
            `);

            const lastPt = pts[pts.length - 1];
            const shortLabel = path.type === 'PRIMARY' ? 'Primary' : path.type === 'SECONDARY' ? 'Secondary' : 'Alt Trail';

            const badgeIcon = L.divIcon({
              className: `path-badge-${path.id}`,
              html: `
                <div style="
                  background-color: ${path.color};
                  color: white;
                  border-radius: 9999px;
                  padding: 2px 7px;
                  font-size: 10px;
                  font-weight: 800;
                  white-space: nowrap;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                  border: 1.5px solid white;
                  display: flex;
                  align-items: center;
                  gap: 3px;
                ">
                  <span>${shortLabel}</span>
                  <span style="opacity: 0.9;">${path.confidence}%</span>
                </div>
              `,
              iconSize: [85, 22],
              iconAnchor: [42, 11]
            });

            L.marker(lastPt, { icon: badgeIcon }).addTo(layersGroup);
          }
        });
      }
    });

    // 8. Automatically View / Center Map
    if (hasRouteDetails && pathPts.length >= 2) {
      const validLats = [fromCoords.lat, toCoords.lat];
      const validLons = [fromCoords.lon, toCoords.lon];

      pathPts.forEach(([lat, lon]) => {
        validLats.push(lat);
        validLons.push(lon);
      });

      map.fitBounds(
        [
          [Math.min(...validLats), Math.min(...validLons)],
          [Math.max(...validLats), Math.max(...validLons)]
        ],
        { padding: [45, 45], maxZoom: 14 }
      );
    } else if (userGpsCoords) {
      map.setView(userGpsCoords, 15, { animate: true });
    } else if (selectedAnimal) {
      map.setView([selectedAnimal.lat, selectedAnimal.lon], 13, { animate: true });
    } else if (wildlifeMarkers.length > 0) {
      const validLats = wildlifeMarkers.map(m => m.lat).filter(l => typeof l === 'number' && l !== 0);
      const validLons = wildlifeMarkers.map(m => m.lon).filter(l => typeof l === 'number' && l !== 0);
      if (validLats.length === 1) {
        map.setView([validLats[0], validLons[0]], 13, { animate: true });
      } else if (validLats.length > 1) {
        map.fitBounds(
          [
            [Math.min(...validLats), Math.min(...validLons)],
            [Math.max(...validLats), Math.max(...validLons)]
          ],
          { padding: [50, 50], maxZoom: 14 }
        );
      }
    } else if (fromCoords.lat !== 0 && fromCoords.lon !== 0) {
      map.setView([fromCoords.lat, fromCoords.lon], 13, { animate: true });
    } else {
      map.setView([11.4102, 76.6950], 11);
    }
  }, [
    fromCoords.lat,
    fromCoords.lon,
    toCoords.lat,
    toCoords.lon,
    routeCoordinates,
    wildlifeMarkers,
    selectedAnimal?.id,
    isSafeRouteActive,
    routeRiskLevel,
    fromAddress,
    toAddress,
    userGpsCoords
  ]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (userGpsCoords) {
      map.setView(userGpsCoords, 15, { animate: true });
      return;
    }
    const allLats = [fromCoords.lat, toCoords.lat, ...wildlifeMarkers.map(m => m.lat)].filter(l => l !== 0);
    const allLons = [fromCoords.lon, toCoords.lon, ...wildlifeMarkers.map(m => m.lon)].filter(l => l !== 0);
    if (allLats.length > 0 && allLons.length > 0) {
      map.fitBounds(
        [
          [Math.min(...allLats), Math.min(...allLons)],
          [Math.max(...allLats), Math.max(...allLons)]
        ],
        { padding: [40, 40] }
      );
    } else {
      map.setView([11.4102, 76.6950], 11, { animate: true });
    }
  };

  // Calculate active risk count and safe spot count
  const highRiskCount = wildlifeMarkers.filter(m => m.riskLevel === 'HIGH' || m.riskLevel === 'MEDIUM').length;

  return (
    <div className={`relative w-full ${containerHeightClass} rounded-none md:rounded-3xl overflow-hidden border-x-0 border-y md:border md:border-slate-200 shadow-none md:shadow-sm bg-slate-100 flex flex-col`}>
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Info Badge Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-200/80 shadow-md flex items-center gap-2 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse"></span>
          <span className="text-xs font-extrabold text-slate-800">
            {fromAddress || toAddress 
              ? `${fromAddress ? fromAddress.split('(')[0].trim() : 'From'} → ${toAddress ? toAddress.split(',')[0].trim() : 'Destination'}`
              : 'Enter Locations To Calculate Route'}
          </span>
          {routeDistanceKm > 0 && (
            <span className="bg-emerald-50 text-[#059669] text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
              {routeDistanceKm} km
            </span>
          )}
        </div>

        <button
          onClick={handleRecenter}
          title="Recenter Map View"
          className="bg-white/95 backdrop-blur-md p-2 rounded-full border border-slate-200 shadow-md text-slate-700 hover:text-[#059669] hover:bg-emerald-50 transition pointer-events-auto cursor-pointer"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* FLOATING OVERLAYS */}
      {wildlifeMarkers.length === 0 && (
        <div className="absolute top-16 left-3 right-3 z-20 bg-slate-900/90 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs pointer-events-auto animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span className="font-semibold">No animal sightings match selected filter</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-20 sm:bottom-22 left-3 right-3 sm:left-6 sm:right-6 max-w-4xl mx-auto z-20 flex flex-col gap-2.5 pointer-events-none">
        {/* Row 1: Floating GPS Toast + Right Location Button */}
        <div className="relative flex items-center justify-end w-full min-h-[44px]">

          {/* Toast badge floating absolutely so it doesn't shift flex layout */}
          {gpsToast && (
            <div className="absolute -top-10 right-0 bg-blue-600/95 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-lg animate-in fade-in duration-200 pointer-events-auto flex items-center gap-1.5 z-30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0"></span>
              <span className="truncate max-w-[180px]">{gpsToast}</span>
            </div>
          )}

          {/* Bottom Right Target GPS Icon Button */}
          <button
            onClick={handleGpsLocate}
            disabled={isLocatingGps}
            title="Locate Live GPS Coordinates"
            id="gps-locate-target-btn"
            className="absolute right-0 w-11 h-11 rounded-full bg-white border border-slate-200/90 shadow-xl flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 active:bg-slate-100 transition-colors pointer-events-auto shrink-0 z-20 group cursor-pointer"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {isLocatingGps ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair size={20} className={`text-slate-700 group-hover:text-blue-600 transition-colors ${userGpsCoords ? 'text-blue-600' : ''}`} />
              )}
            </div>
            {userGpsCoords && !isLocatingGps && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full"></span>
            )}
          </button>
        </div>

        {/* Row 2: Emerald Green "Plan Safe Route" Pill Button */}
        {onPlanSafeRoute && !isNavigating && (
          <div className="flex justify-center w-full pointer-events-auto">
            <button
              onClick={onPlanSafeRoute}
              className="bg-[#059669] hover:bg-[#047857] active:scale-95 text-white px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer max-w-xs w-full sm:w-auto"
            >
              <Navigation size={16} className="fill-current" />
              <span>Plan Safe Route</span>
            </button>
          </div>
        )}
      </div>


      {/* Navigation HUD Pulse Overlay when navigating */}
      {isNavigating && (
        <div className="absolute top-14 right-3 z-10 bg-[#059669] text-white px-3.5 py-2 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 animate-pulse">
          <Navigation size={14} className="animate-bounce" />
          <span>Live GPS Guidance Active</span>
        </div>
      )}
    </div>
  );
};
