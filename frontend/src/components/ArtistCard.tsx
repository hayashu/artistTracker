"use client";

import type { Artist } from "@/types";
import styles from "./ArtistCard.module.css";

interface ArtistCardProps {
  artist: Artist;
  isSelected: boolean;
  onClick: () => void;
}

export function ArtistCard({ artist, isSelected, onClick }: ArtistCardProps) {
  return (
    <button
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <div className={styles.imageWrapper}>
        {artist.imageUrl ? (
          <img src={artist.imageUrl} alt={artist.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{artist.name}</span>
        <span className={styles.genre}>
          {[artist.genre, artist.subGenre].filter(Boolean).join(" / ") || "Music"}
        </span>
      </div>
    </button>
  );
}
