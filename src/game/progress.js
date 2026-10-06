const KEY = "fnaf-web:progress";
// Chave usada pela versão antiga do jogo; migramos as estrelas dela.
const LEGACY_KEY = "victories";

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) ?? {};
    if (!data.stars) {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)) ?? {};
      data.stars = Object.fromEntries(Object.keys(legacy).map((k) => [k, true]));
    }
    return { stars: data.stars ?? {}, bestCustom: data.bestCustom ?? 0 };
  } catch {
    return { stars: {}, bestCustom: 0 };
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* armazenamento indisponível: progresso fica só nesta sessão */
  }
}

export function loadProgress() {
  return read();
}

/** Registra uma vitória. Noites customizadas guardam a maior soma de IA vencida. */
export function recordVictory(mode, levels) {
  const data = read();
  if (mode === "CUSTOM") {
    const total = Object.values(levels).reduce((a, b) => a + b, 0);
    data.bestCustom = Math.max(data.bestCustom, total);
  } else {
    data.stars[mode] = true;
  }
  write(data);
  return data;
}
