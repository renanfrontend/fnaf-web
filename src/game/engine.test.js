import { describe, expect, it } from "vitest";
import { GameEngine } from "./engine";
import { FOXY_RUN_MS, JUMPSCARE_MS, MOVE_INTERVAL, NIGHT_HOURS } from "./constants";
import { resolveCamImage, resolveOfficeImage } from "./assets";

const ZERO = { Freddy: 0, Bonnie: 0, Chica: 0, Foxy: 0 };

function engine(levels = ZERO, opts = {}) {
  const events = [];
  const e = new GameEngine({
    levels,
    rng: opts.rng ?? (() => 0), // 0 → rolagem 1, sempre move se IA > 0
    hourMs: opts.hourMs ?? 1_000,
    onEvent: (name, payload) => events.push([name, payload]),
  });
  return { e, events };
}

function run(e, ms, step = 50) {
  for (let t = 0; t < ms; t += step) e.update(step);
}

describe("relógio e energia", () => {
  it("vence às 6 AM", () => {
    const { e, events } = engine();
    run(e, NIGHT_HOURS * 1_000 + 100);
    expect(e.state.status).toBe("won");
    expect(events.some(([n]) => n === "victory")).toBe(true);
  });

  it("gasta mais energia com mais coisas ligadas", () => {
    const a = engine(ZERO, { hourMs: 1e9 }).e;
    const b = engine(ZERO, { hourMs: 1e9 }).e;
    b.toggleDoor("left");
    b.toggleDoor("right");
    run(a, 10_000);
    run(b, 10_000);
    expect(100 - b.state.power).toBeCloseTo(3 * (100 - a.state.power), 5);
  });

  it("acaba a energia, abre portas e o Freddy ataca", () => {
    const { e, events } = engine(ZERO, { hourMs: 1e9, rng: () => 0.5 });
    e.state.power = 0.01;
    e.toggleDoor("left");
    run(e, 100);
    expect(e.state.blackout).not.toBeNull();
    expect(e.state.doors.left).toBe(false);
    e.toggleDoor("left");
    expect(e.state.doors.left).toBe(false); // sem energia, nada funciona
    run(e, 60_000);
    expect(e.state.status).toBe("lost");
    expect(events.find(([n]) => n === "jumpscare")[1]).toBe("Freddy");
  });

  it("chegar às 6 AM durante o blecaute ainda vence", () => {
    const { e } = engine(ZERO, { hourMs: 1_000, rng: () => 0.99 });
    e.state.power = 0.01;
    run(e, NIGHT_HOURS * 1_000 + 100);
    expect(e.state.status).toBe("won");
  });

  it("a pausa congela o tempo", () => {
    const { e } = engine();
    e.setPaused(true);
    run(e, 5_000);
    expect(e.state.elapsed).toBe(0);
    expect(e.state.power).toBe(100);
  });
});

describe("portas e luzes", () => {
  it("fechar a porta apaga a luz daquele lado e só uma luz acende por vez", () => {
    const { e } = engine();
    e.toggleLight("left");
    e.toggleLight("right");
    expect(e.state.lights).toEqual({ left: false, right: true });
    e.toggleDoor("right");
    expect(e.state.lights.right).toBe(false);
    e.toggleLight("right");
    expect(e.state.lights.right).toBe(false);
  });

  it("não mexe em portas com a câmera aberta", () => {
    const { e } = engine();
    e.toggleCamera();
    e.toggleDoor("left");
    expect(e.state.doors.left).toBe(false);
  });
});

