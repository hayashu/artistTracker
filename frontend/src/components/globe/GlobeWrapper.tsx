"use client";

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import ReactGlobe from "react-globe.gl";
import type { MapPin, GlobeRef } from "@/types";

interface GlobeWrapperProps {
  pins: MapPin[];
  selectedPinId: string | null;
  onPinClick: (pin: MapPin) => void;
  width: number;
  height: number;
}

export const GlobeWrapper = forwardRef<GlobeRef, GlobeWrapperProps>(
  function GlobeWrapper({ pins, selectedPinId, onPinClick, width, height }, ref) {
    const globeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      pointOfView: (coords, transitionMs = 1000) => {
        globeRef.current?.pointOfView(coords, transitionMs);
      },
    }));

    useEffect(() => {
      if (!globeRef.current) return;
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.enableZoom = true;

        // 起動時に保存済みのカメラ位置を復元
        const saved = localStorage.getItem("globePov");
        if (saved) {
          try {
            const pov = JSON.parse(saved);
            globeRef.current.pointOfView(pov, 0);
          } catch {}
        }

        // カメラ移動のたびに保存（100ms デバウンス）
        let timer: ReturnType<typeof setTimeout>;
        const onCameraChange = () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            const pov = globeRef.current?.pointOfView();
            if (pov) localStorage.setItem("globePov", JSON.stringify(pov));
          }, 100);
        };
        controls.addEventListener("change", onCameraChange);
        return () => {
          controls.removeEventListener("change", onCameraChange);
          clearTimeout(timer);
        };
      }
    }, []);

    const htmlElement = useCallback(
      (point: object) => {
        const pin = point as MapPin;
        const isSelected = pin.id === selectedPinId;
        const size = isSelected ? 36 : 28;
        const color = pin.color;
        const dateStr = pin.date
          ? new Date(pin.date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "TBD";

        const el = document.createElement("div");
        el.style.cssText = `
          width: ${size}px;
          cursor: pointer;
          transform: translate(-50%, -100%);
          filter: ${isSelected ? `drop-shadow(0 0 6px ${color})` : "drop-shadow(0 2px 3px rgba(0,0,0,0.5))"};
          transition: filter 0.2s;
          pointer-events: all;
        `;
        el.title = `${pin.label} · ${pin.venueName} · ${dateStr}`;
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="${size}" height="${Math.round(size * 4 / 3)}">
            <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"
              fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="0.8"/>
            <circle cx="12" cy="8" r="3.5" fill="white" opacity="0.9"/>
          </svg>
        `;
        el.addEventListener("pointerdown", (e) => e.stopPropagation());
        el.addEventListener("click", () => onPinClick(pin));
        return el;
      },
      [selectedPinId, onPinClick]
    );

    return (
      <ReactGlobe
        ref={globeRef}
        width={width}
        height={height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        htmlElementsData={pins}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={htmlElement}
        animateIn={true}
      />
    );
  }
);
