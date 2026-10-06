import { useEffect, useState } from "react";
import { jumpscareImages, staticImage, victoryImage } from "../game/assets";

export function Jumpscare({ who, blackout }) {
  const src = who === "Freddy" && blackout ? jumpscareImages.FreddyBlackout : jumpscareImages[who];
  return (
    <div className="overlay jumpscare">
      <div className="pano">
        <img className="pano-img" src={src} alt={who} draggable="false" />
      </div>
    </div>
  );
}

function useDelayed(ms) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready;
}

export function GameOver({ onRestart, onExit }) {
  const ready = useDelayed(1800);
  return (
    <div className="overlay game-over">
      <img className="static full" src={staticImage} alt="" draggable="false" />
      <div className="end-card" data-ready={ready}>
        <h2>GAME OVER</h2>
        {ready ? (
          <div className="end-actions">
            <button onClick={onRestart} autoFocus>Tentar de novo</button>
            <button onClick={onExit}>Menu</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Victory({ mode, onRestart, onExit }) {
  const ready = useDelayed(4500);
  return (
    <div className="overlay victory">
      <img src={victoryImage} alt="5 AM → 6 AM" draggable="false" />
      {ready ? (
        <div className="end-card" data-ready>
          <h2>Você sobreviveu!</h2>
          {mode !== "CUSTOM" ? <p>★ Estrela conquistada</p> : null}
          <div className="end-actions">
            <button onClick={onRestart} autoFocus>Jogar de novo</button>
            <button onClick={onExit}>Menu</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PauseMenu({ onResume, onExit }) {
  return (
    <div className="overlay pause" role="dialog" aria-modal="true" aria-label="Jogo pausado">
      <div className="end-card" data-ready>
        <h2>Pausado</h2>
        <div className="end-actions">
          <button onClick={onResume} autoFocus>Continuar</button>
          <button onClick={onExit}>Desistir</button>
        </div>
      </div>
    </div>
  );
}
