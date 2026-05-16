import type { MapPin, ClusterPin } from "@/types";

// ---- 距離計算 ------------------------------------------------

/**
 * ユークリッド距離（緯度経度の近似）
 * ズームが十分なら球面距離の代わりに使える軽量版
 */
function euclideanDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// ---- セントロイド初期化 ---------------------------------------

/**
 * K-means++ 初期化
 * ランダムより均等にセントロイドを分散させる
 */
function initCentroidsKMeansPlusPlus(
  pins: MapPin[],
  k: number
): Array<{ lat: number; lng: number }> {
  const centroids: Array<{ lat: number; lng: number }> = [];

  // 1つ目はランダムに選ぶ
  const firstIdx = Math.floor(Math.random() * pins.length);
  centroids.push({ lat: pins[firstIdx].lat, lng: pins[firstIdx].lng });

  // 2つ目以降: 既存セントロイドから最も遠い点を確率的に選ぶ
  for (let i = 1; i < k; i++) {
    const distances = pins.map((pin) => {
      const minDist = Math.min(
        ...centroids.map((c) => euclideanDistance(pin, c))
      );
      return minDist * minDist; // 二乗で重み付け
    });

    const totalWeight = distances.reduce((sum, d) => sum + d, 0);
    let rand = Math.random() * totalWeight;
    let chosen = pins[pins.length - 1];
    for (let j = 0; j < pins.length; j++) {
      rand -= distances[j];
      if (rand <= 0) {
        chosen = pins[j];
        break;
      }
    }
    centroids.push({ lat: chosen.lat, lng: chosen.lng });
  }

  return centroids;
}

// ---- 割り当てステップ -----------------------------------------

/**
 * 各ピンを最も近いセントロイドに割り当てる
 * @returns 各ピンのクラスタインデックス配列
 */
function assignPinsToCentroids(
  pins: MapPin[],
  centroids: Array<{ lat: number; lng: number }>
): number[] {
  const result: number[] = [];
  pins.forEach((pin) => {
    let minIdx = 0;
    let min = Infinity; // ← ピンごとにリセット
    for (let i = 0; i < centroids.length; i++) {
      const d = euclideanDistance(pin, centroids[i]);
      if (d < min) {
        min = d;
        minIdx = i;
      }
    }
    result.push(minIdx);
  });
  return result;
}

// ---- 更新ステップ ---------------------------------------------

/**
 * 各クラスタに割り当てられたピンの重心を新しいセントロイドとして計算する
 */
function updateCentroids(
  pins: MapPin[],
  assignments: number[],
  k: number
): Array<{ lat: number; lng: number }> {
  return Array.from({ length: k }, (_, clusterIdx) => {
    const clusterPins = pins.filter((_, i) => assignments[i] === clusterIdx);
    if (clusterPins.length === 0) {
      // 空クラスタはランダムなピンで再初期化
      const fallback = pins[Math.floor(Math.random() * pins.length)];
      return { lat: fallback.lat, lng: fallback.lng };
    }
    const avgLat = clusterPins.reduce((s, p) => s + p.lat, 0) / clusterPins.length;
    const avgLng = clusterPins.reduce((s, p) => s + p.lng, 0) / clusterPins.length;
    return { lat: avgLat, lng: avgLng };
  });
}

// ---- 収束チェック --------------------------------------------

function hasConverged(
  prev: Array<{ lat: number; lng: number }>,
  next: Array<{ lat: number; lng: number }>,
  tolerance = 0.0001
): boolean {
  return prev.every(
    (c, i) =>
      Math.abs(c.lat - next[i].lat) < tolerance &&
      Math.abs(c.lng - next[i].lng) < tolerance
  );
}

// ---- メイン関数 -----------------------------------------------

/**
 * MapPin[] をK-meansでクラスタリングして ClusterPin[] を返す
 *
 * @param pins    クラスタリング対象のピン一覧
 * @param k       クラスタ数
 * @param maxIter 最大反復回数（デフォルト100）
 */
export function clusterPins(
  pins: MapPin[],
  k: number,
  maxIter = 100
): ClusterPin[] {
  if (pins.length === 0) return [];
  if (pins.length <= k) {
    // ピン数がK以下なら全てを個別クラスタとして返す
    return pins.map((pin, i) => ({
      id: `cluster-${i}`,
      lat: pin.lat,
      lng: pin.lng,
      count: 1,
      pins: [pin],
    }));
  }

  let centroids = initCentroidsKMeansPlusPlus(pins, k);
  let assignments: number[] = new Array(pins.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    const newAssignments = assignPinsToCentroids(pins, centroids);
    const newCentroids = updateCentroids(pins, newAssignments, k);

    if (hasConverged(centroids, newCentroids)) {
      assignments = newAssignments;
      centroids = newCentroids;
      break;
    }

    assignments = newAssignments;
    centroids = newCentroids;
  }

  // ClusterPin に変換
  return centroids.map((centroid, clusterIdx) => {
    const clusterPins = pins.filter((_, i) => assignments[i] === clusterIdx);
    return {
      id: `cluster-${clusterIdx}`,
      lat: centroid.lat,
      lng: centroid.lng,
      count: clusterPins.length,
      pins: clusterPins,
    };
  });
}

/**
 * ズームレベルに応じて適切なK値を決定する
 *
 * @param pinCount 総ピン数
 * @param zoom     マップのズームレベル (0〜22)
 */
export function getKForZoom(pinCount: number, zoom: number): number {
  if (zoom >= 6) return pinCount; // 個別表示（クラスタリングしない）
  if (zoom >= 4) return Math.min(pinCount, 10);
  if (zoom >= 2) return Math.min(pinCount, 5);
  return Math.min(pinCount, 3);
}
