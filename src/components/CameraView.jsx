import { CAMERAS } from "../game/constants";
import { foxyHallwayImage, mapImage, resolveCamImage, staticImage } from "../game/assets";

// Áreas clicáveis sobre a imagem do mapa (400x400), em %.
const MAP_SPOTS = {
  "1A": [27.25, 5, 13.25, 9.25],
  "1B": [24, 20.5, 12.25, 8.25],
  "1C": [12, 39.5, 12.75, 9],
  "2A": [26.5, 70.5, 12.5, 9.25],
  "2B": [26, 81.75, 14, 8.25],
  3: [8.25, 62.5, 12, 8.25],
  "4A": [49, 70, 14.5, 9.5],
  "4B": [49.25, 81.25, 14.25, 10],
  5: [0, 27, 13.5, 9],
  6: [79.5, 57.75, 14.25, 9.25],
  7: [79.75, 24.25, 12.75, 8.25],
};

export default function CameraView({ view, onSelect }) {
  const cam = view.camera;
  const info = CAMERAS[cam.id];

  let feed = null;
  if (!info.audioOnly && !cam.disrupted) {
    feed =
      cam.id === "2A" && cam.foxyRunning
        ? foxyHallwayImage
        : resolveCamImage(cam.id, cam.present, cam.foxyStage);
  }

  return (
    <div className="camera-view">
      {feed ? (
        <div className="pano cam-feed">
          <img className="pano-img" src={feed} alt={`Câmera ${cam.id}`} draggable="false" />
        </div>
      ) : null}

      {info.audioOnly && !cam.disrupted ? (
        <div className="audio-only">
          <p>-CAMERA DISABLED-</p>
          <p>AUDIO ONLY</p>
        </div>
      ) : null}

      <img className={`static ${cam.switching || cam.disrupted ? "strong" : ""}`} src={staticImage} alt="" draggable="false" />
      <div className="monitor-up" aria-hidden="true" />
      <div className="cam-frame" aria-hidden="true" />

      <div className="cam-label">
        <span className="rec" aria-hidden="true" />
        <strong>CAM {cam.id}</strong>
        <span>{info.name}</span>
      </div>

      <nav className="map" aria-label="Mapa das câmeras">
        <img src={mapImage} alt="" draggable="false" />
        {Object.entries(MAP_SPOTS).map(([id, [left, top, width, height]]) => (
          <button
            key={id}
            className="map-spot"
            data-active={cam.id === id}
            aria-label={`CAM ${id} – ${CAMERAS[id].name}`}
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
            onPointerDown={(ev) => {
              ev.preventDefault();
              onSelect(id);
            }}
            onKeyDown={(ev) => ev.key === "Enter" && onSelect(id)}
          />
        ))}
      </nav>
    </div>
  );
}
