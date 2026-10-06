const files = import.meta.glob("../assets/sounds/*.{mp3,ogg}", { eager: true, import: "default" });

const url = (name) => {
  const entry = Object.entries(files).find(([p]) => p.split("/").pop().startsWith(name + "."));
  return entry?.[1];
};

const SOUNDS = {
  ambience: { file: "mainambience", loop: true, volume: 0.5 },
  cameraIdle: { file: "cameraidle-2", loop: true, volume: 0.35 },
  cameraToggle: { file: "put-down", volume: 0.8 },
  cameraSwitch: { file: "blip3", volume: 0.7 },
  door: { file: "door" },
  freddyLaugh1: { file: "freddylaugh1", volume: 0.7 },
  freddyLaugh2: { file: "freddylaugh2", volume: 0.7 },
  freddyLaugh3: { file: "freddylaugh3", volume: 0.7 },
  garble1: { file: "garble1", volume: 0.6 },
  garble2: { file: "garble2", volume: 0.6 },
  knock: { file: "knock2" },
  windowScare: { file: "windowscare" },
  jumpscare: { file: "jumpscare" },
  powerDown: { file: "powerdown" },
  musicBox: { file: "music-box", loop: true },
  chimes: { file: "clock" },
  dead: { file: "dead" },
  golden: { file: "golden_freddy" },
};

const STORAGE_KEY = "fnaf-web:muted";

class AudioManager {
  constructor() {
    this.elements = {};
    this.muted = readMuted();
    this.suspended = new Set();
  }

  el(name) {
    if (!this.elements[name]) {
      const def = SOUNDS[name];
      const a = new Audio(url(def.file));
      a.loop = !!def.loop;
      a.volume = def.volume ?? 1;
      a.muted = this.muted;
      a.preload = "auto";
      this.elements[name] = a;
    }
    return this.elements[name];
  }

  preload() {
    for (const name of Object.keys(SOUNDS)) this.el(name).load();
  }

  play(name, { restart = true } = {}) {
    const a = this.el(name);
    if (restart) a.currentTime = 0;
    // Navegadores podem bloquear autoplay; o jogo continua sem som.
    a.play().catch(() => {});
  }

  stop(name) {
    const a = this.elements[name];
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }

  stopAll() {
    for (const name of Object.keys(this.elements)) this.stop(name);
    this.suspended.clear();
  }

  /** Pausa tudo que está tocando e lembra o que retomar. */
  suspend() {
    for (const [name, a] of Object.entries(this.elements)) {
      if (!a.paused) {
        this.suspended.add(name);
        a.pause();
      }
    }
  }

  resume() {
    for (const name of this.suspended) this.elements[name]?.play().catch(() => {});
    this.suspended.clear();
  }

  setMuted(muted) {
    this.muted = muted;
    for (const a of Object.values(this.elements)) a.muted = muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    } catch {
      /* armazenamento indisponível */
    }
  }

  /** Traduz eventos do motor em sons. */
  handleEvent = (name) => {
    switch (name) {
      case "cameraOpen":
        this.play("cameraToggle");
        this.play("cameraIdle");
        break;
      case "cameraClose":
        this.play("cameraToggle");
        this.stop("cameraIdle");
        break;
      case "cameraSwitch":
        this.play("cameraSwitch");
        break;
      case "door":
        this.play("door");
        break;
      case "blocked":
        this.play("cameraSwitch");
        break;
      case "lightReveal":
        this.play("windowScare");
        break;
      case "disrupt":
        this.play(Math.random() < 0.5 ? "garble1" : "garble2");
        break;
      case "freddyLaugh":
        this.play(`freddyLaugh${1 + Math.floor(Math.random() * 3)}`);
        break;
      case "foxyKnock":
        this.play("knock");
        break;
      case "powerOut":
        this.stop("ambience");
        this.stop("cameraIdle");
        this.play("powerDown");
        break;
      case "musicBoxStart":
        this.play("musicBox");
        break;
      case "musicBoxStop":
        this.stop("musicBox");
        break;
      case "jumpscare":
        this.stop("musicBox");
        this.stop("cameraIdle");
        this.stop("ambience");
        this.play("jumpscare");
        break;
      case "gameOver":
        this.play("dead");
        break;
      case "victory":
        this.stopAll();
        this.play("chimes");
        break;
      case "pause":
        this.suspend();
        break;
      case "resume":
        this.resume();
        break;
      default:
        break;
    }
  };
}

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export const audio = new AudioManager();
