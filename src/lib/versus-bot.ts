/**
 * Logika bota dla trybu Versus.
 * Bot decyduje LOSOWO (z rozkładem zależnym od trudności):
 *   - czy w ogóle trafi
 *   - na której próbie (im niżej tym lepiej)
 *   - jak długo "myśli" zanim wyśle wynik
 * Nie patrzy na track gracza — gra równolegle, niezależnie.
 */

export type BotDifficulty = "easy" | "normal" | "hard";

export interface BotProfile {
  id: BotDifficulty;
  name: string;
  emoji: string;
  description: string;
}

export const BOT_PROFILES: Record<BotDifficulty, BotProfile> = {
  easy:   { id: "easy",   name: "Beat Rookie",   emoji: "🎧", description: "Świeżak. Słucha całych sampli." },
  normal: { id: "normal", name: "Mixtape Mike",  emoji: "🎤", description: "Solidny gracz. Średnio 3 próby." },
  hard:   { id: "hard",   name: "DJ Diamond",    emoji: "💎", description: "Pamięta wszystko. Bywa, że trafi z pół sekundy." },
};

interface BotPlan {
  /** indeks próby na której bot odpowiada (0..maxAttempts-1). Jeśli correct=false → uznajemy że oddał wszystkie próby */
  attemptsUsed: number;
  correct: boolean;
  /** ms opóźnienia zanim zakomunikuje wynik */
  thinkMs: number;
}

function pickByWeights(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * @param maxAttempts liczba prób w rundzie (zwykle 6)
 * @param difficulty poziom bota
 */
export function planBotRound(maxAttempts: number, difficulty: BotDifficulty): BotPlan {
  // Rozkład trafień po próbach [próba 1, próba 2, ...]
  // Im wyższa trudność, tym większa szansa na wczesne trafienie.
  let weights: number[];
  let missChance: number;

  switch (difficulty) {
    case "easy":
      weights = [1, 2, 4, 6, 5, 3]; // szczyt ~próba 4
      missChance = 0.30;
      break;
    case "normal":
      weights = [3, 5, 6, 4, 2, 1]; // szczyt ~próba 3
      missChance = 0.15;
      break;
    case "hard":
      weights = [8, 6, 3, 2, 1, 1]; // bardzo wczesne trafienia
      missChance = 0.05;
      break;
  }

  // Dopasuj długość weights do maxAttempts
  const w = weights.slice(0, maxAttempts);
  while (w.length < maxAttempts) w.push(1);

  const correct = Math.random() >= missChance;
  if (!correct) {
    return { attemptsUsed: maxAttempts, correct: false, thinkMs: randomMs(difficulty, maxAttempts) };
  }

  const attemptIdx = pickByWeights(w); // 0-based
  const attemptsUsed = attemptIdx + 1;
  return { attemptsUsed, correct: true, thinkMs: randomMs(difficulty, attemptsUsed) };
}

function randomMs(difficulty: BotDifficulty, attempts: number): number {
  // Czas bazowy proporcjonalny do liczby prób + losowy jitter.
  // Bot nie powinien być natychmiastowy, ani męcząco wolny.
  const perAttempt = difficulty === "hard" ? 1500 : difficulty === "normal" ? 2200 : 3000;
  const base = 1500 + perAttempt * attempts;
  const jitter = Math.random() * 1500;
  return Math.round(base + jitter);
}
