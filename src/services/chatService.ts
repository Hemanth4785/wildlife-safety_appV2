import { ChatMessage, WildlifeMarkerData } from '../types';

export interface ChatRouteContext {
  start?: string;
  end?: string;
  riskLevel?: string;
  travelMode?: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  routeContext?: ChatRouteContext,
  activeSightings?: WildlifeMarkerData[]
): Promise<string> {
  const formattedSightings = activeSightings?.map((m) => ({
    species: m.common,
    location: m.locationName,
    riskLevel: m.riskLevel,
    time: m.lastSeen,
    isUserSubmitted: m.isUserSubmitted
  }));

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      routeContext,
      activeSightings: formattedSightings
    })
  });

  if (!res.ok) {
    throw new Error(`Chat API error (${res.status})`);
  }

  const data = await res.json();
  return data.reply;
}
