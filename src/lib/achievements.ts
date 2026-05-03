export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_win", title: "Pierwsza krew", description: "Zgadnij pierwszy track" },
  { id: "snap", title: "Snap", description: "Trafienie z 0.5s sample'a" },
  { id: "streak_5", title: "Seria 5", description: "Zdobądź 5 trafień pod rząd w Endless" },
  { id: "streak_10", title: "Seria 10", description: "Zdobądź 10 trafień pod rząd" },
  { id: "streak_25", title: "Seria 25", description: "25 pod rząd. Bestia." },
  { id: "daily_7", title: "Tydzień daily", description: "Wygraj 7 daily z rzędu" },
  { id: "album_complete", title: "Pełna płyta", description: "Ukończ album w 100%" },
  { id: "hard_win", title: "Hardcore", description: "Wygraj na poziomie Hard" },
  { id: "perfect_album", title: "Bez pomyłki", description: "Ukończ album bez ani jednego pudła" },
];
