# 🐱 Pico Friends — Plataforma Cooperativo (2 a 8 Jogadores) + PWA Offline

Jogo de plataforma 2D e quebra-cabeça cooperativo inspirado em *Pico Park 2*, com **15 Mundos temáticos**, suporte a **Multiplayer Online em Tempo Real (WebSockets)** e **Modo Viagem 100% Offline no Celular (PWA)** para jogar de 2 a 8 gatinhos.

---

## ✨ Principais Recursos

- **Campanha de 15 Mundos:**
  1. **World 1 — HELLO PICO PARK:** Empilhamento básico, botões de pressão, caixas pesadas e chave coletiva.
  2. **World 2 — TWO DEVICES:** Corda elástica (*Tether*) e sensor de distância máxima entre a equipe.
  3. **World 3 — FORMATION:** Escadas humanas, totens ambulantes e pontes vivas sobre espinhos.
  4. **World 4 — DANGER PARK:** Desafio de precisão (*Rage Game*) com espaço seguro reduzido.
  5. **World 5 — TIME LIMIT:** Corrida contra o relógio com logística cooperativa.
  6. **World 6 — SHOOT 'EM UP:** Ação balística e trabalho em equipe.
  7. **World 7 — STOP AND GO:** Semáforo *Batatinha Frita 1, 2, 3* (Luz Verde / Luz Vermelha).
  8. **World 8 — MINI GAMES:** Arena retrô cooperativa.
  9. **World 9 — TOP DOWN VIEW:** Labirinto tático de 4 direções.
  10. **World 10 — SKILLS OR DEVICES:** Papéis assimétricos e especialistas.
  11. **World 11 — PARKFUL DODGER:** Sobrevivência cooperativa em arena.
  12. **World 12 — GO GO GO:** Corrida contínua sem parar.
  13. **World 13 — SPECIAL PARK:** Quebra-cabeças de lógica invertida.
  14. **World 14 — HANDY GADGETS:** Engenhocas mecânicas e elevadores sincronizados.
  15. **World 15 — LAST PARK:** Exame Final combinando todas as mecânicas anteriores.

- **Modo Viagem Offline no Celular (PWA Instalável):**
  - Funciona **100% sem internet (Modo Avião)** via Service Worker (`vite-plugin-pwa`).
  - Seletor dinâmico de **2P a 8P** gatinhos na tela.
  - **3 Modos de Controle de Esquadrão:** `Seguir` (IA em comboio que ajuda a empurrar caixas e pular degraus), `Todos` (movimento uníssono) e `Solo` (controle individual para estacionar gatinhos em botões).
  - **Empilhamento com 1 Toque (`Empilhar`)** e reagrupamento rápido (`Chamar`).

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- **Node.js** 18+ instalado

### Passo a Passo

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento (Frontend Vite + Servidor Socket.IO na porta 3000)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

---

## 📦 Build para Produção

```bash
# Gera a pasta dist/ com o Service Worker (PWA) e assets otimizados
npm run build

# Inicia o servidor de produção
npm start
```

---

## 🎮 Controles no PC (Teclado) e Mobile (Touch)

- **Mobile:** Joystick Virtual (esquerda) + Botões `Pular`, `Empilhar`, `Chamar`, `Seguir/Todos/Solo` e `P1..P8` (direita).
- **Teclado (PC):**
  - `A` / `D` ou `Setas Esquerda/Direita`: Mover
  - `W` / `Espaço` / `Seta Cima`: Pular
  - `Tab` ou `Q` ou teclas `1` a `8`: Alternar qual gatinho controlar no modo Offline
  - `E`: Empilhar um gatinho amigo na sua cabeça
  - `F`: Chamar todos os gatinhos para perto de você
  - `M`: Alternar modo do esquadrão (`Seguir` / `Todos` / `Solo`)
