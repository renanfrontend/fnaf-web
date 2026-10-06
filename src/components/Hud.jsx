import { cameraButtonImage } from "../game/assets";

const MODE_LABEL = { EASY: "Fácil", NORMAL: "Normal", HARD: "Difícil", IMPOSSIBLE: "4/20", CUSTOM: "Custom" };

export default function Hud({ view, mode, onCameraToggle }) {
  const hour = view.hour === 0 ? 12 : view.hour;

  return (
    <>
      <div className="hud-clock">
        <span className="hour">{hour} <small>AM</small></span>
        <span className="night">Noite · {MODE_LABEL[mode]}</span>
      </div>

      <div className="hud-power" data-low={view.power <= 15}>
        <span>
          Energia: <b>{view.power}%</b>
        </span>
        <span className="usage" aria-label={`Uso ${view.usage} de 6`}>
          Uso:
          {Array.from({ length: Math.min(view.usage, 5) }, (_, i) => (
            <i key={i} data-level={i} />
          ))}
        </span>
      </div>

      <button
        className="camera-toggle"
        aria-label={view.camera.open ? "Fechar câmeras" : "Abrir câmeras"}
        onPointerEnter={(ev) => ev.pointerType === "mouse" && onCameraToggle()}
        onPointerDown={(ev) => ev.pointerType !== "mouse" && onCameraToggle()}
        onKeyDown={(ev) => ev.key === "Enter" && onCameraToggle()}
      >
        <img src={cameraButtonImage} alt="" draggable="false" />
      </button>
    </>
  );
}
