"use client";

import { useState, useEffect } from "react";
import { getUserTimezone } from "@/lib/api";

export function useUserTimezone(): [string, (tz: string) => void] {
  const [timezone, setTimezone] = useState<string>("UTC");

  useEffect(() => {
    const saved = localStorage.getItem("timezone");
    if (saved) {
      setTimezone(saved);
      return;
    }
    getUserTimezone()
      .then(({ timezone }) => setTimezone(timezone))
      .catch(() => {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      });
  }, []);

  return [timezone, setTimezone];
}
