import { useCallback, useEffect, useState } from "react";
import Menu from "./components/Menu";
import Game from "./components/Game";
import { PRESETS } from "./game/constants";
import { allPreloadImages, goldenFreddyImage } from "./game/assets";
import { audio } from "./game/audio";

const CONFIG_KEY = "fnaf-web:config";

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY));
    if (saved?.levels && saved?.mode) return saved;
  } catch {
    /* sem configuração salva */
  }
  return { mode: "NORMAL", levels: { ...PRESETS.NORMAL } };
}

// 1987: o easter egg do Golden Freddy.
const isGoldenFreddy = ({ Freddy, Bonnie, Chica, Foxy }) =>
  Freddy === 1 && Bonnie === 9 && Chica === 8 && Foxy === 7;

export default function App() {
  const [screen, setScreen] = useState("menu"); // menu | game | golden
  const [config, setConfig] = useState(loadConfig);
  const [run, setRun] = useState(0);
  const [muted, setMuted] = useState(audio.muted);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch {
      /* armazenamento indisponível */
    }
  }, [config]);

  // Pré-carrega as imagens para a troca de câmera não piscar.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 500));
    idle(() => {
      for (const src of allPreloadImages) new Image().src = src;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      audio.setMuted(!m);
      return !m;
    });
  }, []);

  const start = () => {
    audio.preload();
    if (isGoldenFreddy(config.levels)) {
      audio.play("golden");
      setScreen("golden");
      return;
    }
    setRun((r) => r + 1);
    setScreen("game");
  };

  useEffect(() => {
    if (screen !== "golden") return;
    const t = setTimeout(() => setScreen("menu"), 4000);
    return () => clearTimeout(t);
  }, [screen]);

  if (screen === "golden") {
    return <div className="golden-freddy" style={{ backgroundImage: `url(${goldenFreddyImage})` }} />;
  }

  if (screen === "game") {
    return (
      <Game
        key={run}
        config={config}
        onExit={() => setScreen("menu")}
        onRestart={() => setRun((r) => r + 1)}
        onToggleMute={toggleMute}
      />
    );
  }

  return <Menu config={config} setConfig={setConfig} onStart={start} muted={muted} onToggleMute={toggleMute} />;
}
