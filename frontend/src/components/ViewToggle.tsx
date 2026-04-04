"use client";

import type { ViewMode } from "@/types";
import styles from "./ViewToggle.module.css";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.btn} ${mode === "globe" ? styles.active : ""}`}
        onClick={() => onChange("globe")}
      >
        3D Globe
      </button>
      <button
        className={`${styles.btn} ${mode === "map" ? styles.active : ""}`}
        onClick={() => onChange("map")}
      >
        2D Map
      </button>
    </div>
  );
}
