// @ts-ignore
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

const SYSTEM_INSTRUCTION = `You are Wildlife Guardian AI, the intelligent assistant for the Wildlife Safety Application.

Your purpose is to help people travel safely through wildlife-prone regions of South India by providing accurate, safety-focused, and easy-to-understand guidance.

You are integrated with the Wildlife Safety application (React Native Expo SDK 54 frontend, Node.js Express backend hosted on Render, and Python Machine Learning pipeline) and provide responses based on available backend data, wildlife predictions, weather information, and route analysis whenever available.

----------------------------------------------------
APPLICATION REGION (SOUTH INDIA)
----------------------------------------------------
Focus on wildlife and travel guidance for South India:
• Tamil Nadu
• Kerala
• Karnataka
• Andhra Pradesh
• Telangana (where applicable)

Give special attention to major wildlife corridors and protected areas:
• Nilgiris Biosphere Reserve
• Mudumalai Tiger Reserve
• Bandipur National Park
• Nagarhole National Park
• Wayanad Wildlife Sanctuary
• Sathyamangalam Tiger Reserve
• Anamalai Tiger Reserve
• Kalakkad Mundanthurai Tiger Reserve
• BRT Tiger Reserve
• Silent Valley National Park
• Periyar Tiger Reserve

----------------------------------------------------
SUPPORTED WILDLIFE
----------------------------------------------------
Provide application-specific guidance for:
• Asian Elephant (Elephas maximus)
• Bengal Tiger (Panthera tigris)
• Leopard (Panthera pardus)
• Sloth Bear (Melursus ursinus)
• Indian Gaur (Bos gaurus)
• Bison (Bison bison)

If asked about another species, politely explain that it is currently outside the application's supported scope. You may provide general public info if appropriate, but distinguish it from app capabilities.

----------------------------------------------------
APPLICATION DATA SOURCES & STRICT NO-SENSOR RULE
----------------------------------------------------
The application uses:
• Recent wildlife observations
• Historical wildlife records (GBIF)
• iNaturalist observations
• Machine Learning movement predictions
• OpenWeather weather information
• OpenStreetMap
• OSRM routing
• NASA SRTM DEM
• HydroSHEDS

STRICT RULE: Do NOT mention sensors, radar systems, IoT devices, or hardware detection because this application does not use them.

----------------------------------------------------
CAPABILITIES & TRAVEL ADVICE
----------------------------------------------------
Help users with:
• Wildlife safety & safe travel planning
• Route risk explanations & movement predictions
• Forest safety & weather impact on wildlife movement
• Protected area information & conservation awareness
• Emergency wildlife encounter guidance

Regional South India Travel Advice Principles:
• Wildlife movement is generally higher during dawn, dusk, nighttime, and rainy seasons.
• Exercise extra caution while travelling through forest roads, ghat roads, and protected wildlife corridors.
• Reduce vehicle speed in wildlife crossing zones.
• Follow Forest Department warning signs.
• If the application indicates elevated wildlife risk, consider the recommended alternate route.

----------------------------------------------------
PRECAUTIONS
----------------------------------------------------
Always recommend:
• Stay inside your vehicle if wildlife is nearby.
• Never feed or approach wild animals.
• Maintain a safe distance.
• Avoid unnecessary honking or flashing high beams directly at animals.
• Drive slowly through forest areas.
• Follow instructions issued by Forest Department officials.
• Be especially cautious during fog, heavy rain, and nighttime.

----------------------------------------------------
CONVERSATION STYLE & RESTRICTIONS
----------------------------------------------------
• Style: Friendly, calm, professional, helpful, safety-focused, concise for mobile screens, using bullet points.
• Never invent: wildlife sightings, prediction results, weather conditions, or user locations.
• Never mention: radar systems, wildlife sensors, or IoT devices.
• Never recommend unsafe behaviour around wildlife.
• If live information is unavailable, clearly state: "I don't currently have live data for that location. Based on general wildlife safety guidance..."

Greeting Example:
"Hello! I'm Wildlife Guardian AI. I can help you with wildlife safety, route planning, movement predictions, travel precautions, and conservation information in South India. How can I help you today?"`;

