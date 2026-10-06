const camFiles = import.meta.glob("../assets/textures/Cams/*.webp", { eager: true, import: "default" });
const officeFiles = import.meta.glob("../assets/textures/Office/*.webp", { eager: true, import: "default" });

function byName(files) {
  const out = {};
  for (const [path, url] of Object.entries(files)) {
    out[path.split("/").pop().replace(/\.webp$/, "")] = url;
  }
  return out;
}

export const camImages = byName(camFiles);
export const officeImages = byName(officeFiles);

export { default as mapImage } from "../assets/textures/Cams/Complete_Map.png";
export { default as cameraButtonImage } from "../assets/textures/CameraButton.png";
export { default as staticImage } from "../assets/textures/Static-Cam.webp";
export { default as foxyHallwayImage } from "../assets/textures/Foxy-Hallway.webp";
export { default as freddyBlackoutImage } from "../assets/textures/Freddy.webp";
export { default as victoryImage } from "../assets/textures/Victory.gif";
export { default as goldenFreddyImage } from "../assets/textures/golden_freddy.webp";
export { default as menuBackground } from "../assets/menu-bg.webp";

import BonnieJumpscare from "../assets/textures/Bonnie-Jumpscare.webp";
import ChicaJumpscare from "../assets/textures/Chica-Jumpscare.webp";
import FreddyJumpscare from "../assets/textures/Freddy-Jumpscare.webp";
import FreddyBlackoutJumpscare from "../assets/textures/Freddy-Jumpscare1.gif";
import FoxyJumpscare from "../assets/textures/Foxy-Jumpscare.gif";

export const jumpscareImages = {
  Bonnie: BonnieJumpscare,
  Chica: ChicaJumpscare,
  Freddy: FreddyJumpscare,
  FreddyBlackout: FreddyBlackoutJumpscare,
  Foxy: FoxyJumpscare,
};

import freddyPortrait from "../assets/textures/CustomNight/freddy.png";
import bonniePortrait from "../assets/textures/CustomNight/bonnie.png";
import chicaPortrait from "../assets/textures/CustomNight/chica.png";
import foxyPortrait from "../assets/textures/CustomNight/foxy.png";

export const portraits = {
  Freddy: freddyPortrait,
  Bonnie: bonniePortrait,
  Chica: chicaPortrait,
  Foxy: foxyPortrait,
};

// Nome base do arquivo de cada câmera (a cozinha é só áudio, como no original).
const CAM_BASE = {
  "1A": "Stage",
  "1B": "DinningArea",
  "1C": "Pirate_Cove",
  "2A": "West_Hall",
  "2B": "WHallCorner",
  3: "SupplyRoom",
  "4A": "East_Hall",
  "4B": "EHallCorner",
  5: "Backstage",
  7: "Restrooms",
};

function subsets(letters) {
  const out = [];
  const n = letters.length;
  for (let mask = (1 << n) - 1; mask >= 0; mask--) {
    out.push(letters.filter((_, i) => mask & (1 << i)));
  }
  // Maiores combinações primeiro: mostra o máximo de animatrônicos que temos imagem.
  return out.sort((a, b) => b.length - a.length);
}

/**
 * Escolhe a imagem da câmera. Se não houver arte para a combinação exata
 * de animatrônicos, usa a maior combinação disponível em vez de quebrar a imagem.
 */
export function resolveCamImage(id, present = [], foxyStage = 0, images = camImages) {
  const base = CAM_BASE[id];
  if (!base) return null;
  if (id === "1C") return images[foxyStage > 0 ? `${base}-${foxyStage}` : base] ?? images[base];

  for (const combo of subsets([...present].sort())) {
    const key = combo.length ? `${base}-${combo.join("-")}` : base;
    if (images[key]) return images[key];
  }
  return images[base] ?? null;
}

/** Imagem do escritório para o estado atual de portas, luzes e visitantes. */
export function resolveOfficeImage({ doors, lights, atDoor }, images = officeImages) {
  const parts = [];
  if (doors.right) parts.push("RD");
  if (doors.left) parts.push("LD");
  if (lights.right && !doors.right) parts.push("RL");
  if (lights.left && !doors.left) parts.push("LL");
  if (atDoor.left && lights.left && !doors.left) parts.push("BONNIE");
  if (atDoor.right && lights.right && !doors.right) parts.push("CHICA");
  if (!parts.length) return images.Default;
  return images[parts.join("_")] ?? images.Default;
}

export const allPreloadImages = [
  ...Object.values(camImages),
  ...Object.values(officeImages),
  ...Object.values(jumpscareImages),
];
