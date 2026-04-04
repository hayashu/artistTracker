"use client";

import type { Event, NearbyEvent } from "@/types";
import styles from "./ExpeditionPlanner.module.css";

interface ExpeditionPlannerProps {
  event: Event;
  nearbyEvents: NearbyEvent[];
  onClose: () => void;
  onSelectEvent: (eventId: string) => void;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  } catch {
    return dateStr;
  }
}

function buildGoogleMapsRouteUrl(event: Event): string {
  const loc = event.venue.location;
  if (!loc) return "#";
  return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
}

function buildGoogleMapsHotelUrl(event: Event): string {
  const query = encodeURIComponent(`${event.venue.name} 周辺 ホテル`);
  return `https://www.google.com/maps/search/${query}`;
}

function buildRakutenTravelUrl(event: Event): string {
  const city = event.venue.city || event.venue.name;
  const keyword = encodeURIComponent(city);
  let url = `https://travel.rakuten.co.jp/yado/search/?f_keyword=${keyword}`;
  if (event.date) {
    const d = new Date(event.date + "T00:00:00");
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    url += `&f_checkin=${fmt(d)}&f_checkout=${fmt(next)}`;
  }
  return url;
}

function buildBookingUrl(event: Event): string {
  const loc = event.venue.location;
  if (!loc) {
    const city = encodeURIComponent(event.venue.city || event.venue.name);
    return `https://www.booking.com/searchresults.html?ss=${city}`;
  }
  let url = `https://www.booking.com/searchresults.html?latitude=${loc.lat}&longitude=${loc.lng}`;
  if (event.date) {
    const d = new Date(event.date + "T00:00:00");
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    url += `&checkin=${fmt(d)}&checkout=${fmt(next)}`;
  }
  return url;
}

export function ExpeditionPlanner({
  event,
  nearbyEvents,
  onClose,
  onSelectEvent,
}: ExpeditionPlannerProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>遠征プラン: {event.venue.name}</h3>
        <button className={styles.backBtn} onClick={onClose}>
          ← 戻る
        </button>
      </div>

      <div className={styles.body}>
        {/* Section 1: Transportation */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>交通手段</h4>
          <div className={styles.linkList}>
            <a
              className={styles.linkItem}
              href={buildGoogleMapsRouteUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className={styles.linkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Google Maps で経路を検索
            </a>
          </div>
        </div>

        {/* Section 2: Accommodation */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>宿泊施設</h4>
          <div className={styles.linkList}>
            <a
              className={styles.linkItem}
              href={buildRakutenTravelUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className={styles.linkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              楽天トラベルで探す
            </a>
            <a
              className={styles.linkItem}
              href={buildBookingUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className={styles.linkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Booking.com で探す
            </a>
            <a
              className={styles.linkItem}
              href={buildGoogleMapsHotelUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className={styles.linkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Google Maps で周辺ホテル
            </a>
          </div>
        </div>

        {/* Section 3: Nearby Events */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>ついでにもう1公演</h4>
          {nearbyEvents.length > 0 ? (
            <div className={styles.linkList}>
              {nearbyEvents.map((ne) => (
                <div
                  key={ne.event.id}
                  className={styles.nearbyItem}
                  onClick={() => onSelectEvent(ne.event.id)}
                >
                  <span className={styles.nearbyName}>{ne.event.name}</span>
                  <span className={styles.nearbyMeta}>
                    {ne.event.date ? formatDate(ne.event.date) : "日程未定"} ・{" "}
                    {ne.event.venue.name}
                    {ne.daysDiff !== 0 && ` ・ ${ne.daysDiff > 0 ? "+" : ""}${ne.daysDiff}日`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className={styles.emptyText}>前後3日以内の公演はありません</span>
          )}
        </div>
      </div>
    </div>
  );
}
