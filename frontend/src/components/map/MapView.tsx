"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import type { MapPin } from "@/types";
// import type { ClusterPin } from "@/types";
// import { clusterPins, getKForZoom } from "@/utils/kmeans";
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

  // k-means clustering is temporarily disabled.
  // const clusters = useMemo<ClusterPin[] | null>(() => {
  //   const k = getKForZoom(pins.length, viewState.zoom);
  //   if (k >= pins.length) return null; // 個別ピン表示
  //   return clusterPins(pins, k);
  // }, [pins, viewState.zoom]);

  useEffect(() => {
    if (!selectedPinId) return;
    const pin = pins.find((p) => p.id === selectedPinId);
    if (pin) {
      setViewState((prev) => ({
        ...prev,
        longitude: pin.lng,
        latitude: pin.lat,
        zoom: 5,
      }));
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

  // k-means clustering is temporarily disabled.
  // const handleClusterClick = useCallback((cluster: ClusterPin) => {
  //   setViewState((prev) => ({
  //     ...prev,
  //     longitude: cluster.lng,
  //     latitude: cluster.lat,
  //     zoom: Math.min(prev.zoom + 2.5, 10),
  //   }));
  // }, []);

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />

      {/*
        k-means clustering is temporarily disabled.
        {clusters
          ? clusters.map((cluster) => (
              <Marker
                key={cluster.id}
                longitude={cluster.lng}
                latitude={cluster.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleClusterClick(cluster);
                }}
              >
                <div className={styles.clusterMarker}>{cluster.count}</div>
              </Marker>
            ))
          : pins.map((pin) => (...))}
      */}
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
