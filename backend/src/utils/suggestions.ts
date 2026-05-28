export function getSuggestionRank(name: string, input: string): number {
  const normalizedName = name.toLowerCase();
  const normalizedInput = input.trim().toLowerCase();

  if (normalizedName.startsWith(normalizedInput)) return 1;
  if (normalizedName.includes(` ${normalizedInput}`)) return 2;
  if (normalizedName.includes(normalizedInput)) return 3;
  return 4;
}

export function sortArtistSuggestions(names: string[], keyword: string): string[] {
  const input = keyword.trim().toLowerCase();

  return [...names].sort((a, b) => {
    const aRank = getSuggestionRank(a, input);
    const bRank = getSuggestionRank(b, input);

    if (aRank !== bRank) return aRank - bRank;
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });
}
