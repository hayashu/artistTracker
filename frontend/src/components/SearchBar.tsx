"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { getArtistSuggestions } from "@/lib/api";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, onClear, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(false);

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = await getArtistSuggestions(query.trim()).catch(() => ({ suggestions: [] }));
      setSuggestions(data.suggestions);
      setShowSuggestions(data.suggestions.length > 0);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setShowSuggestions(false);
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (name: string) => {
    skipFetchRef.current = true;
    setQuery(name);
    setShowSuggestions(false);
    onSearch(name);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.input}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search artists..."
            disabled={isLoading}
          />
          {query && (
            <button type="button" className={styles.clearBtn} onClick={handleClear}>
              &times;
            </button>
          )}
        </div>
        <button className={styles.submitBtn} type="submit" disabled={isLoading || query.trim().length < 2}>
          {isLoading ? <span className={styles.spinner} /> : "Search"}
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.dropdown}>
          {suggestions.map((name) => (
            <li
              key={name}
              className={styles.dropdownItem}
              onMouseDown={() => handleSuggestionClick(name)}
            >
              <svg className={styles.dropdownIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
