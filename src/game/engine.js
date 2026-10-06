import {
  AI_BUMPS,
  CHARACTERS,
  DISRUPT_MS,
  FOXY_RUN_MS,
  FOXY_SEEN_RUN_MS,
  FREDDY_PATH,
  HOUR_MS,
  JUMPSCARE_MS,
  MAX_AI,
  MOVE_INTERVAL,
  MS_PER_PERCENT_AT_USAGE_1,
  NIGHT_HOURS,
  OFFICE_FORCE_MS,
  ROUTES,
  SIDE_OF,
  SWITCH_STATIC_MS,
} from "./constants";

const LETTER = { Bonnie: "b", Chica: "c", Freddy: "f" };

export function createInitialState(levels) {
  const ai = {};
  for (const c of CHARACTERS) ai[c] = clampAi(levels?.[c] ?? 0);

  return {
    status: "playing", // playing | jumpscare | lost | won
    paused: false,
    elapsed: 0,
    hour: 0,
    power: 100,
    foxyKnocks: 0,
    doors: { left: false, right: false },
    lights: { left: false, right: false },
    camera: { open: false, id: "1A", switchMs: 0, disruptMs: 0 },
    ai,
    anim: {
      Freddy: { loc: "1A", timer: 0, officeMs: 0 },
      Bonnie: { loc: "1A", timer: 0, officeMs: 0 },
      Chica: { loc: "1A", timer: 0, officeMs: 0 },
      Foxy: { stage: 0, timer: 0, runMs: null },
    },
    blackout: null, // { phase: "wait" | "musicbox" | "dark", ms }
    jumpscare: null, // { who, ms }
  };
}

function clampAi(v) {
  return Math.max(0, Math.min(MAX_AI, Math.round(Number(v) || 0)));
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length) % list.length];
}

function randRange(min, max, rng) {
  return min + rng() * (max - min);
}

/**
 * Motor do jogo. Todo o tempo é avançado por update(dt), então pausar,
 * reiniciar e testar é determinístico — não existe setTimeout/setInterval aqui.
 */
export class GameEngine {
  constructor({ levels, rng = Math.random, onEvent = () => {}, hourMs = HOUR_MS } = {}) {
    this.rng = rng;
    this.onEvent = onEvent;
    this.hourMs = hourMs;
    this.state = createInitialState(levels);
    this.listeners = new Set();
    this.view = null;
    this.viewKey = "";
    this.refreshView();
  }

  // ---------- assinatura (useSyncExternalStore) ----------

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getView = () => this.view;

  emit(name, payload) {
    this.onEvent(name, payload);
  }

  refreshView() {
    const view = buildView(this.state);
    const key = JSON.stringify(view);
    if (key === this.viewKey) return;
    this.viewKey = key;
    this.view = view;
    for (const fn of this.listeners) fn();
  }

  // ---------- ações do jogador ----------

  get canAct() {
    const s = this.state;
    return s.status === "playing" && !s.paused && !s.blackout;
  }

  sideBlocked(side) {
    const { anim } = this.state;
    return (
      (side === "left" && anim.Bonnie.loc === "office") ||
      (side === "right" && anim.Chica.loc === "office")
    );
  }

  toggleDoor(side) {
    if (!this.canAct || this.state.camera.open) return;
    if (this.sideBlocked(side)) return this.emit("blocked", side);
    const s = this.state;
    s.doors[side] = !s.doors[side];
    if (s.doors[side]) s.lights[side] = false;
    this.emit("door", side);
    this.refreshView();
  }

  toggleLight(side) {
    if (!this.canAct || this.state.camera.open) return;
    if (this.sideBlocked(side)) return this.emit("blocked", side);
    const s = this.state;
    if (s.doors[side]) return;
    const on = !s.lights[side];
    s.lights = { left: false, right: false };
    s.lights[side] = on;
    if (on && this.atDoor(side)) this.emit("lightReveal", side);
    this.emit(on ? "lightOn" : "lightOff", side);
    this.refreshView();
  }

  atDoor(side) {
    const { anim } = this.state;
    return side === "left" ? anim.Bonnie.loc === "door" : anim.Chica.loc === "door";
  }

  toggleCamera() {
    if (!this.canAct) return;
    const cam = this.state.camera;
    cam.open = !cam.open;
    if (cam.open) {
      this.state.lights = { left: false, right: false };
      cam.switchMs = SWITCH_STATIC_MS;
    }
    this.emit(cam.open ? "cameraOpen" : "cameraClose");
    if (!cam.open) this.checkOfficeAttack();
    this.refreshView();
  }

  selectCamera(id) {
    if (!this.canAct || !this.state.camera.open) return;
    const cam = this.state.camera;
    if (cam.id === String(id)) return;
    cam.id = String(id);
    cam.switchMs = SWITCH_STATIC_MS;
    cam.disruptMs = 0;
    this.emit("cameraSwitch", cam.id);
    this.refreshView();
  }

