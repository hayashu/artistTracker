/**
 * スペル補正ユーティリティ
 * レーベンシュタイン距離を使って、入力キーワードを既知のアーティスト名に補正する
 */

// TODO(human): levenshteinDistance を実装してください（詳細は下のコメント参照）
/**
 * 2つの文字列間のレーベンシュタイン距離（編集距離）を計算する。
 * 編集距離 = 一方の文字列をもう一方に変換するために必要な
 *            挿入・削除・置換の最小回数。
 *
 * 例: levenshteinDistance("kitten", "sitting") → 3
 *   - k→s (置換), e→i (置換), →g (挿入)
 *
 * ヒント:
 *   - (a.length+1) x (b.length+1) の2次元配列(dp)を作る
 *   - dp[i][0] = i, dp[0][j] = j で初期化
 *   - dp[i][j] = 文字が同じなら dp[i-1][j-1]、
 *     違うなら min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+1)
 *   - dp[a.length][b.length] が答え
 */
export function levenshteinDistance(a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const dp: number[][] = Array.from(                                                                                                                   
    { length: a.length + 1 },                                                                                                                          
    (_, i) => Array.from({ length: b.length + 1 }, (_, j) => {                                                                                         
      if (i === 0) return j;                                                                                                                           
      if (j === 0) return i;                                                                                                                           
      return 0;
    })                                                                                                                                                 
  );              
  for (let i = 1; i <= a.length; i++){
    for (let j = 1; j <= b.length; j++){
      if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1];
      else{
        const topLeft = dp[i-1][j-1] + 1;
        const top = dp[i-1][j] + 1;
        const left = dp[i][j-1] + 1;
        dp[i][j] = Math.min(topLeft, top, left);
      }
    }
  }

  return dp[a.length][b.length];
}

const SIMILARITY_THRESHOLD = 0.6;

export class SpellCorrector {
  private dictionary: Set<string> = new Set();

  constructor(seedWords: string[] = []) {
    for (const word of seedWords) {
      this.addWord(word);
    }
  }

  /** 辞書にアーティスト名を追加（小文字で正規化して保存） */
  addWord(word: string): void {
    this.dictionary.add(word.toLowerCase());
  }

  /** 複数のアーティスト名を一括追加 */
  addWords(words: string[]): void {
    for (const word of words) {
      this.addWord(word);
    }
  }

  /**
   * 入力キーワードを辞書内の最も近い単語に補正する。
   * 類似度が閾値未満、または辞書が空の場合は元のキーワードをそのまま返す。
   *
   * @returns { corrected: string, original: string, wasCorrected: boolean }
   */
  correct(input: string): {
    corrected: string;
    original: string;
    wasCorrected: boolean;
  } {
    const normalizedInput = input.toLowerCase().trim();

    // 完全一致があれば補正不要
    if (this.dictionary.has(normalizedInput)) {
      return { corrected: input, original: input, wasCorrected: false };
    }

    let bestMatch: string | null = null;
    let bestDistance = Infinity;

    for (const word of this.dictionary) {
      const distance = levenshteinDistance(normalizedInput, word);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = word;
      }
    }

    if (bestMatch === null) {
      return { corrected: input, original: input, wasCorrected: false };
    }

    // 類似度 = 1 - (距離 / 長い方の文字列長)
    const maxLen = Math.max(normalizedInput.length, bestMatch.length);
    const similarity = 1 - bestDistance / maxLen;

    if (similarity >= SIMILARITY_THRESHOLD) {
      console.log(
        `[Spell Correct] "${input}" -> "${bestMatch}" (similarity: ${similarity.toFixed(2)})`
      );
      return { corrected: bestMatch, original: input, wasCorrected: true };
    }

    return { corrected: input, original: input, wasCorrected: false };
  }

  /** 辞書のサイズを返す */
  get size(): number {
    return this.dictionary.size;
  }
}
