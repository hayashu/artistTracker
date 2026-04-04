export interface Artist {
  id: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
  genre: string | null;
  subGenre: string | null;
}

export interface EventLocation {
  lat: number;
  lng: number;
}

export interface EventVenue {
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  location: EventLocation | null;
}

export interface Event {
  id: string;
  artistId: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
  date: string | null;
  time: string | null;
  dateTime: string | null;
  dateTBD: boolean;
  timeTBA: boolean;
  status: string;
  venue: EventVenue;
  priceRange: { currency: string; min: number; max: number } | null;
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  venueName: string;
  date: string | null;
  status: string;
  color: string;
  eventId: string;
}

export interface NearbyEvent {
  event: Event;
  daysDiff: number;
}

export type ViewMode = "globe" | "map";

export type SearchState = "idle" | "loading" | "success" | "error";

export interface GlobeRef {
  pointOfView: (
    coords: { lat: number; lng: number; altitude?: number },
    transitionMs?: number
  ) => void;
}
