"use client";

import { useState, useCallback, useEffect } from "react";
import type { Artist, SearchState } from "@/types";
import { searchArtists } from "@/lib/api";

export function useArtistSearch() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [correctedKeyword, setCorrectedKeyword] = useState<string | null>(null);

  const search = useCallback(async (keyword: string) => {
    if (keyword.trim().length < 2) return;
    setState("loading");
    setError(null);
    setCorrectedKeyword(null);
    try {
      const data = await searchArtists(keyword);
      setArtists(data.artists);
      setCorrectedKeyword(data.correctedKeyword ?? null);
      setState("success");
      localStorage.setItem("lastKeyword", keyword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setState("error");
    }
  }, []);

  // リロード時に前回のキーワードで自動再検索
  useEffect(() => {
    const saved = localStorage.getItem("lastKeyword");
    if (saved) search(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = useCallback(() => {
    setArtists([]);
    setState("idle");
    setError(null);
    setCorrectedKeyword(null);
    localStorage.removeItem("lastKeyword");
  }, []);

  return { artists, state, error, correctedKeyword, search, clear };
}
