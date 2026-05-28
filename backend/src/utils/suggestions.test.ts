import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSuggestionRank, sortArtistSuggestions } from "./suggestions";

describe("getSuggestionRank", () => {
  it("prioritizes names that start with the input", () => {
    assert.equal(getSuggestionRank("Bruno Mars", "br"), 1);
  });

  it("ranks word-prefix matches ahead of plain contains matches", () => {
    assert.equal(getSuggestionRank("The Brothers", "br"), 2);
    assert.equal(getSuggestionRank("Abra", "br"), 3);
  });
});

describe("sortArtistSuggestions", () => {
  it("orders prefix matches before word-prefix and contains matches", () => {
    const result = sortArtistSuggestions(
      ["Abra", "The Brothers", "Bruno Mars"],
      "br"
    );

    assert.deepEqual(result, ["Bruno Mars", "The Brothers", "Abra"]);
  });

  it("uses shorter names when rank is tied", () => {
    const result = sortArtistSuggestions(
      ["Bruno Misogiannis", "Bruno Mars Las Vegas", "Bruno Mars"],
      "br"
    );

    assert.deepEqual(result, [
      "Bruno Mars",
      "Bruno Misogiannis",
      "Bruno Mars Las Vegas",
    ]);
  });

  it("does not mutate the input array", () => {
    const names = ["Abra", "Bruno Mars"];

    sortArtistSuggestions(names, "br");

    assert.deepEqual(names, ["Abra", "Bruno Mars"]);
  });
});
