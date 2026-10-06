import { useState } from "react";
import { CHARACTERS, MAX_AI, PRESETS } from "../game/constants";
import { menuBackground, portraits } from "../game/assets";
import { loadProgress } from "../game/progress";

const MODE_LABEL = { EASY: "Fácil", NORMAL: "Normal", HARD: "Difícil", IMPOSSIBLE: "4/20" };

export const REPO_URL = "https://github.com/renanfrontend/fnaf-web";

export default function Menu({ config, setConfig, onStart, muted, onToggleMute }) {
  const [showHelp, setShowHelp] = useState(false);
  const progress = loadProgress();
  const total = CHARACTERS.reduce((sum, c) => sum + config.levels[c], 0);

  const changeLevel = (character, delta) => {
    setConfig((prev) => {
      const value = Math.max(0, Math.min(MAX_AI, prev.levels[character] + delta));
      return { mode: "CUSTOM", levels: { ...prev.levels, [character]: value } };
    });
  };

  const choosePreset = (mode) => setConfig({ mode, levels: { ...PRESETS[mode] } });

  return (
    <div className="menu" style={{ backgroundImage: `url(${menuBackground})` }}>
      <div className="menu-inner">
        <header className="menu-header">
          <h1>Five Nights at Freddy&apos;s <span>Web</span></h1>
          <div className="menu-tools">
            <button className="icon-button" onClick={onToggleMute} aria-label={muted ? "Ativar som" : "Desativar som"}>
              {muted ? "🔇" : "🔊"}
            </button>
            <button className="icon-button" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp}>
              ?
            </button>
          </div>
        </header>

        {showHelp ? <Help /> : null}

        <section className="animatronics" aria-label="Dificuldade de cada animatrônico">
          {CHARACTERS.map((c) => (
            <div className="animatronic-card" key={c}>
              <img src={portraits[c]} alt={c} draggable="false" />
              <span className="animatronic-name">{c}</span>
              <div className="level">
                <button onClick={() => changeLevel(c, -1)} disabled={config.levels[c] === 0} aria-label={`Diminuir ${c}`}>
                  ‹
                </button>
                <output aria-label={`Nível de ${c}`}>{config.levels[c]}</output>
                <button onClick={() => changeLevel(c, +1)} disabled={config.levels[c] === MAX_AI} aria-label={`Aumentar ${c}`}>
                  ›
                </button>
              </div>
            </div>
          ))}
        </section>

        <button className="ready" onClick={onStart}>
          COMEÇAR ▶
        </button>

        <nav className="modes" aria-label="Modos prontos">
          {Object.keys(PRESETS).map((mode) => (
            <button key={mode} data-selected={config.mode === mode} onClick={() => choosePreset(mode)}>
              {MODE_LABEL[mode]} {progress.stars[mode] ? <span className="star">★</span> : null}
            </button>
          ))}
        </nav>

        <p className="custom-info">
          {config.mode === "CUSTOM" ? `Noite customizada · soma de IA ${total}` : `Modo ${MODE_LABEL[config.mode]}`}
          {progress.bestCustom ? ` · recorde customizado: ${progress.bestCustom}/80` : ""}
        </p>

        <footer className="menu-footer">
          <p>
            Original por Wendell de Sousa (2021) · Remaster 2026 ·{" "}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              código no GitHub
            </a>
          </p>
          <p className="legal">Five Nights at Freddy&apos;s © Scott Cawthon. Projeto de fã, sem fins lucrativos.</p>
        </footer>
      </div>
    </div>
  );
}

function Help() {
  return (
    <section className="help">
      <h2>Como jogar</h2>
      <p>
        Sobreviva das 12 AM às 6 AM. Feche as portas e use as luzes para ver quem está do lado de fora, mas
        cuidado: tudo que fica ligado consome energia. Sem energia, as portas se abrem…
      </p>
      <ul>
        <li><b>Bonnie</b> vem pela esquerda e <b>Chica</b> pela direita. Se a luz mostrar alguém, feche a porta.</li>
        <li><b>Freddy</b> não se move enquanto você olha para ele e chega pela direita.</li>
        <li><b>Foxy</b> sai da Pirate Cove se você esquecer dele. Ele corre pelo corredor oeste (CAM 2A).</li>
      </ul>
      <h3>Controles</h3>
      <table>
        <tbody>
          <tr><td><kbd>A</kbd> / <kbd>D</kbd></td><td>Porta esquerda / direita</td></tr>
          <tr><td><kbd>Q</kbd> / <kbd>E</kbd></td><td>Luz esquerda / direita</td></tr>
          <tr><td><kbd>S</kbd> ou <kbd>Espaço</kbd></td><td>Abrir / fechar câmeras (ou passe o mouse na barra inferior)</td></tr>
          <tr><td><kbd>←</kbd> / <kbd>→</kbd></td><td>Câmera anterior / próxima</td></tr>
          <tr><td><kbd>Esc</kbd> ou <kbd>P</kbd></td><td>Pausar</td></tr>
          <tr><td><kbd>M</kbd></td><td>Som liga/desliga</td></tr>
        </tbody>
      </table>
    </section>
  );
}
