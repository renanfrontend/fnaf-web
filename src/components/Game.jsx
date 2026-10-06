import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { GameEngine } from "../game/engine";
import { CAMERA_ORDER } from "../game/constants";
import { audio } from "../game/audio";
import { recordVictory } from "../game/progress";
import Office from "./Office";
import CameraView from "./CameraView";
import Hud from "./Hud";
import { GameOver, Jumpscare, PauseMenu, Victory } from "./Overlays";

const KEY_ACTIONS = {
  a: (e) => e.toggleDoor("left"),
  d: (e) => e.toggleDoor("right"),
  q: (e) => e.toggleLight("left"),
  e: (e) => e.toggleLight("right"),
  s: (e) => e.toggleCamera(),
  " ": (e) => e.toggleCamera(),
  arrowleft: (e) => cycleCamera(e, -1),
  arrowright: (e) => cycleCamera(e, +1),
};

function cycleCamera(engine, step) {
  const { id } = engine.state.camera;
  const i = CAMERA_ORDER.indexOf(id);
  engine.selectCamera(CAMERA_ORDER[(i + step + CAMERA_ORDER.length) % CAMERA_ORDER.length]);
}

export default function Game({ config, onExit, onRestart, onToggleMute }) {
  const engine = useMemo(
    () => new GameEngine({ levels: config.levels, onEvent: audio.handleEvent }),
    [config]
  );
  const view = useSyncExternalStore(engine.subscribe, engine.getView);
  const sceneRef = useRef(null);
  const panTarget = useRef(0);
  const [closeCount, setCloseCount] = useState(0);
  const wasOpen = useRef(false);

  // Loop principal: um único requestAnimationFrame avança o motor e suaviza o pan.
  useEffect(() => {
    if (import.meta.env.DEV) window.__fnaf = engine;
    audio.stopAll();
    audio.play("ambience");
    let last = performance.now();
    let pan = 0;
    let raf = requestAnimationFrame(function frame(now) {
      engine.update(now - last);
      last = now;
      pan += (panTarget.current - pan) * 0.08;
      sceneRef.current?.style.setProperty("--pan", pan.toFixed(4));
      raf = requestAnimationFrame(frame);
    });
    return () => {
      cancelAnimationFrame(raf);
      audio.stopAll();
    };
  }, [engine]);

  // Pausa sozinho quando a aba fica em segundo plano.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) engine.setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [engine]);

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const key = ev.key.toLowerCase();
      if (key === "escape" || key === "p") {
        engine.setPaused(!engine.state.paused);
        return;
      }
      if (key === "m") return onToggleMute();
      const action = KEY_ACTIONS[key];
      if (action) {
        ev.preventDefault();
        action(engine);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine, onToggleMute]);

  useEffect(() => {
    if (view.status === "won") recordVictory(config.mode, config.levels);
  }, [view.status, config]);

  useEffect(() => {
    if (wasOpen.current && !view.camera.open) setCloseCount((n) => n + 1);
    wasOpen.current = view.camera.open;
  }, [view.camera.open]);

  const onPointerMove = (ev) => {
    const x = ev.clientX / window.innerWidth;
    panTarget.current = Math.max(-1, Math.min(1, (x - 0.5) * 2.6));
  };

  const playing = view.status === "playing";

  return (
    <div className="scene" ref={sceneRef} onPointerMove={onPointerMove}>
      {view.camera.open ? (
        <CameraView view={view} onSelect={(id) => engine.selectCamera(id)} />
      ) : (
        <Office view={view} engine={engine} closeCount={closeCount} />
      )}

      {playing && !view.blackout ? (
        <Hud view={view} mode={config.mode} onCameraToggle={() => engine.toggleCamera()} />
      ) : null}

      {view.status === "jumpscare" ? <Jumpscare who={view.jumpscare} blackout={!!view.blackout} /> : null}
      {view.status === "lost" ? <GameOver onRestart={onRestart} onExit={onExit} /> : null}
      {view.status === "won" ? <Victory mode={config.mode} onRestart={onRestart} onExit={onExit} /> : null}
      {view.paused ? <PauseMenu onResume={() => engine.setPaused(false)} onExit={onExit} /> : null}
    </div>
  );
}
