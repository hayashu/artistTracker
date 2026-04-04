// Raw Ticketmaster API response types

export interface TMImage {
  ratio?: string;
  url: string;
  width: number;
  height: number;
  fallback?: boolean;
}

export interface TMClassification {
  primary?: boolean;
  segment?: { id: string; name: string };
  genre?: { id: string; name: string };
  subGenre?: { id: string; name: string };
}

export interface TMAttraction {
  id: string;
  name: string;
  type: string;
  url?: string;
  images?: TMImage[];
  classifications?: TMClassification[];
  upcomingEvents?: { _total: number; [key: string]: number };
}

export interface TMVenueLocation {
  longitude: string;
  latitude: string;
}

export interface TMVenue {
  id: string;
  name: string;
  city?: { name: string };
  state?: { name: string; stateCode: string };
  country?: { name: string; countryCode: string };
  address?: { line1: string };
  location?: TMVenueLocation;
}

export interface TMDateInfo {
  localDate?: string;
  localTime?: string;
  dateTime?: string;
  dateTBD?: boolean;
  dateTBA?: boolean;
  timeTBA?: boolean;
}

export interface TMPriceRange {
  type: string;
  currency: string;
  min: number;
  max: number;
}

export interface TMSales {
  public?: {
    startDateTime?: string;
    endDateTime?: string;
    startTBD?: boolean;
  };
}

export interface TMEvent {
  id: string;
  name: string;
  type: string;
  url?: string;
  images?: TMImage[];
  dates?: {
    start?: TMDateInfo;
    end?: TMDateInfo;
    status?: { code: string };
  };
  priceRanges?: TMPriceRange[];
  sales?: TMSales;
  _embedded?: {
    venues?: TMVenue[];
    attractions?: TMAttraction[];
  };
}

export interface TMSearchResponse<T> {
  _embedded?: { [key: string]: T[] };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Normalized types returned by our API

export interface ArtistSearchResult {
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

export interface NormalizedVenue {
  id: string | null;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  location: EventLocation | null;
}

export interface NormalizedEvent {
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
  venue: NormalizedVenue;
  priceRange: { currency: string; min: number; max: number } | null;
}