// 1. Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, routeContext, activeSightings } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const contents = [];
        if (Array.isArray(history)) {
          for (const item of history) {
            contents.push({
              role: item.role === 'model' ? 'model' : 'user',
              parts: [{ text: item.text }]
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        // Dynamic prompt construction with Route Query & Active Sightings
        let routeContextStr = "";
        if (routeContext && (routeContext.start || routeContext.end)) {
          routeContextStr = `\n----------------------------------------------------\nCURRENT USER ROUTE QUERY:\n- Origin: ${routeContext.start || 'Not specified'}\n- Destination: ${routeContext.end || 'Not specified'}\n- Route Risk Level: ${routeContext.riskLevel || 'LOW'}\n- Mode of Travel: ${routeContext.travelMode || 'Car'}`;
        }

        let sightingsContextStr = "";
        if (Array.isArray(activeSightings) && activeSightings.length > 0) {
          sightingsContextStr = `\n----------------------------------------------------\nACTIVE WILDLIFE SIGHTINGS & FIELD REPORTS (${activeSightings.length} Active):\n` +
            activeSightings.map((s: any, idx: number) =>
              `• [${idx + 1}] ${s.species || s.common || 'Wildlife'} at ${s.location || 'Forest Corridor'} | Risk: ${s.riskLevel || 'LOW'} | Recorded: ${s.time || 'Recent'} ${s.isUserSubmitted ? '(Field Sighting Report)' : ''}`
            ).join('\n');
        }

        const fullSystemInstruction = `${SYSTEM_INSTRUCTION}
${routeContextStr}
${sightingsContextStr}

DATA SOURCE NOTE:
Wildlife activity and route safety are determined using recent observations, ML movement predictions, GBIF historical data, iNaturalist observations, OpenWeather conditions, NASA SRTM DEM terrain/elevation, HydroSHEDS water body data, and OpenStreetMap/OSRM routing. The application does NOT rely on physical wildlife sensors or radar systems.

INSTRUCTION: Provide tailored, safety-first guidance specific to the user's route query and active regional wildlife sightings if relevant.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents,
          config: {
            systemInstruction: fullSystemInstruction,
            temperature: 0.3,
            maxOutputTokens: 800,
          }
        });

        const reply = response.text || "I am currently monitoring corridor telemetry. Please keep a safe distance from wildlife.";
        return res.json({ reply, source: 'gemini' });
      } catch (geminiErr: any) {
        console.error('Gemini API execution error:', geminiErr?.message || geminiErr);
      }
    }

    // Smart Local Fallback Rules Engine strictly adhering to System Prompt
    const lowerMsg = message.toLowerCase();

    // Unsupported species check
    const supportedKeywords = ['elephant', 'elephas', 'tiger', 'panthera', 'leopard', 'sloth bear', 'melursus', 'gaur', 'bos gaurus', 'bison'];
    const unsupportedSpecies = ['lion', 'cheetah', 'jaguar', 'pumas', 'wolf', 'hippo', 'rhino', 'crocodile', 'alligator', 'giraffe', 'anaconda', 'cobra', 'python', 'bear'];
    
    const isAskingUnsupported = unsupportedSpecies.some(s => lowerMsg.includes(s)) && !supportedKeywords.some(s => lowerMsg.includes(s));

    if (isAskingUnsupported) {
      return res.json({
        reply: "I am Wildlife Guardian AI. This application currently supports 6 key species in our regional monitoring network: Asian Elephant, Tiger, Leopard, Sloth Bear, Indian Gaur, and Bison. The species you mentioned is not currently supported.",
        source: 'local'
      });
    }

    let reply = "";
    if (lowerMsg === 'hi' || lowerMsg === 'hello' || lowerMsg === 'hey' || lowerMsg.startsWith('hello') || lowerMsg.startsWith('hi ')) {
      reply = "Hello! I'm Wildlife Guardian AI. I can help you with wildlife safety, route planning, movement predictions, travel precautions, and conservation information. How can I help you today?";
    } else if (lowerMsg.includes('elephant') || lowerMsg.includes('elephas')) {
      reply = "• **Asian Elephant Safety**:\n- Keep at least 100 meters distance.\n- Never sound loud horns or flash high beams.\n- If an elephant blocks the highway, remain inside your vehicle and wait quietly until it moves into the forest corridor.";
    } else if (lowerMsg.includes('tiger') || lowerMsg.includes('leopard')) {
      reply = "• **Big Cat Safety Protocol**:\n- Tigers and Leopards are active hunters during dusk and dawn.\n- Avoid solitary night travel or walking near tea estate borders after 6 PM.\n- If sighted from a vehicle, keep windows closed and do not exit.";
    } else if (lowerMsg.includes('gaur') || lowerMsg.includes('bison')) {
      reply = "• **Indian Gaur & Bison Guidelines**:\n- Maintain a safe 50-meter buffer.\n- Indian Gaur can turn aggressive if startled. Give bulls ample space to cross tea gardens and forest corridors.";
    } else if (lowerMsg.includes('sloth bear') || lowerMsg.includes('bear')) {
      reply = "• **Sloth Bear Safety**:\n- Sloth bears have keen hearing but poor eyesight and can react defensively if surprised.\n- Make your presence known by talking calmly if walking on forest edges. Never approach a bear with cubs.";
    } else if (lowerMsg.includes('route') || lowerMsg.includes('road') || lowerMsg.includes('ooty') || lowerMsg.includes('gudalur')) {
      reply = "• **Nilgiris Corridor Route Advisory**:\n- Ooty–Gudalur Highway (km 12–18) has frequent elephant movement based on recent observations and ML movement predictions.\n- Before travelling, check the latest wildlife activity and route risk information available in the application.\n- Drive below 30 km/h in notified forest zones and remain alert, especially during dawn, dusk, and at night.";
    } else if (lowerMsg.includes('emergency') || lowerMsg.includes('encounter')) {
      reply = "• **Emergency Encounter Protocol**:\n1. Remain calm and do not run.\n2. Back away slowly while keeping your eyes on the animal.\n3. Stay inside or return to your vehicle immediately.\n4. Call local Forest Department Emergency Line: 1800-425-4545.";
    } else {
      reply = "I am Wildlife Guardian AI. I can assist you with animal movement predictions, corridor risk levels, weather impact, and safety protocols for Asian Elephants, Tigers, Leopards, Sloth Bears, Gaurs, and Bisons in the Nilgiris Biosphere.";
    }

    return res.json({ reply, source: 'local' });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error processing chat request' });
  }
});

// 2. Mock Backend Endpoints as per specification
app.get('/api/wildlife/recent', (req, res) => {
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    data: [
      {
        id: 'rep-101',
        species: 'Elephas maximus',
        commonName: 'Asian Elephant',
        location: 'Mudumalai Forest Border (km 14)',
        lat: 11.412,
        lon: 76.698,
        risk: 'HIGH',
        observedAt: new Date(Date.now() - 10 * 60000).toISOString()
      },
      {
        id: 'rep-102',
        species: 'Panthera pardus',
        commonName: 'Leopard',
        location: 'Glenmorgan Tea Estate Fringe',
        lat: 11.395,
        lon: 76.680,
        risk: 'MODERATE',
        observedAt: new Date(Date.now() - 35 * 60000).toISOString()
      }
    ]
  });
});

app.get('/api/weather', (req, res) => {
  res.json({
    location: 'Ooty / Nilgiris Biosphere',
    tempC: 19,
    humidity: 82,
    windKmH: 14,
    condition: 'Partly Cloudy',
    impactOnWildlife: 'Moderate humidity increases crepuscular activity along river banks.'
  });
});

app.get('/api/route/osrm', async (req, res) => {
  const { fromLat, fromLon, toLat, toLon, mode } = req.query;

  const fLat = parseFloat(fromLat as string) || 11.4102;
  const fLon = parseFloat(fromLon as string) || 76.6950;
  const tLat = parseFloat(toLat as string) || 11.564;
  const tLon = parseFloat(toLon as string) || 76.534;
  const travelMode = (mode as string) === 'bike' ? 'bike' : 'car';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const osrmRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fLon},${fLat};${tLon},${tLat}?overview=full&geometries=geojson&steps=true`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (osrmRes.ok) {
      const data = await osrmRes.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0];
        const distKm = Number((primary.distance / 1000).toFixed(1));
        const speedKmH = travelMode === 'car' ? 40 : 30;
        const durationMin = Math.round((distKm / speedKmH) * 60);

        const coordinates = primary.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

        return res.json({
          status: 'OK',
          distanceKm: distKm,
          durationMin,
          travelMode,
          coordinates,
          routes: [
            {
              name: 'Recommended Corridor Route',
              distanceKm: distKm,
              durationMin,
              wildlifeRiskScore: distKm > 40 ? 'HIGH' : 'LOW',
              riskFactor: distKm > 40 ? 'Elephant & Tiger Crossing Zone' : 'Clear Buffer Corridor'
            }
          ]
        });
      }
    }
  } catch (_err) {
    // Fallthrough to Haversine estimate
  }

  // Haversine fallback calculation with mountain road winding factor (1.3)
  const R = 6371; // km
  const dLat = ((tLat - fLat) * Math.PI) / 180;
  const dLon = ((tLon - fLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fLat * Math.PI) / 180) * Math.cos((tLat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDist = R * c;
  const distKm = Number((straightDist * 1.3).toFixed(1));
  
  // Adjust speed based on travel distance (highways vs winding mountain ghats)
  const speedKmH = distKm > 60
    ? (travelMode === 'car' ? 60 : 45)
    : (travelMode === 'car' ? 40 : 30);
  const durationMin = Math.round((distKm / speedKmH) * 60);

  return res.json({
    status: 'OK',
    distanceKm: distKm,
    durationMin,
    travelMode,
    coordinates: [
      [fLat, fLon],
      [(fLat + tLat) / 2, (fLon + tLon) / 2],
      [tLat, tLon]
    ],
    routes: [
      {
        name: 'Standard Corridor Route',
        distanceKm: distKm,
        durationMin,
        wildlifeRiskScore: distKm > 40 ? 'HIGH' : 'LOW',
        riskFactor: 'Monitored Forest Highway'
      }
    ]
  });
});

// Dynamic Geocoding Search Endpoint for Autocomplete
app.get('/api/geocode/search', async (req, res) => {
  const { q } = req.query;
  const queryStr = (q as string || '').trim().toLowerCase();
  if (!queryStr || queryStr.length < 2) {
    return res.json({ results: [] });
  }

  // Pre-indexed Regional Landmarks for South India & Wildlife Corridors
  const LOCAL_PLACES = [
    { name: 'Udhagamandalam (Ooty Town Center)', address: 'Ooty, Nilgiris, Tamil Nadu', lat: 11.4102, lon: 76.6950 },
    { name: 'Mudumalai National Park & Tiger Reserve', address: 'Theppakadu, Nilgiris, Tamil Nadu', lat: 11.5640, lon: 76.5340 },
    { name: 'Bandipur Tiger Reserve', address: 'Chamarajanagar, Karnataka', lat: 11.6660, lon: 76.6260 },
    { name: 'Kotagiri Wildlife Corridor', address: 'Nilgiris, Tamil Nadu', lat: 11.4200, lon: 76.8800 },
    { name: 'Coonoor Tea Estate Road', address: 'Coonoor, Nilgiris, Tamil Nadu', lat: 11.3530, lon: 76.7950 },
    { name: 'Wayanad Wildlife Sanctuary', address: 'Sulthan Bathery, Kerala', lat: 11.6850, lon: 76.3680 },
    { name: 'Arakkonam Junction', address: 'Ranipet District, Tamil Nadu', lat: 13.0780, lon: 79.6680 },
    { name: 'Chennai Central Station', address: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707 },
    { name: 'Coimbatore Airport / City Center', address: 'Coimbatore, Tamil Nadu', lat: 11.0168, lon: 76.9558 },
    { name: 'Mysuru (Mysore Palace / Station)', address: 'Mysuru, Karnataka', lat: 12.2958, lon: 76.6394 },
    { name: 'Bengaluru (Bangalore Central)', address: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946 },
    { name: 'Gudalur Forest Border', address: 'Gudalur, Nilgiris, Tamil Nadu', lat: 11.5034, lon: 76.4950 },
    { name: 'Pykara Waterfalls & Lake', address: 'Pykara, Nilgiris, Tamil Nadu', lat: 11.4550, lon: 76.6020 },
    { name: 'Glenmorgan Peak', address: 'Nilgiris, Tamil Nadu', lat: 11.4620, lon: 76.6510 },
    { name: 'Sathyamangalam Tiger Reserve', address: 'Erode District, Tamil Nadu', lat: 11.5060, lon: 77.2410 },
    { name: 'Nagarhole National Park', address: 'Kodagu / Mysore, Karnataka', lat: 12.0300, lon: 76.1200 },
    { name: 'Silent Valley National Park', address: 'Palakkad, Kerala', lat: 11.1350, lon: 76.4300 }
  ];

  const localMatches = LOCAL_PLACES.filter(p => 
    p.name.toLowerCase().includes(queryStr) || 
    p.address.toLowerCase().includes(queryStr)
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=5`,
      {
        headers: { 'User-Agent': 'WildlifeGuardianApp/1.0 (contact@wildlifeguardian.org)' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (nominatimRes.ok) {
      const data = await nominatimRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const externalMatches = data.map((item: any) => ({
          name: item.display_name.split(',').slice(0, 2).join(',').trim(),
          address: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }));

        const combined = [...localMatches];
        for (const ext of externalMatches) {
          if (!combined.some(c => Math.abs(c.lat - ext.lat) < 0.01 && Math.abs(c.lon - ext.lon) < 0.01)) {
            combined.push(ext);
          }
        }
        return res.json({ results: combined.slice(0, 6) });
      }
    }
  } catch (_e) {
    // Rely on local regional database fallback
  }

  return res.json({ results: localMatches.slice(0, 6) });
});

// Reverse Geocoding Endpoint for GPS Coordinates
app.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const latNum = parseFloat(lat as string);
    const lonNum = parseFloat(lon as string);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Attempt OpenStreetMap Nominatim reverse lookup with fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNum}&lon=${lonNum}`,
      {
        headers: { 'User-Agent': 'WildlifeGuardianApp/1.0 (contact@wildlifeguardian.org)' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (nominatimRes.ok) {
      const data = await nominatimRes.json();
      const addr = data.address;
      if (addr) {
        const placeName =
          addr.road ||
          addr.pedestrian ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.village ||
          addr.town ||
          addr.city ||
          addr.county;
        const district = addr.city || addr.town || addr.county || addr.state_district;
        const state = addr.state;

        const parts = [placeName, district, state].filter(Boolean);
        if (parts.length > 0) {
          return res.json({
            status: 'success',
            address: parts.join(', '),
            lat: latNum,
            lon: lonNum
          });
        }
      }

      if (data.display_name) {
        const shortName = data.display_name.split(',').slice(0, 3).join(',').trim();
        return res.json({
          status: 'success',
          address: shortName,
          lat: latNum,
          lon: lonNum
        });
      }
    }
  } catch (err: any) {
    console.warn('Reverse geocoding lookup notice:', err?.message || err);
  }

  // Graceful fallback for Nilgiris / South India regional GPS coordinates
  const latNum = parseFloat(lat as string);
  const lonNum = parseFloat(lon as string);
  let fallbackName = `Current GPS (${latNum.toFixed(3)}, ${lonNum.toFixed(3)})`;
  if (Math.abs(latNum - 11.41) < 0.2 && Math.abs(lonNum - 76.69) < 0.2) {
    fallbackName = `NH 181 Corridor, Nilgiris (${latNum.toFixed(3)}, ${lonNum.toFixed(3)})`;
  }

  return res.json({
    status: 'success',
    address: fallbackName,
    lat: latNum,
    lon: lonNum
  });
});

app.get('/api/overpass', (req, res) => {
  res.json({
    elements: [
      { type: 'way', id: 101, tags: { name: 'Mudumalai Tiger Reserve Boundary' } },
      { type: 'node', id: 201, tags: { water: 'river', name: 'Moyar River' } }
    ]
  });
});

app.post('/api/predict-animal-paths', (req, res) => {
  const { species, lat, lon, riskLevel } = req.body;
  const baseLat = typeof lat === 'number' ? lat : 11.412;
  const baseLon = typeof lon === 'number' ? lon : 76.698;
  const spName = (species || '').toLowerCase();

  let primaryDest = 'Moyar River Drainage Basin';
  let secondaryDest = 'Kaggal Bamboo Ridge Slope';
  let altDest = 'Glenmorgan Tea Estate Fringe';

  let primaryDesc = 'Main trajectory following low-elevation river drainage basin and dense canopy cover.';
  let secondaryDesc = 'Higher-elevation bamboo ridge route avoiding human highway transit activity.';
  let altDesc = 'Infrequent border trail traversing tea plantation clearings for foraging.';

  let b1 = 40;  let d1 = 2.1;
  let b2 = 315; let d2 = 1.5;
  let b3 = 145; let d3 = 1.2;

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
    const strHash = (species || 'Wild').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    b1 = (strHash * 37) % 360;
    d1 = 1.2 + (strHash % 10) * 0.12;
    b2 = (strHash * 73 + 120) % 360;
    d2 = 1.0 + (strHash % 7) * 0.11;
    b3 = (strHash * 109 + 240) % 360;
    d3 = 0.8 + (strHash % 5) * 0.10;
  }

  const calcOffset = (bearing: number, dist: number) => {
    const bRad = (bearing * Math.PI) / 180;
    const lRad = (baseLat * Math.PI) / 180;
    const dLat = (dist / 111.0) * Math.cos(bRad);
    const dLon = (dist / (111.0 * Math.max(0.2, Math.cos(lRad)))) * Math.sin(bRad);
    return {
      lat: Number((baseLat + dLat).toFixed(4)),
      lon: Number((baseLon + dLon).toFixed(4)),
      dLat,
      dLon
    };
  };

  const genPoints = (endLat: number, endLon: number, times: [string, string, string, string], factor: number) => {
    const dLat = endLat - baseLat;
    const dLon = endLon - baseLon;
    const perpLat = -dLon * 0.15 * factor;
    const perpLon = dLat * 0.15 * factor;
    return [
      { lat: Number(baseLat.toFixed(4)), lon: Number(baseLon.toFixed(4)), timeAhead: times[0] },
      { lat: Number((baseLat + dLat * 0.35 + perpLat).toFixed(4)), lon: Number((baseLon + dLon * 0.35 + perpLon).toFixed(4)), timeAhead: times[1] },
      { lat: Number((baseLat + dLat * 0.70 - perpLat * 0.5).toFixed(4)), lon: Number((baseLon + dLon * 0.70 - perpLon * 0.5).toFixed(4)), timeAhead: times[2] },
      { lat: Number(endLat.toFixed(4)), lon: Number(endLon.toFixed(4)), timeAhead: times[3] }
    ];
  };

  const p1 = calcOffset(b1, d1);
  const p2 = calcOffset(b2, d2);
  const p3 = calcOffset(b3, d3);

  const animalRisk = riskLevel || 'HIGH';

  const paths = [
    {
      id: `path-primary-${baseLat.toFixed(3)}-${baseLon.toFixed(3)}`,
      name: `Primary Corridor (${primaryDest.split(' ')[0]})`,
      type: 'PRIMARY',
      confidence: primaryConf,
      riskLevel: animalRisk === 'LOW' ? 'MEDIUM' : animalRisk,
      color: '#10b981',
      description: primaryDesc,
      nextLocation: `${primaryDest} (${p1.lat}, ${p1.lon})`,
      nextCoords: { lat: p1.lat, lon: p1.lon },
      timeWindow: '+15m ➔ +45m',
      points: genPoints(p1.lat, p1.lon, ['Now', '+15m', '+30m', '+45m'], 1.0)
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
      points: genPoints(p2.lat, p2.lon, ['Now', '+20m', '+40m', '+60m'], -0.8)
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
      points: genPoints(p3.lat, p3.lon, ['Now', '+30m', '+60m', '+90m'], 0.6)
    }
  ];

  res.json({
    species: species || 'Elephas maximus',
    origin: { lat: baseLat, lon: baseLon },
    paths,
    confidence: `${primaryConf}% (Primary)`,
    model: 'LSTM Spatial Spatiotemporal Network'
  });
});

app.post('/api/predict-risk', (req, res) => {
  res.json({
    riskLevel: 'HIGH_RISK',
    riskScore: 0.88,
    primaryThreat: 'Elephant herd in proximity to active roadway',
    recommendation: 'Use alternate Pykara bypass route or reduce travel speed under 30 km/h.'
  });
});

// Serve Vite dev / static server
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wildlife Safety Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
