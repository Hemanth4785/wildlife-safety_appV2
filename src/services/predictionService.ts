import { MovementPredictionPath } from '../types';

interface RadialOffsetResult {
  lat: number;
  lon: number;
  dLat: number;
  dLon: number;
}

function calculateRadialOffset(
  baseLat: number,
  baseLon: number,
  bearingDegrees: number,
  distanceKm: number
): RadialOffsetResult {
  const bearingRad = (bearingDegrees * Math.PI) / 180;
  const latRad = (baseLat * Math.PI) / 180;

  // 1 degree latitude ≈ 111.0 km
  const dLat = (distanceKm / 111.0) * Math.cos(bearingRad);
  // 1 degree longitude ≈ 111.0 * cos(lat) km
  const dLon = (distanceKm / (111.0 * Math.max(0.2, Math.cos(latRad)))) * Math.sin(bearingRad);

  return {
    lat: Number((baseLat + dLat).toFixed(4)),
    lon: Number((baseLon + dLon).toFixed(4)),
    dLat,
    dLon
  };
}

function generateCurvedPoints(
  baseLat: number,
  baseLon: number,
  endLat: number,
  endLon: number,
  timeSteps: [string, string, string, string],
  curveFactor: number = 1
): Array<{ lat: number; lon: number; timeAhead: string }> {
  const dLat = endLat - baseLat;
  const dLon = endLon - baseLon;

  // Perpendicular vector for terrain curvature simulation
  const perpLat = -dLon * 0.15 * curveFactor;
  const perpLon = dLat * 0.15 * curveFactor;

  const p1Lat = Number((baseLat + dLat * 0.35 + perpLat).toFixed(4));
  const p1Lon = Number((baseLon + dLon * 0.35 + perpLon).toFixed(4));

  const p2Lat = Number((baseLat + dLat * 0.70 - perpLat * 0.5).toFixed(4));
  const p2Lon = Number((baseLon + dLon * 0.70 - perpLon * 0.5).toFixed(4));

  return [
    { lat: Number(baseLat.toFixed(4)), lon: Number(baseLon.toFixed(4)), timeAhead: timeSteps[0] },
    { lat: p1Lat, lon: p1Lon, timeAhead: timeSteps[1] },
    { lat: p2Lat, lon: p2Lon, timeAhead: timeSteps[2] },
    { lat: Number(endLat.toFixed(4)), lon: Number(endLon.toFixed(4)), timeAhead: timeSteps[3] }
  ];
}

