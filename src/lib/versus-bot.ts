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
  easy:   { id: "easy",   name: "Mata",        emoji: "🎧", description: "Świeży gracz w grze. Czasem trafi, czasem nie." },
  normal: { id: "normal", name: "Białas",      emoji: "🎤", description: "Siedzi w rapie od kilku lat. Solidny przeciwnik." },
  hard:   { id: "hard",   name: "Peja",        emoji: "💎", description: "Legenda z 20-letnim stażem. Rozpoznaje bit z pół sekundy." },
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
      weights = [1, 2, 3, 5, 6, 4]; // szczyt ~próba 5
      missChance = 0.40;
      break;
    case "normal":
      weights = [2, 4, 6, 5, 3, 1]; // szczyt ~próba 3
      missChance = 0.22;
      break;
    case "hard":
      weights = [14, 8, 3, 1, 1, 1]; // niemal zawsze 1-2 próba
      missChance = 0.07;
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
