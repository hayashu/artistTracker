import type { Artist, Event } from "@/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function searchArtists(
  keyword: string
): Promise<{ artists: Artist[]; correctedKeyword?: string }> {
  return fetchApi(`/api/artists?keyword=${encodeURIComponent(keyword)}`);
}

export async function getUserTimezone(): Promise<{ timezone: string }> {
  return fetchApi("/api/timezone");
}

export async function getArtistSuggestions(
  keyword: string
): Promise<{ suggestions: string[] }> {
  return fetchApi(`/api/artists/suggestions?keyword=${encodeURIComponent(keyword)}`);
}

export async function getArtistEvents(
  attractionId: string
): Promise<{ events: Event[]; total: number; mappable: number }> {
  return fetchApi(
    `/api/events?attractionId=${encodeURIComponent(attractionId)}`
  );
}