  setPaused(paused) {
    if (this.state.status !== "playing") return;
    if (this.state.paused === paused) return;
    this.state.paused = paused;
    this.emit(paused ? "pause" : "resume");
    this.refreshView();
  }

  // ---------- simulação ----------

  update(dt) {
    const s = this.state;
    if (s.paused || s.status === "lost" || s.status === "won") return;
    dt = Math.max(0, Math.min(dt, 250));

    if (s.status === "jumpscare") {
      s.jumpscare.ms += dt;
      if (s.jumpscare.ms >= JUMPSCARE_MS) {
        s.status = "lost";
        this.emit("gameOver", s.jumpscare.who);
      }
      return this.refreshView();
    }

    this.updateClock(dt);
    if (s.status !== "playing") return this.refreshView();

    s.camera.switchMs = Math.max(0, s.camera.switchMs - dt);
    s.camera.disruptMs = Math.max(0, s.camera.disruptMs - dt);

    if (s.blackout) {
      this.updateBlackout(dt);
      return this.refreshView();
    }

    this.updatePower(dt);
    if (s.blackout) return this.refreshView();

    this.updateBonnieChica("Bonnie", dt);
    this.updateBonnieChica("Chica", dt);
    this.updateFreddy(dt);
    this.updateFoxy(dt);
    this.updateOfficeIntruders(dt);

    this.refreshView();
  }

  updateClock(dt) {
    const s = this.state;
    s.elapsed += dt;
    const hour = Math.min(NIGHT_HOURS, Math.floor(s.elapsed / this.hourMs));
    while (s.hour < hour) {
      s.hour += 1;
      const bump = AI_BUMPS[s.hour];
      if (bump) for (const [c, v] of Object.entries(bump)) s.ai[c] = clampAi(s.ai[c] + v);
      if (s.hour >= NIGHT_HOURS) {
        s.status = "won";
        s.camera.open = false;
        this.emit("victory");
        return;
      }
      this.emit("hour", s.hour);
    }
  }

  usage() {
    const s = this.state;
    return (
      1 +
      (s.doors.left ? 1 : 0) +
      (s.doors.right ? 1 : 0) +
      (s.lights.left ? 1 : 0) +
      (s.lights.right ? 1 : 0) +
      (s.camera.open ? 1 : 0)
    );
  }

  updatePower(dt) {
    const s = this.state;
    s.power -= (dt * this.usage()) / MS_PER_PERCENT_AT_USAGE_1;
    if (s.power <= 0) this.startBlackout();
  }

  startBlackout() {
    const s = this.state;
    s.power = 0;
    s.doors = { left: false, right: false };
    s.lights = { left: false, right: false };
    if (s.camera.open) {
      s.camera.open = false;
      this.emit("cameraClose");
    }
    s.blackout = { phase: "wait", ms: randRange(3_000, 15_000, this.rng) };
    this.emit("powerOut");
  }

  updateBlackout(dt) {
    const b = this.state.blackout;
    b.ms -= dt;
    if (b.ms > 0) return;
    if (b.phase === "wait") {
      this.state.blackout = { phase: "musicbox", ms: randRange(5_000, 20_000, this.rng) };
      this.emit("musicBoxStart");
    } else if (b.phase === "musicbox") {
      this.state.blackout = { phase: "dark", ms: randRange(2_000, 15_000, this.rng) };
      this.emit("musicBoxStop");
    } else {
      this.triggerJumpscare("Freddy");
    }
  }

  /** Roda o "dado" do original: move se 1..20 <= IA. */
  roll(character, dt) {
    const a = this.state.anim[character];
    a.timer += dt;
    if (a.timer < MOVE_INTERVAL[character]) return false;
    a.timer -= MOVE_INTERVAL[character];
    const ai = this.state.ai[character];
    return ai > 0 && Math.floor(this.rng() * 20) + 1 <= ai;
  }

  moveTo(character, to) {
    const a = this.state.anim[character];
    const from = a.loc;
    a.loc = to;
    const cam = this.state.camera;
    if (cam.open && (cam.id === from || cam.id === to)) {
      cam.disruptMs = DISRUPT_MS;
      this.emit("disrupt", character);
    }
    if (to === "office") a.officeMs = 0;
  }

  updateBonnieChica(character, dt) {
    const a = this.state.anim[character];
    if (a.loc === "office") return;
    if (!this.roll(character, dt)) return;

    const side = SIDE_OF[character];
    if (a.loc === "door") {
      if (this.state.doors[side]) {
        // Porta fechada: desiste e volta para o salão.
        this.moveTo(character, character === "Bonnie" ? pick(["1B", "5"], this.rng) : "1B");
        if (this.state.lights[side]) this.state.lights[side] = false;
      } else if (this.state.camera.open) {
        // Entra enquanto você está olhando as câmeras.
        this.state.lights[side] = false;
        this.moveTo(character, "office");
      }
      return;
    }

    const options = ROUTES[character][a.loc];
    if (!options) return;
    this.moveTo(character, pick(options, this.rng));
  }

