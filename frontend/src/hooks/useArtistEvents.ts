"use client";

import { useState, useCallback, useMemo } from "react";
import type { Event, MapPin, SearchState } from "@/types";
import { getArtistEvents } from "@/lib/api";

function statusColor(status: string): string {
  switch (status) {
    case "onsale":
      return "#1db954";
    case "offsale":
      return "#f39c12";
    case "cancelled":
    case "canceled":
      return "#e74c3c";
    case "postponed":
      return "#9b59b6";
    default:
      return "#1db954";
  }
}

export function useArtistEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [mappable, setMappable] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const setSelectedEventIdWithPersist = useCallback((id: string | null) => {
    setSelectedEventId(id);
    if (id) localStorage.setItem("lastEventId", id);
    else localStorage.removeItem("lastEventId");
  }, []);

  const fetchEvents = useCallback(async (attractionId: string) => {
    setState("loading");
    setError(null);
    setSelectedEventId(null);
    try {
      const data = await getArtistEvents(attractionId);
      setEvents(data.events);
      setTotal(data.total);
      setMappable(data.mappable);
      setState("success");
      localStorage.setItem("lastArtistId", attractionId);
      const savedEventId = localStorage.getItem("lastEventId");
      if (savedEventId && data.events.some((e) => e.id === savedEventId)) {
        setSelectedEventId(savedEventId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch events");
      setState("error");
    }
  }, []);

  const pins: MapPin[] = useMemo(() => {
    return events
      .filter((e) => e.venue.location !== null)
      .map((e) => ({
        id: `pin-${e.id}`,
        lat: e.venue.location!.lat,
        lng: e.venue.location!.lng,
        label: e.name,
        venueName: e.venue.name,
        date: e.date,
        status: e.status,
        color: statusColor(e.status),
        eventId: e.id,
      }));
  }, [events]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) ?? null;
  }, [events, selectedEventId]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setState("idle");
    setError(null);
    setTotal(0);
    setMappable(0);
    setSelectedEventId(null);
    localStorage.removeItem("lastArtistId");
    localStorage.removeItem("lastEventId");
  }, []);

  return {
    events,
    pins,
    state,
    error,
    total,
    mappable,
    selectedEventId,
    selectedEvent,
    setSelectedEventId: setSelectedEventIdWithPersist,
    fetchEvents,
    clearEvents,
  };
}
