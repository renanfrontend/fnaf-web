// Duração de cada hora do jogo (12AM → 6AM). O FNAF original usa ~89s.
export const HOUR_MS = 89_000;
export const NIGHT_HOURS = 6;

// Energia: com uso 1 (nada ligado) gasta 1% a cada 9.6s; cada item ligado soma 1 de uso.
export const MS_PER_PERCENT_AT_USAGE_1 = 9_600;

// Intervalo entre "oportunidades de movimento" de cada animatrônico (valores do original).
export const MOVE_INTERVAL = {
  Freddy: 3_020,
  Bonnie: 4_970,
  Chica: 4_980,
  Foxy: 5_010,
};

export const CHARACTERS = ["Freddy", "Bonnie", "Chica", "Foxy"];
export const MAX_AI = 20;

// Aumento de dificuldade ao longo da noite (como no original).
export const AI_BUMPS = {
  2: { Bonnie: 1 },
  3: { Bonnie: 1, Chica: 1, Foxy: 1 },
  4: { Bonnie: 1, Chica: 1, Foxy: 1 },
};

export const CAMERAS = {
  "1A": { name: "Show Stage" },
  "1B": { name: "Dining Area" },
  "1C": { name: "Pirate Cove" },
  "2A": { name: "West Hall" },
  "2B": { name: "W. Hall Corner" },
  3: { name: "Supply Closet" },
  "4A": { name: "East Hall" },
  "4B": { name: "E. Hall Corner" },
  5: { name: "Backstage" },
  6: { name: "Kitchen", audioOnly: true },
  7: { name: "Restrooms" },
};

export const CAMERA_ORDER = ["1A", "1B", "1C", "5", "7", "6", "3", "2A", "2B", "4A", "4B"];

// Rotas possíveis. "door" = porta do escritório (Bonnie esquerda, Chica direita).
export const ROUTES = {
  Bonnie: {
    "1A": ["1B", "5"],
    "1B": ["5", "2A", "3"],
    5: ["1B", "2A"],
    3: ["2A", "2B", "door"],
    "2A": ["3", "2B", "door"],
    "2B": ["door", "3"],
  },
  Chica: {
    "1A": ["1B"],
    "1B": ["7", "6"],
    7: ["6", "4A", "1B"],
    6: ["7", "4A"],
    "4A": ["4B", "7"],
    "4B": ["door", "4A"],
  },
};

// Freddy segue sempre o mesmo caminho até a porta direita.
export const FREDDY_PATH = ["1A", "1B", "7", "6", "4A", "4B"];

export const SIDE_OF = { Bonnie: "left", Chica: "right", Freddy: "right", Foxy: "left" };

// Foxy: depois de sair da Pirate Cove ele corre até a porta em até 25s,
// ou em 1.5s se o jogador olhar a câmera 2A.
export const FOXY_RUN_MS = 25_000;
export const FOXY_SEEN_RUN_MS = 1_500;

// Tempo máximo que um animatrônico dentro do escritório espera você baixar a câmera.
export const OFFICE_FORCE_MS = 20_000;
export const JUMPSCARE_MS = 2_600;
export const DISRUPT_MS = 1_200;
export const SWITCH_STATIC_MS = 250;

export const PRESETS = {
  EASY: { Freddy: 2, Bonnie: 3, Chica: 3, Foxy: 2 },
  NORMAL: { Freddy: 6, Bonnie: 10, Chica: 10, Foxy: 8 },
  HARD: { Freddy: 12, Bonnie: 15, Chica: 15, Foxy: 14 },
  IMPOSSIBLE: { Freddy: 20, Bonnie: 20, Chica: 20, Foxy: 20 },
};