describe("Bonnie", () => {
  it("volta para o salão se a porta estiver fechada", () => {
    const { e } = engine({ ...ZERO, Bonnie: 20 }, { hourMs: 1e9 });
    e.state.anim.Bonnie.loc = "door";
    e.toggleDoor("left");
    run(e, MOVE_INTERVAL.Bonnie + 10);
    expect(["1B", "5"]).toContain(e.state.anim.Bonnie.loc);
  });

  it("entra com a câmera aberta e ataca ao baixar a câmera", () => {
    const { e, events } = engine({ ...ZERO, Bonnie: 20 }, { hourMs: 1e9 });
    e.state.anim.Bonnie.loc = "door";
    e.toggleCamera();
    run(e, MOVE_INTERVAL.Bonnie + 10);
    expect(e.state.anim.Bonnie.loc).toBe("office");
    e.toggleCamera(); // fecha
    expect(e.state.status).toBe("jumpscare");
    expect(events.find(([n]) => n === "jumpscare")[1]).toBe("Bonnie");
    run(e, JUMPSCARE_MS + 100);
    expect(e.state.status).toBe("lost");
  });

  it("dentro do escritório trava a porta e a luz da esquerda", () => {
    const { e } = engine({ ...ZERO, Bonnie: 20 }, { hourMs: 1e9 });
    e.state.anim.Bonnie.loc = "office";
    e.state.camera.open = false;
    e.toggleDoor("left");
    expect(e.state.doors.left).toBe(false);
  });

  it("IA 0 nunca se move", () => {
    const { e } = engine(ZERO, { hourMs: 1e9 });
    run(e, 60_000);
    expect(e.state.anim.Bonnie.loc).toBe("1A");
    expect(e.state.anim.Chica.loc).toBe("1A");
  });
});

describe("Freddy", () => {
  it("não sai do palco antes de Bonnie e Chica", () => {
    const { e } = engine({ ...ZERO, Freddy: 20 }, { hourMs: 1e9 });
    run(e, 30_000);
    expect(e.state.anim.Freddy.loc).toBe("1A");
  });

  it("não se move enquanto está sendo observado", () => {
    const { e } = engine({ ...ZERO, Freddy: 20 }, { hourMs: 1e9 });
    e.state.anim.Bonnie.loc = "5";
    e.state.anim.Chica.loc = "7";
    e.state.anim.Freddy.loc = "1B";
    e.toggleCamera();
    e.selectCamera("1B");
    run(e, 30_000);
    expect(e.state.anim.Freddy.loc).toBe("1B");
  });
});

describe("Foxy", () => {
  it("bate na porta fechada e drena energia crescente", () => {
    const { e, events } = engine({ ...ZERO, Foxy: 20 }, { hourMs: 1e9 });
    e.state.anim.Foxy.stage = 3;
    e.state.anim.Foxy.runMs = 100;
    e.toggleDoor("left");
    const before = e.state.power;
    run(e, 200);
    expect(events.some(([n]) => n === "foxyKnock")).toBe(true);
    expect(before - e.state.power).toBeGreaterThanOrEqual(1);
    expect(e.state.foxyKnocks).toBe(1);
  });

  it("corre em seguida se você olhar a CAM 2A", () => {
    const { e } = engine({ ...ZERO, Foxy: 20 }, { hourMs: 1e9 });
    e.state.anim.Foxy.stage = 3;
    e.state.anim.Foxy.runMs = FOXY_RUN_MS;
    e.toggleCamera();
    e.selectCamera("2A");
    run(e, 2_000);
    expect(e.state.status).toBe("jumpscare");
  });

  it("não avança enquanto a câmera está aberta", () => {
    const { e } = engine({ ...ZERO, Foxy: 20 }, { hourMs: 1e9 });
    e.toggleCamera();
    run(e, 60_000);
    expect(e.state.anim.Foxy.stage).toBe(0);
  });
});

describe("imagens", () => {
  const images = { Stage: "s", "Stage-b-c-f": "bcf", "Stage-f": "f", EHallCorner: "e", "EHallCorner-f": "ef" };

  it("usa a combinação exata quando existe", () => {
    expect(resolveCamImage("1A", ["b", "c", "f"], 0, images)).toBe("bcf");
  });

  it("cai para a maior combinação disponível", () => {
    expect(resolveCamImage("4B", ["c", "f"], 0, images)).toBe("ef");
    expect(resolveCamImage("4B", [], 0, images)).toBe("e");
  });

  it("cozinha não tem vídeo", () => {
    expect(resolveCamImage("6", ["c"], 0, images)).toBeNull();
  });

  it("escritório mostra Bonnie só com a luz acesa", () => {
    const office = { Default: "d", LL: "ll", LL_BONNIE: "llb" };
    const base = { doors: { left: false, right: false }, lights: { left: false, right: false } };
    expect(resolveOfficeImage({ ...base, atDoor: { left: true, right: false } }, office)).toBe("d");
    expect(
      resolveOfficeImage({ ...base, lights: { left: true, right: false }, atDoor: { left: true, right: false } }, office)
    ).toBe("llb");
  });
});
