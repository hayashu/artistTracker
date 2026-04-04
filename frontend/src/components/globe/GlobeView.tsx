"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MapPin, GlobeRef } from "@/types";
import styles from "./GlobeView.module.css";

const DynamicGlobe = dynamic(
  () => import("./GlobeWrapper").then((m) => m.GlobeWrapper),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <span>Loading Globe...</span>
      </div>
    ),
  }
);

interface GlobeViewProps {
  pins: MapPin[];
  selectedPinId: string | null;
  onPinClick: (pin: MapPin) => void;
  width: number;
  height: number;
}

export function GlobeView({
  pins,
  selectedPinId,
  onPinClick,
  width,
  height,
}: GlobeViewProps) {
  const globeRef = useRef<GlobeRef>(null);
  const [isTouring, setIsTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const tourRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!selectedPinId || !globeRef.current) return;
    const pin = pins.find((p) => p.id === selectedPinId);
    if (pin) {
      globeRef.current.pointOfView(
        { lat: pin.lat, lng: pin.lng, altitude: 1.5 },
        1000
      );
    }
  }, [selectedPinId, pins]);

  const stopTour = useCallback(() => {
    if (tourRef.current) clearInterval(tourRef.current);
    tourRef.current = null;
    setIsTouring(false);
  }, []);

  const startTour = useCallback(() => {
    if (pins.length === 0) return;
    setIsTouring(true);
    setTourIndex(0);
    globeRef.current?.pointOfView(
      { lat: pins[0].lat, lng: pins[0].lng, altitude: 1.5 },
      1000
    );
    let idx = 1;
    tourRef.current = setInterval(() => {
      const next = idx % pins.length;
      globeRef.current?.pointOfView(
        { lat: pins[next].lat, lng: pins[next].lng, altitude: 1.5 },
        1200
      );
      setTourIndex(next);
      idx++;
    }, 3000);
  }, [pins]);

  const toggleTour = useCallback(() => {
    isTouring ? stopTour() : startTour();
  }, [isTouring, startTour, stopTour]);

  useEffect(() => {
    return () => { if (tourRef.current) clearInterval(tourRef.current); };
  }, []);

  useEffect(() => {
    if (isTouring) stopTour();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return (
    <div className={styles.container}>
      <DynamicGlobe
        ref={globeRef}
        pins={pins}
        selectedPinId={isTouring ? (pins[tourIndex]?.id ?? null) : selectedPinId}
        onPinClick={(pin) => { stopTour(); onPinClick(pin); }}
        width={width}
        height={height}
      />
      {pins.length > 0 && (
        <button
          className={`${styles.tourBtn} ${isTouring ? styles.tourBtnActive : ""}`}
          onClick={toggleTour}
          title={isTouring ? "ツアーを停止" : "全イベントを巡回"}
        >
          {isTouring ? (
            <>
              <span className={styles.tourIcon}>⏹</span>
              {tourIndex + 1} / {pins.length}
            </>
          ) : (
            <>
              <span className={styles.tourIcon}>▶</span>
              Tour
            </>
          )}
        </button>
      )}
    </div>
  );
}
