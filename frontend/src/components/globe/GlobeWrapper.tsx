"use client";

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import ReactGlobe from "react-globe.gl";
import type { MapPin, GlobeRef } from "@/types";
// import type { ClusterPin } from "@/types";
// import { clusterPins } from "@/utils/kmeans";

interface GlobeWrapperProps {
  pins: MapPin[];
  selectedPinId: string | null;
  onPinClick: (pin: MapPin) => void;
  width: number;
  height: number;
}

// k-means clustering is temporarily disabled.
// /** 高度 → クラスタ数の変換 */
// function getKForAltitude(pinCount: number, altitude: number): number {
//   if (altitude <= 0.8) return pinCount;        // 都市レベル: 個別表示
//   if (altitude <= 1.5) return Math.min(pinCount, 10);
//   if (altitude <= 2.2) return Math.min(pinCount, 5);
//   return Math.min(pinCount, 3);               // 全球表示: 大陸レベル
// }

export const GlobeWrapper = forwardRef<GlobeRef, GlobeWrapperProps>(
  function GlobeWrapper({ pins, selectedPinId, onPinClick, width, height }, ref) {
    const globeRef = useRef<any>(null);
    // k-means clustering is temporarily disabled.
    // const altitudeRef = useRef(2.5); // カメラ変化に即時追従するref
    // const [displayAltitude, setDisplayAltitude] = useState(2.5); // クラスタ再計算トリガー

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

        const saved = localStorage.getItem("globePov");
        if (saved) {
          try {
            const pov = JSON.parse(saved);
            // k-means clustering is temporarily disabled.
            // altitudeRef.current = pov.altitude ?? 2.5;
            // setDisplayAltitude(pov.altitude ?? 2.5);
            globeRef.current.pointOfView(pov, 0);
          } catch {}
        }

        let saveTimer: ReturnType<typeof setTimeout>;
        // k-means clustering is temporarily disabled.
        // let altTimer: ReturnType<typeof setTimeout>;

        const onCameraChange = () => {
          const pov = globeRef.current?.pointOfView();
          if (!pov) return;

          // k-means clustering is temporarily disabled.
          // refは即時更新（クラスタクリック時の zoom-in 計算で使う）
          // altitudeRef.current = pov.altitude;

          // localStorage保存は 100ms デバウンス
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            localStorage.setItem("globePov", JSON.stringify(pov));
          }, 100);

          // k-means clustering is temporarily disabled.
          // クラスタ再計算は 150ms デバウンス（React state更新を間引く）
          // clearTimeout(altTimer);
          // altTimer = setTimeout(() => {
          //   setDisplayAltitude(pov.altitude);
          // }, 150);
        };

        controls.addEventListener("change", onCameraChange);
        return () => {
          controls.removeEventListener("change", onCameraChange);
          clearTimeout(saveTimer);
          // k-means clustering is temporarily disabled.
          // clearTimeout(altTimer);
        };
      }
    }, []);

    // k-means clustering is temporarily disabled.
    // const clusters = useMemo<ClusterPin[] | null>(() => {
    //   const k = getKForAltitude(pins.length, displayAltitude);
    //   if (k >= pins.length) return null;
    //   return clusterPins(pins, k);
    // }, [pins, displayAltitude]);

    const globeData: MapPin[] = pins;
    // const globeData: (MapPin | ClusterPin)[] = clusters ?? pins;

    const htmlElement = useCallback(
      (point: object) => {
        const el = document.createElement("div");

        // k-means clustering is temporarily disabled.
        // ClusterPin か MapPin かを count プロパティで判別
        // if ("count" in point) {
        //   const cluster = point as ClusterPin;
        //   el.style.cssText = `
        //     width: 40px; height: 40px;
        //     border-radius: 50%;
        //     background: rgba(29, 185, 84, 0.85);
        //     border: 2px solid rgba(255,255,255,0.85);
        //     display: flex; align-items: center; justify-content: center;
        //     cursor: pointer;
        //     font-size: 14px; font-weight: 700; color: white;
        //     transform: translate(-50%, -50%);
        //     box-shadow: 0 2px 10px rgba(0,0,0,0.55);
        //     transition: transform 0.15s;
        //   `;
        //   el.textContent = String(cluster.count);
        //   el.title = `${cluster.count} events in this area`;
        //   el.addEventListener("pointerdown", (e) => e.stopPropagation());
        //   el.addEventListener("click", () => {
        //     // 高度を半分にして拡大
        //     const newAlt = Math.max(0.3, altitudeRef.current * 0.5);
        //     globeRef.current?.pointOfView(
        //       { lat: cluster.lat, lng: cluster.lng, altitude: newAlt },
        //       800
        //     );
        //   });
        //   return el;
        // }

        // 通常ピン
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
        htmlElementsData={globeData}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={htmlElement}
        animateIn={true}
      />
    );
  }
);
