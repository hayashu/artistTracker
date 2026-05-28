import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { levenshteinDistance, SpellCorrector } from "./spell-corrector";

describe("levenshteinDistance", () => {
  it("calculates edit distance for a classic example", () => {
    assert.equal(levenshteinDistance("kitten", "sitting"), 3);
  });

  it("is case-insensitive", () => {
    assert.equal(levenshteinDistance("Bruno", "bruno"), 0);
  });

  it("handles empty strings", () => {
    assert.equal(levenshteinDistance("", "abc"), 3);
    assert.equal(levenshteinDistance("abc", ""), 3);
  });
});

describe("SpellCorrector", () => {
  it("returns exact matches without correction", () => {
    const corrector = new SpellCorrector(["Bruno Mars"]);

    assert.deepEqual(corrector.correct("Bruno Mars"), {
      corrected: "Bruno Mars",
      original: "Bruno Mars",
      wasCorrected: false,
    });
  });

  it("corrects close misspellings", () => {
    const corrector = new SpellCorrector(["Bruno Mars"]);

    assert.deepEqual(corrector.correct("Bruno Marz"), {
      corrected: "bruno mars",
      original: "Bruno Marz",
      wasCorrected: true,
    });
  });

  it("keeps distant inputs unchanged", () => {
    const corrector = new SpellCorrector(["Bruno Mars"]);

    assert.deepEqual(corrector.correct("Olivia Rodrigo"), {
      corrected: "Olivia Rodrigo",
      original: "Olivia Rodrigo",
      wasCorrected: false,
    });
  });
});
