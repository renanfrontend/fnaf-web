import { freddyBlackoutImage, officeImages, resolveOfficeImage } from "../game/assets";

// Posições dos botões na imagem 1600x720 do escritório (em %).
const BUTTONS = [
  { side: "left", kind: "door", label: "Porta esquerda", style: { left: "1.2%", top: "46.5%" } },
  { side: "left", kind: "light", label: "Luz esquerda", style: { left: "1.2%", top: "58%" } },
  { side: "right", kind: "door", label: "Porta direita", style: { left: "94.3%", top: "46.9%" } },
  { side: "right", kind: "light", label: "Luz direita", style: { left: "94.3%", top: "58.4%" } },
];

export default function Office({ view, engine, closeCount }) {
  const background = view.blackout ? blackoutImage(view.blackout) : resolveOfficeImage(view);
  const interactive = view.status === "playing" && !view.blackout;

  return (
    <>
      <div className={`pano office ${view.blackout === "musicbox" ? "flicker" : ""}`}>
        {background ? <img className="pano-img" src={background} alt="" draggable="false" /> : null}
        {interactive
          ? BUTTONS.map((b) => {
              const active = b.kind === "door" ? view.doors[b.side] : view.lights[b.side];
              return (
                <button
                  key={`${b.side}-${b.kind}`}
                  className={`office-button ${b.kind}`}
                  style={b.style}
                  aria-label={b.label}
                  aria-pressed={active}
                  data-blocked={view.blocked[b.side]}
                  onPointerDown={(ev) => {
                    ev.preventDefault();
                    if (b.kind === "door") engine.toggleDoor(b.side);
                    else engine.toggleLight(b.side);
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") b.kind === "door" ? engine.toggleDoor(b.side) : engine.toggleLight(b.side);
                  }}
                />
              );
            })
          : null}
      </div>
      {closeCount > 0 ? <div key={closeCount} className="monitor-down" aria-hidden="true" /> : null}
    </>
  );
}

function blackoutImage(phase) {
  if (phase === "wait") return officeImages["304"];
  if (phase === "musicbox") return freddyBlackoutImage;
  return null;
}
