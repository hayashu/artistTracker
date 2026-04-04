"use client";

import type { Event } from "@/types";
import styles from "./EventDetail.module.css";

interface EventDetailProps {
  event: Event;
  onClose: () => void;
  onExpedition?: () => void;
  timezone?: string;
}

function formatVenueTime(event: Event): string {
  if (event.dateTBD) return "Date TBD";
  if (!event.date) return "Date unknown";
  try {
    const dateStr = new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    if (event.timeTBA || !event.time) return dateStr;
    const [h, m] = event.time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${dateStr} at ${h12}:${m} ${ampm}`;
  } catch {
    return event.date ?? "";
  }
}

function formatUserTime(event: Event, timezone: string): string | null {
  if (!event.dateTime || event.timeTBA) return null;
  try {
    const dt = new Date(event.dateTime);
    const dateStr = dt.toLocaleDateString("en-US", {
      timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    const timeStr = dt.toLocaleTimeString("en-US", {
      timeZone: timezone, hour: "2-digit", minute: "2-digit",
    });
    return `${dateStr} at ${timeStr}`;
  } catch {
    return null;
  }
}

function formatPrice(event: Event): string | null {
  if (!event.priceRange) return null;
  const { currency, min, max } = event.priceRange;
  if (min === max) return `${currency} ${min.toFixed(2)}`;
  return `${currency} ${min.toFixed(2)} - ${max.toFixed(2)}`;
}

export function EventDetail({ event, onClose, onExpedition, timezone }: EventDetailProps) {
  const price = formatPrice(event);
  const location = [event.venue.city, event.venue.state, event.venue.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={styles.panel}>
      {event.imageUrl && (
        <div className={styles.heroImage}>
          <img src={event.imageUrl} alt={event.name} className={styles.heroImg} />
        </div>
      )}
      <div className={styles.header}>
        <h3 className={styles.title}>{event.name}</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <svg className={styles.rowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div className={styles.timeInfo}>
            <span className={styles.timeVenue}>
              <span className={styles.timeLabel}>現地</span>
              {formatVenueTime(event)}
            </span>
            {timezone && (() => {
              const userTime = formatUserTime(event, timezone);
              return userTime ? (
                <span className={styles.timeUser}>
                  <span className={styles.timeLabel}>あなた</span>
                  {userTime}
                </span>
              ) : null;
            })()}
          </div>
        </div>

        <div className={styles.row}>
          <svg className={styles.rowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div className={styles.venueInfo}>
            <span className={styles.venueName}>{event.venue.name}</span>
            {location && <span className={styles.venueLocation}>{location}</span>}
          </div>
        </div>

        {price && (
          <div className={styles.row}>
            <svg className={styles.rowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>{price}</span>
          </div>
        )}

        {event.url && (
          <a
            className={styles.ticketLink}
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Tickets
          </a>
        )}

        {onExpedition && event.venue.location && (
          <button className={styles.expeditionBtn} onClick={onExpedition}>
            遠征プランを見る
          </button>
        )}
      </div>
    </div>
  );
}
