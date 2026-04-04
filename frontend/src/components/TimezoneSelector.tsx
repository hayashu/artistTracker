"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./TimezoneSelector.module.css";

const TIMEZONES = [
  { label: "Tokyo (JST)",          value: "Asia/Tokyo" },
  { label: "Seoul (KST)",          value: "Asia/Seoul" },
  { label: "Shanghai (CST)",       value: "Asia/Shanghai" },
  { label: "Bangkok (ICT)",        value: "Asia/Bangkok" },
  { label: "Dubai (GST)",          value: "Asia/Dubai" },
  { label: "London (GMT/BST)",     value: "Europe/London" },
  { label: "Paris (CET/CEST)",     value: "Europe/Paris" },
  { label: "New York (EST/EDT)",   value: "America/New_York" },
  { label: "Chicago (CST/CDT)",    value: "America/Chicago" },
  { label: "Los Angeles (PST/PDT)",value: "America/Los_Angeles" },
  { label: "São Paulo (BRT)",      value: "America/Sao_Paulo" },
  { label: "Sydney (AEST/AEDT)",   value: "Australia/Sydney" },
  { label: "UTC",                  value: "UTC" },
];

interface TimezoneSelectorProps {
  timezone: string;
  onChange: (tz: string) => void;
}

function shortLabel(tz: string): string {
  const found = TIMEZONES.find((t) => t.value === tz);
  if (found) {
    const parts = found.label.split(" ");
    return (parts[1] ?? parts[0]).replace(/[()]/g, "");
  }
  return tz.split("/").pop() ?? tz;
}

export function TimezoneSelector({ timezone, onChange }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={styles.container} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {shortLabel(timezone)}
        <span className={styles.caret}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className={styles.dropdown}>
          {TIMEZONES.map((tz) => (
            <li
              key={tz.value}
              className={`${styles.item} ${tz.value === timezone ? styles.active : ""}`}
              onMouseDown={() => { onChange(tz.value); setOpen(false); }}
            >
              {tz.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
