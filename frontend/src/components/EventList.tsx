"use client";

import type { Event } from "@/types";
import styles from "./EventList.module.css";

interface EventListProps {
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  total: number;
  mappable: number;
  timezone?: string;
}

function formatDate(event: Event, timezone?: string): string {
  if (event.dateTBD || !event.date) return "TBD";
  try {
    if (event.dateTime && timezone) {
      return new Date(event.dateTime).toLocaleDateString("en-US", {
        timeZone: timezone,
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return event.date;
  }
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "onsale":
      return { label: "On Sale", className: styles.onsale };
    case "offsale":
      return { label: "Off Sale", className: styles.offsale };
    case "cancelled":
    case "canceled":
      return { label: "Cancelled", className: styles.cancelled };
    case "postponed":
      return { label: "Postponed", className: styles.postponed };
    default:
      return { label: status, className: styles.onsale };
  }
}

export function EventList({
  events,
  selectedEventId,
  onSelectEvent,
  total,
  mappable,
  timezone,
}: EventListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Events</span>
        <span className={styles.count}>
          {total} total, {mappable} on map
        </span>
      </div>
      <div className={styles.list}>
        {events.map((event) => {
          const badge = statusBadge(event.status);
          const isSelected = event.id === selectedEventId;
          return (
            <button
              key={event.id}
              className={`${styles.item} ${isSelected ? styles.selected : ""}`}
              onClick={() => onSelectEvent(event.id)}
            >
              <div className={styles.dateCol}>
                <span className={styles.date}>
                  {formatDate(event, timezone)}
                </span>
                <span className={`${styles.badge} ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <div className={styles.infoCol}>
                <span className={styles.eventName}>{event.name}</span>
                <span className={styles.venue}>
                  {event.venue.name}
                  {event.venue.city ? `, ${event.venue.city}` : ""}
                </span>
              </div>
              {!event.venue.location && (
                <span className={styles.noLocation} title="No coordinates available">
                  &#x1f6ab;
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
