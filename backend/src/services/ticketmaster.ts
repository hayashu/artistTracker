import axios, { AxiosError } from "axios";
import { config } from "../config";
import { redis } from "../utils/redis-client";

import type {
  TMAttraction,
  TMEvent,
  TMImage,
  TMSearchResponse,
  TMVenue,
  ArtistSearchResult,
  NormalizedEvent,
  NormalizedVenue,
  EventLocation,
} from "../types/ticketmaster";

const ARTIST_TTL = 60 * 60 * 24 * 7;      // 1 hour
const EVENT_TTL  = 60 * 60 * 3;      // 30 minutes

async function getCache<T>(key: string): Promise<T | null> {
  try {
    const result = await redis.get(key);
    if (result !== null){
      return JSON.parse(result);
    }else return null;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await redis.set(key, jsonValue, "EX", ttlSeconds);
  } catch (err) {
    console.warn("[Redis] setCache failed:", err);
  }
}

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

const api = axios.create({
  baseURL: BASE_URL,
  params: { apikey: config.ticketmasterApiKey },
});

function pickImage(images?: TMImage[]): string | null {
  if (!images || images.length === 0) return null;
  const ratio16x9 = images.find(
    (img) => img.ratio === "16_9" && img.width >= 640
  );
  if (ratio16x9) return ratio16x9.url;
  const largest = images.reduce((a, b) => (a.width > b.width ? a : b));
  return largest.url;
}

function parseLocation(venue: TMVenue): EventLocation | null {
  if (!venue.location?.latitude || !venue.location?.longitude) return null;
  const lat = parseFloat(venue.location.latitude);
  const lng = parseFloat(venue.location.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function normalizeVenue(venue?: TMVenue): NormalizedVenue {
  if (!venue) {
    return {
      id: null,
      name: "Unknown Venue",
      city: null,
      state: null,
      country: null,
      address: null,
      location: null,
    };
  }
  return {
    id : venue.id,
    name: venue.name ?? "Unknown Venue",
    city: venue.city?.name ?? null,
    state: venue.state?.name ?? null,
    country: venue.country?.countryCode ?? null,
    address: venue.address?.line1 ?? null,
    location: parseLocation(venue),
  };
}

function handleApiError(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status === 401) {
      throw new ApiError(401, "Invalid Ticketmaster API key");
    }
    if (status === 429) {
      throw new ApiError(429, "Rate limit exceeded. Please try again later.");
    }
    if (status === 404) {
      throw new ApiError(404, "Resource not found");
    }
    throw new ApiError(
      status || 500,
      `Ticketmaster API error: ${error.message}`
    );
  }
  throw new ApiError(500, "Unexpected error");
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function searchArtists(
  keyword: string
): Promise<ArtistSearchResult[]> {
  const label = `[Artist Search] "${keyword}"`;
  console.time(label);
  const cache = await getCache<ArtistSearchResult[]>(`artist:${keyword}`);
  if (cache){
    console.timeEnd(label);
    console.log(`  ↑ CACHE HIT`);
    return cache;
  }else{

    try {
      const response = await api.get<TMSearchResponse<TMAttraction>>(
        "/attractions.json",
        {
          params: {
            keyword,
            classificationName: "music",
            size: 10,
            sort: "relevance,desc",
          },
        }
      );
      
      const attractions = response.data._embedded?.attractions ?? [];
      const returnValue = attractions.map((a) => {
        const classification = a.classifications?.find((c) => c.primary);
        return {
          id: a.id,
          name: a.name,
          url: a.url ?? null,
          imageUrl: pickImage(a.images),
          genre: classification?.genre?.name ?? null,
          subGenre: classification?.subGenre?.name ?? null
        };
      });
      await setCache(`artist:${keyword}`, returnValue, ARTIST_TTL);
      console.timeEnd(label);
      console.log(`  ↑ CACHE MISS (API called)`);
      return returnValue;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      handleApiError(error);
    }
  }
}

export async function getEventsByArtist(
  attractionId: string
): Promise<NormalizedEvent[]> {
  const label = `[Event Fetch] "${attractionId}"`;
  console.time(label);
  const cache = await getCache<NormalizedEvent[]>(`event:${attractionId}`);
  if (cache){
    console.timeEnd(label);
    console.log(`  ↑ CACHE HIT`);
    return cache
  }else{
    try {
      const response = await api.get<TMSearchResponse<TMEvent>>(
        "/events.json",
        {
          params: {
            attractionId,
            size: 100,
            sort: "date,asc",
          },
        }
      );

      const events = response.data._embedded?.events ?? [];
      const returnValue = events.map((e) => {
        const venue = e._embedded?.venues?.[0];
        const dates = e.dates;
        const priceRange =
          e.priceRanges && e.priceRanges.length > 0
            ? {
                currency: e.priceRanges[0].currency,
                min: e.priceRanges[0].min,
                max: e.priceRanges[0].max,
              }
            : null;
        return {
          id: e.id,
          artistId: attractionId,
          name: e.name,
          url: e.url ?? null,
          imageUrl: pickImage(e.images),
          date: dates?.start?.localDate ?? null,
          time: dates?.start?.localTime ?? null,
          dateTime: dates?.start?.dateTime ?? null,
          dateTBD: dates?.start?.dateTBD ?? false,
          timeTBA: dates?.start?.timeTBA ?? false,
          status: dates?.status?.code ?? "unknown",
          venue: normalizeVenue(venue),
          priceRange,
        };
      });
      await setCache(`event:${attractionId}`, returnValue, EVENT_TTL);
      console.timeEnd(label);
      console.log(`  ↑ CACHE MISS (API called)`);
      return returnValue;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      handleApiError(error);
    }
  }
}