export function generateCorridorPredictions(
  species: string,
  baseLat: number,
  baseLon: number,
  animalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH'
): MovementPredictionPath[] {
  const spName = (species || '').toLowerCase();

  let primaryDest = 'Moyar River Drainage Basin';
  let secondaryDest = 'Kaggal Bamboo Ridge Slope';
  let altDest = 'Glenmorgan Tea Estate Fringe';

  let primaryDesc = 'Main trajectory following river drainage basin, natural waterholes, and dense canopy cover.';
  let secondaryDesc = 'Higher-elevation bamboo ridge route avoiding human highway transit activity.';
  let altDesc = 'Infrequent border trail traversing tea plantation clearings for foraging.';

  let b1 = 40;  // NE
  let d1 = 2.1; // km
  let b2 = 315; // NW
  let d2 = 1.5; // km
  let b3 = 145; // SE
  let d3 = 1.2; // km

  let primaryConf = 88;
  let secondaryConf = 68;
  let altConf = 45;

  if (spName.includes('tiger')) {
    primaryDest = 'Moyar Canyon Waterhole & Teak Canopy';
    secondaryDest = 'Bandipur Reserve Ridge Escarpment';
    altDest = 'Gundlupet Buffer Plantation Clearing';
    primaryDesc = 'Solitary territorial patrol trajectory along deep ravine teak canopy and waterholes.';
    secondaryDesc = 'Elevated rocky ridge escarpment offering high territorial vantage points.';
    altDesc = 'Nocturnal buffer transit through eucalyptus plantation clearing.';
    b1 = 15;  d1 = 2.4;
    b2 = 80;  d2 = 1.7;
    b3 = 285; d3 = 1.3;
    primaryConf = 92; secondaryConf = 70; altConf = 48;
  } else if (spName.includes('leopard')) {
    primaryDest = 'Pykara Stream Tributary Basin';
    secondaryDest = 'Pykara Granite Outcrop Escarpment';
    altDest = 'Ooty Outer Buffer Reserve Fringe';
    primaryDesc = 'Dense riparian stream bed with thick shrub cover ideal for nocturnal stalking.';
    secondaryDesc = 'Steep granite cliff faces and rocky ledges for daytime perching.';
    altDesc = 'Forest perimeter near village livestock grazing boundaries.';
    b1 = 275; d1 = 1.9;
    b2 = 210; d2 = 1.4;
    b3 = 130; d3 = 1.1;
    primaryConf = 89; secondaryConf = 66; altConf = 42;
  } else if (spName.includes('gaur') || spName.includes('bison')) {
    primaryDest = 'Ketty Valley Pasture Stream';
    secondaryDest = 'Coonoor Upper Ridge Knoll';
    altDest = 'Coonoor Tea Estate Border';
    primaryDesc = 'Open grassy valley meadow corridor with active stream watering points.';
    secondaryDesc = 'Herd resting slope with high line-of-sight visibility over valley slopes.';
    altDesc = 'Grassy tea plantation hedge clearings for morning grazing.';
    b1 = 150; d1 = 1.7;
    b2 = 65;  d2 = 1.3;
    b3 = 220; d3 = 1.0;
    primaryConf = 85; secondaryConf = 64; altConf = 40;
  } else if (spName.includes('bear')) {
    primaryDest = 'Kotagiri Reserved Ravine Waterhole';
    secondaryDest = 'Kotagiri Dense Bamboo Ridge';
    altDest = 'Kodaikanal Outer Forest Fringe';
    primaryDesc = 'Ravine floor with high density of termite mounds and fruiting forest trees.';
    secondaryDesc = 'Dense bamboo thickets providing daytime resting shelter.';
    altDesc = 'Dry scrub forest border near fruit orchards.';
    b1 = 110; d1 = 1.6;
    b2 = 35;  d2 = 1.2;
    b3 = 240; d3 = 0.9;
    primaryConf = 86; secondaryConf = 62; altConf = 44;
  } else if (!spName.includes('elephant')) {
    // Dynamic fallback for any other species string
    const strHash = (species || 'Wild').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    b1 = (strHash * 37) % 360;
    d1 = 1.2 + (strHash % 10) * 0.12;
    b2 = (strHash * 73 + 120) % 360;
    d2 = 1.0 + (strHash % 7) * 0.11;
    b3 = (strHash * 109 + 240) % 360;
    d3 = 0.8 + (strHash % 5) * 0.10;
  }

  const p1 = calculateRadialOffset(baseLat, baseLon, b1, d1);
  const p2 = calculateRadialOffset(baseLat, baseLon, b2, d2);
  const p3 = calculateRadialOffset(baseLat, baseLon, b3, d3);

  return [
    {
      id: `path-primary-${baseLat.toFixed(3)}-${baseLon.toFixed(3)}`,
      name: `Primary Corridor (${primaryDest.split(' ')[0]})`,
      type: 'PRIMARY',
      confidence: primaryConf,
      riskLevel: animalRiskLevel === 'LOW' ? 'MEDIUM' : animalRiskLevel,
      color: '#10b981',
      description: primaryDesc,
      nextLocation: `${primaryDest} (${p1.lat}, ${p1.lon})`,
      nextCoords: { lat: p1.lat, lon: p1.lon },
      timeWindow: '+15m ➔ +45m',
      points: generateCurvedPoints(baseLat, baseLon, p1.lat, p1.lon, ['Now', '+15m', '+30m', '+45m'], 1.0)
    },
    {
      id: `path-secondary-${baseLat.toFixed(3)}-${baseLon.toFixed(3)}`,
      name: `Secondary Path (${secondaryDest.split(' ')[0]})`,
      type: 'SECONDARY',
      confidence: secondaryConf,
      riskLevel: 'MEDIUM',
      color: '#f59e0b',
      description: secondaryDesc,
      nextLocation: `${secondaryDest} (${p2.lat}, ${p2.lon})`,
      nextCoords: { lat: p2.lat, lon: p2.lon },
      timeWindow: '+30m ➔ +60m',
      points: generateCurvedPoints(baseLat, baseLon, p2.lat, p2.lon, ['Now', '+20m', '+40m', '+60m'], -0.8)
    },
    {
      id: `path-alternative-${baseLat.toFixed(3)}-${baseLon.toFixed(3)}`,
      name: `Alternative Trail (${altDest.split(' ')[0]})`,
      type: 'ALTERNATIVE',
      confidence: altConf,
      riskLevel: 'LOW',
      color: '#6366f1',
      description: altDesc,
      nextLocation: `${altDest} (${p3.lat}, ${p3.lon})`,
      nextCoords: { lat: p3.lat, lon: p3.lon },
      timeWindow: '+45m ➔ +90m',
      points: generateCurvedPoints(baseLat, baseLon, p3.lat, p3.lon, ['Now', '+30m', '+60m', '+90m'], 0.6)
    }
  ];
}
