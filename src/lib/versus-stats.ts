import { Storage, type VersusStats } from "./storage";

export interface MatchOutcome {
  /** Wynik gracza po zakończeniu meczu */
  myScore: number;
  oppScore: number;
  /** Suma rund w których ja vs przeciwnik wygrał (bez remisów) */
  myRoundsWon: number;
  oppRoundsWon: number;
  /** Czy to mecz z botem? Jeśli tak, podaj trudność */
  vsBot?: "easy" | "normal" | "hard";
}

/** Aktualizuje statystyki versus i zwraca listę nowo odblokowanych achievementów. */
export function recordVersusMatch(o: MatchOutcome): string[] {
  const s: VersusStats = { ...Storage.getVersusStats() };
  const won = o.myScore > o.oppScore;
  const lost = o.myScore < o.oppScore;

  s.matchesPlayed += 1;
  s.roundsWon += o.myRoundsWon;
  s.roundsLost += o.oppRoundsWon;

  if (won) {
    s.wins += 1;
    s.currentStreak += 1;
    if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
    if (o.vsBot) s.vsBotWins += 1;
    if (o.vsBot === "hard") s.vsBotHardWins += 1;
  } else if (lost) {
    s.losses += 1;
    s.currentStreak = 0;
  } else {
    s.draws += 1;
  }

  Storage.saveVersusStats(s);

  // Achievementy
  const unlocked: string[] = [];
  const tryUnlock = (id: string) => { if (Storage.unlock(id)) unlocked.push(id); };

  if (won) tryUnlock("versus_first_win");
  if (won && o.oppRoundsWon === 0 && o.myScore >= 3) tryUnlock("versus_flawless");
  if (won && o.vsBot === "hard") tryUnlock("versus_bot_hard");
  if (s.wins >= 5) tryUnlock("versus_5_wins");

  return unlocked;
}
