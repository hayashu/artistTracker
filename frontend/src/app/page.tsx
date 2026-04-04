"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ArtistCard } from "@/components/ArtistCard";
import { EventList } from "@/components/EventList";
import { EventDetail } from "@/components/EventDetail";
import { ExpeditionPlanner } from "@/components/ExpeditionPlanner";
import { ViewToggle } from "@/components/ViewToggle";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { GlobeView } from "@/components/globe/GlobeView";
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false }
);
import { useArtistSearch } from "@/hooks/useArtistSearch";
import { useArtistEvents } from "@/hooks/useArtistEvents";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import type { ViewMode, MapPin, Artist, NearbyEvent } from "@/types";
import styles from "./page.module.css";

export default function Home() {
  const [timezone, setTimezone] = useUserTimezone();
  const [viewMode, setViewMode] = useState<ViewMode>("globe");
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showExpedition, setShowExpedition] = useState(false);
  const [artistPanelHeight, setArtistPanelHeight] = useState(300);

  // localStorage から復元
  useEffect(() => {
    const savedView = localStorage.getItem("viewMode") as ViewMode | null;
    if (savedView) setViewMode(savedView);
    const savedHeight = localStorage.getItem("artistPanelHeight");
    if (savedHeight) setArtistPanelHeight(parseInt(savedHeight, 10));
  }, []);

  const mainRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const handleViewChange = useCallback((mode: ViewMode) => {
    localStorage.setItem("viewMode", mode);
    setViewMode(mode);
  }, []);

  const handleTimezoneChange = useCallback((tz: string) => {
    localStorage.setItem("timezone", tz);
    setTimezone(tz);
  }, [setTimezone]);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startHeight: artistPanelHeight };
    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const newHeight = Math.max(60, Math.min(500, dragRef.current.startHeight + ev.clientY - dragRef.current.startY));
      localStorage.setItem("artistPanelHeight", String(newHeight));
      setArtistPanelHeight(newHeight);
    };
    const onMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [artistPanelHeight]);

  const {
    artists,
    state: searchState,
    error: searchError,
    correctedKeyword,
    search,
    clear: clearSearch,
  } = useArtistSearch();

  const {
    events,
    pins,
    state: eventsState,
    error: eventsError,
    total,
    mappable,
    selectedEventId,
    selectedEvent,
    setSelectedEventId,
    fetchEvents,
    clearEvents,
  } = useArtistEvents();

  // ResizeObserver for globe dimensions
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // アーティスト読み込み完了後に前回選択したアーティストのイベントを自動取得
  useEffect(() => {
    if (searchState !== "success" || artists.length === 0) return;
    const savedArtistId = localStorage.getItem("lastArtistId");
    if (!savedArtistId) return;
    const artist = artists.find((a) => a.id === savedArtistId);
    if (artist) {
      setSelectedArtistId(savedArtistId);
      fetchEvents(savedArtistId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchState]);

  const handleArtistClick = useCallback(
    (artist: Artist) => {
      if (selectedArtistId === artist.id) return;
      setSelectedArtistId(artist.id);
      clearEvents();
      setShowExpedition(false);
      fetchEvents(artist.id);
    },
    [selectedArtistId, fetchEvents, clearEvents]
  );

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setSelectedArtistId(null);
    clearEvents();
    setShowExpedition(false);
  }, [clearSearch, clearEvents]);

  const handlePinClick = useCallback(
    (pin: MapPin) => {
      setSelectedEventId(pin.eventId);
    },
    [setSelectedEventId]
  );

  const handleEventSelect = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (event?.venue.location) {
        const pinId = `pin-${eventId}`;
        setSelectedEventId(eventId);
        // selectedPinId change triggers fly-to via GlobeView/MapView
        void pinId;
      } else {
        setSelectedEventId(eventId);
      }
    },
    [events, setSelectedEventId]
  );

  const nearbyEvents = useMemo<NearbyEvent[]>(() => {
    if (!selectedEvent?.date) return [];
    const selectedDate = new Date(selectedEvent.date + "T00:00:00");
    return events
      .filter((e) => {
        if (e.id === selectedEvent.id || !e.date) return false;
        const d = new Date(e.date + "T00:00:00");
        const diff = Math.abs(
          (d.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diff <= 3;
      })
      .map((e) => {
        const d = new Date(e.date! + "T00:00:00");
        const daysDiff = Math.round(
          (d.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return { event: e, daysDiff };
      })
      .sort((a, b) => a.daysDiff - b.daysDiff);
  }, [selectedEvent, events]);

  const selectedPinId = selectedEventId ? `pin-${selectedEventId}` : null;

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoAccent}>Artist</span> Tracker
          </div>
        </div>

        <SearchBar
          onSearch={search}
          onClear={handleClearSearch}
          isLoading={searchState === "loading"}
        />

        {searchError && <div className={styles.errorMsg}>{searchError}</div>}
        {correctedKeyword && (
          <div className={styles.correctionMsg}>
            &ldquo;{correctedKeyword}&rdquo; の結果を表示しています
          </div>
        )}

        {artists.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Artists</div>
            <div className={styles.artistList} style={{ height: artistPanelHeight }}>
              {artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  isSelected={selectedArtistId === artist.id}
                  onClick={() => handleArtistClick(artist)}
                />
              ))}
            </div>
            <div className={styles.resizeDivider} onMouseDown={handleDividerMouseDown} />
          </>
        )}

        {eventsError && <div className={styles.errorMsg}>{eventsError}</div>}

        {eventsState === "loading" && (
          <div className={styles.eventsLoading}>
            <span className={styles.spinner} />
            Loading events...
          </div>
        )}

        {eventsState === "success" && events.length > 0 && (
          <EventList
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={handleEventSelect}
            total={total}
            mappable={mappable}
            timezone={timezone}
          />
        )}

        {eventsState === "success" && events.length === 0 && (
          <div className={styles.eventsLoading}>No upcoming events found</div>
        )}
      </aside>

      {/* Main content */}
      <main className={styles.main} ref={mainRef}>
        {containerSize.width > 0 && containerSize.height > 0 && (
          viewMode === "globe" ? (
            <GlobeView
              pins={pins}
              selectedPinId={selectedPinId}
              onPinClick={handlePinClick}
              width={containerSize.width}
              height={containerSize.height}
            />
          ) : (
            <MapView
              pins={pins}
              selectedPinId={selectedPinId}
              onPinClick={handlePinClick}
            />
          )
        )}

        {pins.length === 0 && eventsState !== "loading" && (
          <div className={styles.emptyOverlay}>
            <span className={styles.emptyText}>
              Search for an artist to see their events on the map
            </span>
            <span className={styles.emptyHint}>
              Try &quot;Coldplay&quot;, &quot;Taylor Swift&quot;, or &quot;Bad Bunny&quot;
            </span>
          </div>
        )}

        <ViewToggle mode={viewMode} onChange={handleViewChange} />
        <TimezoneSelector timezone={timezone} onChange={handleTimezoneChange} />

        {selectedEvent && !showExpedition && (
          <EventDetail
            event={selectedEvent}
            onClose={() => setSelectedEventId(null)}
            onExpedition={() => setShowExpedition(true)}
            timezone={timezone}
          />
        )}

        {selectedEvent && showExpedition && (
          <ExpeditionPlanner
            event={selectedEvent}
            nearbyEvents={nearbyEvents}
            onClose={() => setShowExpedition(false)}
            onSelectEvent={(eventId) => {
              setSelectedEventId(eventId);
              setShowExpedition(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
