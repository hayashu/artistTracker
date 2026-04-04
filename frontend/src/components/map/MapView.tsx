"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import type { MapPin } from "@/types";
import styles from "./MapView.module.css";

interface MapViewProps {
  pins: MapPin[];
  selectedPinId: string | null;
  onPinClick: (pin: MapPin) => void;
}

export function MapView({ pins, selectedPinId, onPinClick }: MapViewProps) {
  const [popupPin, setPopupPin] = useState<MapPin | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.5,
  });

  useEffect(() => {
    if (!selectedPinId) return;
    const pin = pins.find((p) => p.id === selectedPinId);
    if (pin) {
      setViewState({
        longitude: pin.lng,
        latitude: pin.lat,
        zoom: 5,
      });
      setPopupPin(pin);
    }
  }, [selectedPinId, pins]);

  const handleMarkerClick = useCallback(
    (pin: MapPin) => {
      setPopupPin(pin);
      onPinClick(pin);
    },
    [onPinClick]
  );

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />

      {pins.map((pin) => (
        <Marker
          key={pin.id}
          longitude={pin.lng}
          latitude={pin.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            handleMarkerClick(pin);
          }}
        >
          <div
            className={`${styles.marker} ${pin.id === selectedPinId ? styles.markerSelected : ""}`}
            style={{ backgroundColor: pin.color }}
          />
        </Marker>
      ))}

      {popupPin && (
        <Popup
          longitude={popupPin.lng}
          latitude={popupPin.lat}
          anchor="bottom"
          onClose={() => setPopupPin(null)}
          closeOnClick={false}
          className={styles.popup}
        >
          <div className={styles.popupContent}>
            <strong>{popupPin.label}</strong>
            <span>{popupPin.venueName}</span>
            {popupPin.date && (
              <span>
                {new Date(popupPin.date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </span>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}