  updateFreddy(dt) {
    const s = this.state;
    const f = s.anim.Freddy;
    if (f.loc === "office") return;
    if (!this.roll("Freddy", dt)) return;

    // Freddy não se move enquanto está sendo observado.
    if (s.camera.open && s.camera.id === f.loc) return;
    // Só sai do palco depois de Bonnie e Chica.
    if (f.loc === "1A" && (s.anim.Bonnie.loc === "1A" || s.anim.Chica.loc === "1A")) return;

    if (f.loc === "4B") {
      if (s.doors.right) {
        this.moveTo("Freddy", "4A");
        this.emit("freddyLaugh");
      } else if (s.camera.open) {
        this.moveTo("Freddy", "office");
      }
      return;
    }

    const next = FREDDY_PATH[FREDDY_PATH.indexOf(f.loc) + 1];
    if (!next) return;
    this.moveTo("Freddy", next);
    this.emit("freddyLaugh");
  }

  updateFoxy(dt) {
    const s = this.state;
    const fx = s.anim.Foxy;

    if (fx.runMs !== null) {
      if (s.camera.open && s.camera.id === "2A") fx.runMs = Math.min(fx.runMs, FOXY_SEEN_RUN_MS);
      fx.runMs -= dt;
      if (fx.runMs > 0) return;
      fx.runMs = null;
      if (s.doors.left) {
        const drain = 1 + 5 * s.foxyKnocks;
        s.foxyKnocks += 1;
        s.power = Math.max(0, s.power - drain);
        fx.stage = Math.floor(this.rng() * 2);
        fx.timer = 0;
        this.emit("foxyKnock", drain);
        if (s.power <= 0) this.startBlackout();
      } else {
        this.triggerJumpscare("Foxy");
      }
      return;
    }

    // Foxy fica parado enquanto você olha as câmeras.
    if (s.camera.open) {
      fx.timer = 0;
      return;
    }
    if (!this.roll("Foxy", dt)) return;
    fx.stage += 1;
    if (fx.stage >= 3) {
      fx.stage = 3;
      fx.runMs = FOXY_RUN_MS;
    }
  }

  updateOfficeIntruders(dt) {
    const s = this.state;
    for (const c of ["Bonnie", "Chica", "Freddy"]) {
      const a = s.anim[c];
      if (a.loc !== "office") continue;
      if (!s.camera.open) return this.triggerJumpscare(c);
      a.officeMs += dt;
      if (a.officeMs >= OFFICE_FORCE_MS) {
        s.camera.open = false;
        this.emit("cameraClose");
        return this.triggerJumpscare(c);
      }
    }
  }

  checkOfficeAttack() {
    for (const c of ["Bonnie", "Chica", "Freddy"]) {
      if (this.state.anim[c].loc === "office") return this.triggerJumpscare(c);
    }
  }

  triggerJumpscare(who) {
    const s = this.state;
    if (s.status !== "playing") return;
    s.status = "jumpscare";
    s.jumpscare = { who, ms: 0 };
    s.camera.open = false;
    s.lights = { left: false, right: false };
    this.emit("jumpscare", who);
    this.refreshView();
  }
}

/** Snapshot pequeno e serializável que a interface usa para desenhar. */
export function buildView(s) {
  const cam = s.camera;
  const present = [];
  for (const c of ["Bonnie", "Chica", "Freddy"]) if (s.anim[c].loc === cam.id) present.push(LETTER[c]);
  const fx = s.anim.Foxy;

  return {
    status: s.status,
    paused: s.paused,
    hour: s.hour,
    power: Math.max(0, Math.ceil(s.power)),
    usage: s.blackout
      ? 0
      : 1 +
        +s.doors.left +
        +s.doors.right +
        +s.lights.left +
        +s.lights.right +
        +cam.open,
    doors: { ...s.doors },
    lights: { ...s.lights },
    blocked: {
      left: s.anim.Bonnie.loc === "office",
      right: s.anim.Chica.loc === "office",
    },
    atDoor: {
      left: s.anim.Bonnie.loc === "door",
      right: s.anim.Chica.loc === "door",
    },
    camera: {
      open: cam.open,
      id: cam.id,
      switching: cam.switchMs > 0,
      disrupted: cam.disruptMs > 0,
      present: present.sort(),
      foxyStage: fx.stage,
      foxyRunning: fx.runMs !== null && fx.runMs <= FOXY_SEEN_RUN_MS,
    },
    blackout: s.blackout ? s.blackout.phase : null,
    jumpscare: s.jumpscare ? s.jumpscare.who : null,
  };
}
