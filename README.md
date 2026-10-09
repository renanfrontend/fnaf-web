# Five Nights at Freddy's Web — Remaster

[![Testes e deploy](https://github.com/renanfrontend/fnaf-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/renanfrontend/fnaf-web/actions/workflows/deploy.yml)

**Demo:** https://renanfrontend.github.io/fnaf-web/

> Five Nights at Freddy's © Scott Cawthon. Projeto de fã, sem fins lucrativos e sem afiliação com o criador. Veja [Licença e direitos autorais](#licença-e-direitos-autorais).

![Menu do Five Nights at Freddy's Web com Freddy, Bonnie, Chica e Foxy e o botão Começar](docs/screenshot.png)

Versão web de **Five Nights at Freddy's**, feita em React. Sobreviva das 12 AM às 6 AM vigiando as câmeras, fechando as portas e economizando energia.

## Como jogar

| Tecla | Ação |
| --- | --- |
| `A` / `D` | Porta esquerda / direita |
| `Q` / `E` | Luz esquerda / direita |
| `S` ou `Espaço` | Abrir/fechar câmeras (ou passe o mouse na barra inferior) |
| `←` / `→` | Câmera anterior / próxima |
| `Esc` ou `P` | Pausar |
| `M` | Som liga/desliga |

Mova o mouse para os lados para olhar o escritório. No celular, toque nos botões e na barra das câmeras (em modo paisagem).

- **Bonnie** vem pela esquerda e **Chica** pela direita: acenda a luz e, se aparecer alguém, feche a porta. Se eles entrarem enquanto você olha as câmeras, a porta e a luz daquele lado param de funcionar.
- **Freddy** só sai do palco depois dos dois, não anda enquanto você olha para ele e chega pela direita.
- **Foxy** sai da Pirate Cove (CAM 1C) se você não olhar as câmeras. Quando ele some, ele corre pelo corredor oeste (CAM 2A). Cada batida na porta fechada gasta mais energia.
- Sem energia, tudo apaga… e chegar às 6 AM no escuro ainda conta como vitória.

Os modos Fácil/Normal/Difícil/4-20 dão uma ⭐ quando vencidos. A noite customizada (0–20 por animatrônico) guarda o seu recorde. Tem um easter egg escondido nos números 1-9-8-7.

## Stack

React 18 · Vite 6 · JavaScript · Vitest 3 · GitHub Actions + GitHub Pages. Sem bibliotecas de estado: o motor do jogo expõe `subscribe`/`getView` e a interface lê o estado com `useSyncExternalStore`.

## Arquitetura

```
src/
  game/        motor (engine.js), constantes, áudio, assets e progresso
  components/  Menu, Game, Office, CameraView, Hud, Overlays
  assets/      texturas e sons
```

Decisões que valem a leitura:

- **Motor baseado em ticks** (`src/game/engine.js`), sem `setTimeout`: dá para pausar, reiniciar e testar de forma determinística. Tem **20 testes automatizados** (Vitest).
- **Estado fora do React.** O motor é a única fonte da verdade; os componentes só assinam a visão atual e enviam comandos (portas, luzes, câmeras).
- **Comportamento fiel ao original:** rotas aleatórias, dificuldade crescente durante a noite, Freddy que não anda enquanto é observado, Foxy correndo no corredor e drenando energia, e blecaute em 3 fases com a caixinha de música.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
```

| Script | O que faz |
| --- | --- |
| `npm test` | Testes do motor (Vitest) |
| `npm run build` | Gera `dist/` |
| `npm run preview` | Serve o build local |

Cada push na `main` roda os testes e publica no GitHub Pages (`.github/workflows/deploy.yml`).

## O que mudou nesta versão (4.0)

**Correções**
- O projeto não rodava mais: `react-scripts 3.4` não funciona com o Node atual. Migrado para **Vite 6 + React 18**.
- Os reducers do Redux mutavam o estado. Por isso a tela às vezes não atualizava (imagem do escritório, portas).
- Timers de hora, energia e animatrônicos nunca eram limpos. Ao jogar de novo, a noite anterior continuava rodando por baixo: o relógio e a energia andavam em dobro e animatrônicos "fantasmas" atacavam.
- Os animatrônicos liam o estado de quando o jogo começou, então nunca percebiam que já estavam na porta.
- Bonnie e Chica só atacavam se você abrisse e fechasse a câmera: sem olhar as câmeras, você ficava invencível.
- Combinações de animatrônicos sem imagem (ex.: Bonnie + Chica no palco) deixavam a câmera quebrada.
- O easter egg do Golden Freddy fechava a aba do navegador; agora ele volta ao menu.
- O `alert()` de "gire o celular" foi trocado por um aviso em tela, e o ícone do GitHub vindo de outro site foi removido.

**Melhorias**
- Motor de jogo novo, no lugar do Redux e dos timers soltos (veja [Arquitetura](#arquitetura)).
- Escritório panorâmico que segue o mouse, câmeras com movimento, estática e nome da câmera, e a cozinha "AUDIO ONLY".
- HUD com energia, barras de uso e noite atual.
- Pausa (`Esc`), pausa automática ao trocar de aba, atalhos de teclado, botão de som e telas de Game Over e vitória com "Tentar de novo".
- Botões acessíveis (navegação por teclado, `aria-label`) e suporte a `prefers-reduced-motion`.
- Progresso salvo no navegador (estrelas antigas são migradas).
- Deploy automático no GitHub Pages a cada push na `main`.

## Autoria

Remaster 2026 por **Renan Augusto dos Santos** ([renanaugusto.com.br](https://renanaugusto.com.br) · [contato@renanaugusto.com.br](mailto:contato@renanaugusto.com.br)): diagnóstico e correção dos bugs, reescrita do motor, testes automatizados, acessibilidade e deploy contínuo.

## Licença e direitos autorais

Five Nights at Freddy's, seus personagens, imagens e sons são © Scott Cawthon. Este é um projeto de fã, sem fins lucrativos e sem afiliação com o criador. O repositório não tem licença de código aberto e não concede nenhum direito sobre a marca ou o conteúdo do jogo; o código está público para estudo e avaliação de portfólio. Dúvidas ou pedidos de remoção: [contato@renanaugusto.com.br](mailto:contato@renanaugusto.com.br).

---

## 🇺🇸 English

A browser remaster of a **Five Nights at Freddy's** fan game, by **Renan Augusto dos Santos**: survive from 12 AM to 6 AM by watching the cameras, closing the doors and saving power. Built with React 18 and Vite 6, with a new tick-based game engine (pausable, restartable and covered by 20 Vitest tests), keyboard shortcuts, accessibility improvements and continuous deployment to GitHub Pages.

Five Nights at Freddy's © Scott Cawthon. This is a non-profit fan project, not affiliated with the creator. The repository has no open source license and grants no rights to the game's brand or content; the source is public for study and portfolio evaluation. Contact: [contato@renanaugusto.com.br](mailto:contato@renanaugusto.com.br).
