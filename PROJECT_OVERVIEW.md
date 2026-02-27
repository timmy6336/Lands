# Lands — Full Project Overview

> **Version:** 0.5.4 | **Stack:** React + TypeScript + Vite · Node.js + Express + Socket.io · Electron

---

## Table of Contents

1. [What Is Lands?](#1-what-is-lands)
2. [Game Rules Summary](#2-game-rules-summary)
3. [Architecture Overview](#3-architecture-overview)
4. [System Breakdown](#4-system-breakdown)
   - [Shared Package](#41-shared-package)
   - [Server Package](#42-server-package)
   - [Client Package](#43-client-package)
   - [Electron Package](#44-electron-package)
5. [File-by-File Reference](#5-file-by-file-reference)
   - [Root](#51-root)
   - [shared/](#52-shared)
   - [server/src/](#53-serversrc)
   - [server/src/game/](#54-serversrcgame)
   - [server/src/ai/](#55-serversrcai)
   - [electron/](#56-electron)
   - [client/src/](#57-clientsrc)
   - [client/src/hooks/](#58-clientsrchooks)
   - [client/src/components/](#59-clientsrccomponents)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [State Machine](#7-state-machine)
8. [AI System Deep Dive](#8-ai-system-deep-dive)
9. [Database Schema](#9-database-schema)
10. [Build & Deploy](#10-build--deploy)

---

## 1. What Is Lands?

Lands is a 2-player strategic card game available as a **portable Windows desktop application** (packaged via Electron) and optionally as a **browser-accessible web game** served from a dedicated Node.js backend.

Players build a deck of 25 cards — 5 copies each of 5 colored land types — and compete to be the first to achieve a **5-of-a-kind** (5 lands of the same color) or a **Rainbow** (all 5 colors on their field). The game includes a real-time counter/counter-counter chain, distinct per-color land effects, and an optional AI opponent with three difficulty levels.

---

## 2. Game Rules Summary

| Concept | Details |
|---------|---------|
| **Deck** | 25 cards: 5 each of White, Red, Blue, Green, Black |
| **Starting hand** | 5 cards |
| **Turn** | Active player plays 1 card → counter window → effect resolves → opponent draws |
| **Win: 5-of-a-kind** | 5 or more cards of the same color on your field |
| **Win: Rainbow** | At least 1 of each of the 5 colors on your field |

### Land Effects

| Color | Effect |
|-------|--------|
| **White** | Draw a card |
| **Red** | Destroy one opponent field land (target chosen before counter window) |
| **Blue** | Peek at the top card of your deck — keep it or send it to the bottom |
| **Green** | Retrieve a card from your graveyard back to your hand (target chosen before counter window) |
| **Black** | Force opponent to reveal 3 hand cards, then you discard one of them |

### Counter System

- **Counter**: Defender spends 1 Blue + 1 card matching the played land's color — the land is negated and sent to attacker's graveyard.
- **Counter-counter**: Attacker spends 2 Blue cards to negate the counter. Their land resolves normally.
- **Countering Blue**: Requires 2 Blue cards (both the Blue and the "matching" card are Blue).
- The counter window has a configurable time limit (default 15 seconds) or can be set to infinite with a manual Pass button.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Electron Shell                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │          React Frontend (Vite / TS)             │    │
│  │   App.tsx → hooks → components                  │    │
│  └──────────────┬─────────────────────────────────-┘    │
│                 │  IPC (contextBridge)                   │
│  ┌──────────────▼──────────────────────────────────┐    │
│  │          Electron Main Process                  │    │
│  │   BrowserWindow + IPC handlers                  │    │
│  └──────────────┬──────────────────────────────────┘    │
└─────────────────┼───────────────────────────────────────┘
                  │  in-process startServer()  OR  remote
                  │
          ┌───────▼────────────────────────┐
          │   Node.js Server (Express)      │
          │   Socket.io + REST endpoints    │
          │                                 │
          │  ┌────────────┐  ┌───────────┐ │
          │  │ RoomManager│  │GameEngine │ │
          │  └────────────┘  └───────────┘ │
          │  ┌────────────┐  ┌───────────┐ │
          │  │  AIPlayer  │  │  SQLite   │ │
          │  └────────────┘  └───────────┘ │
          └─────────────────────────────────┘
```

**Single-player mode** skips the network entirely: `useLocalGame.ts` in the renderer instantiates `GameEngine` and `AIPlayer` directly — no port, no socket, no server roundtrip.

**Multiplayer (LAN or hosted)** uses `useSocket.ts` in the renderer to connect via Socket.io. The server hosts one `GameEngine` per room and broadcasts sanitized `GameState` to both players after every mutation.

---

## 4. System Breakdown

### 4.1 Shared Package

**Path:** `shared/`  
**Purpose:** Single source of truth for all TypeScript types. Imported by all three packages (client, server, Electron). Has zero runtime dependencies by design.

Key types:
- `Color` / `Card` — atomic game pieces
- `PlayerState` — one player's full snapshot (hand, deck, field, graveyard, customizations)
- `GamePhase` — the state-machine enum covering all 20+ phases
- `GameState` — the complete game snapshot sent over the network and stored in replays
- `ReplayFile` — a saved sequence of `GameState` snapshots
- `ServerToClientEvents` / `ClientToServerEvents` — fully typed Socket.io event maps
- `UserProfile` / `SkinPack` — account and cosmetic types

---

### 4.2 Server Package

**Path:** `server/`  
**Entry point:** `server/src/index.ts` → `startServer(port)`  
**Runtime:** Node.js 20+, TypeScript compiled to `dist/`

Responsibilities:
- Creates an Express HTTP server with CORS and JSON body parsing
- Attaches a fully-typed Socket.io server for real-time game events
- Hosts REST endpoints for auth (`/auth`), profiles (`/profile`), and the skin shop (`/shop`)
- Decodes JWT from socket handshake so ranked stats can be recorded
- Manages rooms via `RoomManager` — in-memory, per-process
- Executes all game logic via `GameEngine` (one per room)
- Runs the AI opponent via `AIPlayer`
- Persists user accounts, ELO, and game results to SQLite via `@libsql/client`

#### Sub-systems

| Sub-system | File | Role |
|-----------|------|------|
| HTTP + Socket.io | `server.ts` | Express setup, CORS, Socket.io, JWT middleware |
| Event routing | `socketHandlers.ts` | Maps every socket event to game/room actions |
| Room registry | `RoomManager.ts` | In-memory rooms, player slots, engine lifecycle |
| Game state machine | `game/GameEngine.ts` | Authoritative rule enforcement & state mutation |
| Win detection | `game/WinChecker.ts` | Pure function: 5-of-a-kind or rainbow check |
| Deck builder | `game/DeckBuilder.ts` | Generates shuffled 25-card decks |
| AI opponent | `ai/AIPlayer.ts` | Strategic move selection via onStateChange hooks |
| Authentication | `auth.ts` | Register/login REST routes, JWT signing/verification |
| Database | `db.ts` | SQLite schema, CRUD helpers, ELO calculation |
| Shop | `shop.ts` | Skin pack purchase/grant, Stripe integration (optional) |

---

### 4.3 Client Package

**Path:** `client/`  
**Build tool:** Vite 5 + React 18 + TypeScript + Tailwind CSS  
**URL when hosted:** Baked via `VITE_DEDICATED_SERVER_URL` env var

Responsibilities:
- Renders all UI screens via a flat screen-router pattern in `App.tsx`
- Manages the Socket.io connection via `useSocket.ts` (multiplayer)
- Runs the full game engine in-process via `useLocalGame.ts` (single-player)
- Handles auth state (JWT in `localStorage`) via `useAuth.ts`
- Provides card image URLs (default SVG, active skin pack, or Electron custom uploads) via `useCardImages.ts`
- Stores persistent UI preferences (theme, volume, effect notification toggles) via `useUISettings.ts`
- Generates all sound effects procedurally via the Web Audio API in `useSound.ts`
- Plays looping background music via `useBGMusic.ts`

---

### 4.4 Electron Package

**Path:** `electron/`  
**Main process:** `electron/main.ts`  
**Preload:** `electron/preload.ts`

Responsibilities:
- Creates the `BrowserWindow` (1280×860, dark background)
- In development: loads from the Vite dev server at `localhost:5173`
- In production: loads the bundled `client/dist/index.html` from `resources/`
- Starts/stops the game server in-process via IPC (`start-server` / `stop-server`)
- Exposes OS utilities to the renderer via `contextBridge`:
  - IP address lookup (`get-ips`) for displaying LAN addresses in the Lobby
  - UPnP port mapping (`attempt-upnp`) for online play from behind a NAT
  - Custom card art management — open picker, save image, get URLs, reset to default
  - Replay file I/O (`save-replay`, `list-replays`, `load-replay`, `delete-replay`, `export-replay`, `import-replay`)
  - Persistent settings storage in `userData/settings.json` (`get-settings`, `save-settings`)

---

## 5. File-by-File Reference

### 5.1 Root

| File | Purpose |
|------|---------|
| [package.json](package.json) | Root package: Electron main package. Scripts for dev/build/package. Dependencies include Express, Socket.io, bcryptjs, jwt, @libsql/client (SQLite), electron-builder. |
| [electron-builder.json](electron-builder.json) | Electron Builder config — produces portable Windows `.exe` and `win-unpacked` directory under `release/`. |
| [README.md](README.md) | Game rules, stack summary, run/build instructions, AI overview, and full version history. |
| [DEPLOY.md](DEPLOY.md) | Hosting instructions for the dedicated server (Render, Railway, environment variables). |
| [version.txt](version.txt) | Current version string read at build time. |
| [dev.bat](dev.bat) | Windows shortcut that runs `npm run electron:dev` — starts Vite dev server + TS watch + Electron simultaneously via `concurrently`. |
| [package.bat](package.bat) | Windows shortcut for `npm run package:zip` — full build + electron-builder + zip. |
| [generate-cards.mjs](generate-cards.mjs) | Node.js script that generates the SVG card art for the default skin pack and saves them to `client/public/cards/`. |
| [generate-cards-v2.mjs](generate-cards-v2.mjs) | Updated card art generator (v2 style). Produces SVGs for all 5 colors + card back. |
| [generate-test-packs.mjs](generate-test-packs.mjs) | Generates the free test skin packs (`gilded`, `obsidian`, `neon`) into `client/public/cards/skins/`. Each pack is 6 SVG files (5 colors + back). |
| [render.yaml](render.yaml) | Render.com deployment manifest for the dedicated server. Defines the service, build command, and environment variables. |

---

### 5.2 shared/

#### [shared/types.ts](shared/types.ts)

The single source of truth for every type in the application. All three packages import from here; it has zero runtime dependencies.

**Key exports:**

| Export | Description |
|--------|-------------|
| `Color` | Union: `'white' \| 'red' \| 'blue' \| 'green' \| 'black'` |
| `ALL_COLORS` | `Color[]` array used for iteration |
| `Card` | `{ id: string; color: Color }` — a UUID-identified card instance |
| `CardCustomization` | `{ displayName: string }` — per-color display name override |
| `Customizations` | `Record<Color, CardCustomization>` |
| `DEFAULT_CUSTOMIZATIONS` | Default display names (White, Red, Blue, Green, Black) |
| `PlayerState` | Full player snapshot: `deck`, `hand`, `field`, `graveyard` + counts, customizations, `isConnected` |
| `GamePhase` | State-machine enum with 20 phases (`waiting`, `customizing`, `rps_pick`, `playing_play`, `counter_window`, `effect_black_show`, etc.) |
| `RpsChoice` | `'rock' \| 'paper' \| 'scissors'` |
| `AIDifficulty` | `'easy' \| 'medium' \| 'hard'` |
| `CounterChainEntry` | One step in the counter chain: player ID, type (`play`/`counter`/`counter_counter`), card(s) spent |
| `PendingEffect` | Extra data for the active effect phase (shown cards for Black, top card for Blue, etc.) |
| `ChatMessage` | `{ playerName, message }` |
| `GameSettings` | `{ counterTimeLimitSeconds: number \| null; isSinglePlayer?: boolean }` |
| `GameState` | The entire game at one point in time — players, phase, turn, pending play, counter chain, effect, winner, viewerIndex, RPS result, etc. |
| `ReplayFile` | Saved game: metadata (date, players, winner) + `snapshots: GameState[]` |
| `UserProfile` | Public-facing account data: ELO, wins/losses/draws, win streaks, win type breakdowns, owned/active skin pack |
| `SkinPack` | A cosmetic pack: id, name, description, price in cents, preview URL |
| `ServerToClientEvents` | Typed Socket.io server→client events: `game_state`, `room_created`, `error`, `chat_message`, `replay_complete`, `matchmaking_status`, `matchmaking_found` |
| `ClientToServerEvents` | Typed Socket.io client→server events: `create_room`, `join_room`, `play_card`, `counter_response`, `counter_counter_response`, `effect_response`, `join_matchmaking`, etc. |
| `SocketData` | Per-socket metadata stored in `socket.data`: `playerId`, `roomCode`, `playerName`, optional `userId`/`userName` from JWT |

---

### 5.3 server/src/

#### [server/src/index.ts](server/src/index.ts)

Standalone entry point used when running the server **outside of Electron** (e.g. `npm start` in the server package, or on a hosted platform). Reads `PORT` from the environment (defaults to `3001`) and calls `startServer(port)`. Never loaded when running inside Electron — the Electron main process calls `startServer()` directly.

---

#### [server/src/server.ts](server/src/server.ts)

Exports `startServer(port): Promise<LandsServer>`. This function:

1. Calls `initDB()` to initialize the SQLite schema (creates tables if missing).
2. Creates an Express app with CORS (configurable via `ALLOWED_ORIGIN` env var, defaults to `*`) and JSON body parsing.
3. Registers REST routes: `/health` (health check), `/auth`, `/profile`, `/shop/webhook` (raw body for Stripe), `/shop`.
4. Creates a Node.js `http.Server`, attaches fully-typed Socket.io.
5. Runs a JWT-decode middleware on every socket connection — if a valid `auth.token` is present in the handshake, stores `userId` and `userName` in `socket.data`.
6. Calls `registerHandlers(io, socket)` for every new connection.
7. Returns a `{ port, close() }` handle so Electron can shut the server down cleanly.

---

#### [server/src/socketHandlers.ts](server/src/socketHandlers.ts)

The central event router — `registerHandlers(io, socket)` is called once per connection. Contains all socket event listeners and the matchmaking queue.

**Module-level state:**
- `rooms: RoomManager` — shared room registry
- `rematchVoteMap` — tracks which players in a room have voted for rematch
- `rpsPickMap` / `rpsWinnerMap` — tracks RPS state during the pick/choose phases
- `singlePlayerAIs` — maps room code → `AIPlayer` for single-player games
- `matchmakingQueue` — global FIFO queue of players waiting to be paired

**Key functions:**

| Function | Purpose |
|----------|---------|
| `tryPairMatchmaking(io)` | Pairs the first two players from the queue, creates a room, and emits `matchmaking_found` + initial `game_state` to both |
| `buildReplay(engine, mode)` | Assembles a `ReplayFile` from the engine's snapshot history |
| `wireEngine(io, engine, ...)` | Attaches `onStateChange` to an engine — broadcasts sanitized state and, on game end, emits `replay_complete` and records ELO |
| `broadcastState(io, state)` | Sanitizes and sends a tailored `GameState` to each player (hides opponent hand/deck; hides Blue topCard from non-active player) |
| `hiddenHand(player)` | Strips `hand` and `deck` from a `PlayerState` for the opponent view |

**Socket events handled per connection:**

| Event | Handler summary |
|-------|-----------------|
| `create_room` | Creates a room, joins the socket to it, registers socket data |
| `create_singleplayer` | Creates a single-player room, wires the engine + AI, immediately starts |
| `join_room` | Joins an existing room; if both players are present emits `customizing` state |
| `set_ready` | Marks a player ready; when both are ready emits `rps_pick` state |
| `rps_pick` | Records RPS choice; resolves when both have picked, emits result |
| `rps_choose` | RPS winner picks who goes first; calls `RoomManager.startGame()` and wires the engine |
| `play_card` | Calls `engine.playCard(cardId)` |
| `counter_response` | Calls `engine.counterResponse(...)` |
| `counter_counter_response` | Calls `engine.counterCounterResponse(...)` |
| `effect_response` | Calls `engine.effectResponse(...)` |
| `update_customization` | Persists customizations to the room; propagates live to engine if running |
| `chat_message` | Broadcasts a `ChatMessage` event to the room |
| `rematch_vote` | Records vote; when both agree, reloads the game — multiplayer returns to RPS |
| `surrender` | Calls `engine.surrender(playerId)` |
| `join_matchmaking` | Pushes player into the queue; calls `tryPairMatchmaking` |
| `leave_matchmaking` | Removes player from queue |
| `disconnect` | Calls `rooms.removePlayer(playerId)`; if game was running, opponent is notified |

---

#### [server/src/RoomManager.ts](server/src/RoomManager.ts)

In-memory registry of all active game rooms. One shared instance per server process.

**`Room` structure:**
- `code` — 4-letter code (avoids I and O to reduce ambiguity)
- `players` — 1 or 2 `PendingPlayer` slots (before the engine starts)
- `engine: GameEngine | null` — null until both players are ready and RPS resolves
- `settings` — counter time limit and single-player flag

**Key methods:**

| Method | Description |
|--------|-------------|
| `createRoom(playerId, name, settings)` | Generates a unique 4-letter code, stores one-player room |
| `joinRoom(code, playerId, name)` | Adds second player, returns `Room` or `null` if not found/full |
| `getRoom(code)` | Lookup by code |
| `getRoomByPlayerId(id)` | Linear scan across all rooms to find the room containing a player |
| `setCustomization(playerId, customizations)` | Persists customizations; propagates live to engine |
| `setReady(playerId)` | Marks player ready; returns `true` when both are ready |
| `startGame(code, firstPlayerIndex)` | Creates the `GameEngine` with the winner-chosen first player |
| `createSinglePlayerRoom(...)` | All-in-one: creates room, engine, and `AIPlayer`; randomizes first player |
| `removePlayer(playerId)` | On disconnect: tells engine or deletes the whole room if game not started |
| `reconnectPlayer(code, playerId)` | Reconnects a dropped player and returns the engine to re-emit state |

---

#### [server/src/auth.ts](server/src/auth.ts)

REST authentication routes and JWT utilities.

**JWT:** Signed with `JWT_SECRET` env var (defaults to a dev secret). Tokens expire after 90 days.

**Validation rules:**
- Username: 2–24 characters, alphanumeric + `_-`, trimmed
- Passcode: 4–72 characters

**REST endpoints:**

| Method | Path | Request | Response |
|--------|------|---------|----------|
| `POST` | `/auth/register` | `{ username, passcode }` | `{ token, profile }` or error |
| `POST` | `/auth/login` | `{ username, passcode }` | `{ token, profile }` or error |
| `GET` | `/profile/me` | Bearer token | `{ profile }` |
| `GET` | `/profile/:id` | — | `{ profile }` (public) |

**Exports:** `requireAuth` middleware, `signToken`, `verifyToken`, `JwtPayload` interface.

---

#### [server/src/db.ts](server/src/db.ts)

SQLite data layer via `@libsql/client` (compatible with Turso for cloud migration).

**Configuration:**
- `DB_PATH` env var → file path, or `:memory:` for tests
- Falls back to `./data/lands.db` in the process working directory

**Schema:**

| Table | Key columns |
|-------|-------------|
| `users` | `id`, `username`, `passcode_hash`, `elo` (starts 1000), `wins`, `losses`, `draws`, `win_streak`, `best_win_streak`, `wins_five_kind`, `wins_rainbow`, `games_for_k` (K-factor tracker), `active_pack_id` |
| `game_results` | `id`, `p0_id`, `p1_id`, `winner_index`, `win_reason`, `turn_count`, `elo_delta_p0`, `elo_delta_p1`, `played_at` |
| `skin_packs` | `id`, `name`, `description`, `price_cents`, `preview_url`, `released_at` |
| `user_owned_packs` | `user_id`, `pack_id`, `purchased_at` |

**ELO K-factor:** K=40 for first 39 games, K=32 thereafter, K=20 for ELO ≥ 2000.

**Built-in packs seeded on every startup:** `default` (Classic), `gilded`, `obsidian`, `neon` — all free, SVG-based.

**Key CRUD functions:** `findUserByUsername`, `findUserById`, `createUser`, `touchLastSeen`, `toPublicProfile`, `getUserOwnedPackIds`, `grantPack`, `setActivePack`, `getAllSkinPacks`, `recordGameResult`.

---

#### [server/src/shop.ts](server/src/shop.ts)

Skin pack purchase system.

**REST endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/shop/packs` | Optional | Returns all packs + user's owned IDs if authenticated |
| `POST` | `/shop/checkout` | Required | Free packs: grants immediately. Paid packs without `STRIPE_SECRET_KEY`: also grants immediately (dev mode). Paid packs in production: creates a Stripe Checkout session and returns the URL. |
| `POST` | `/shop/webhook` | Stripe signature | Receives Stripe `checkout.session.completed` events; grants the pack to the user stored in session metadata |
| `POST` | `/profile/equip-pack` | Required | Sets the user's `active_pack_id` |

**Stripe integration:** Opt-in. Set `STRIPE_SECRET_KEY` and add price IDs to `STRIPE_PRICE_IDS` map. Without the key, all packs are granted for free (useful for local testing).

---

### 5.4 server/src/game/

#### [server/src/game/GameEngine.ts](server/src/game/GameEngine.ts)

The authoritative game state machine. Owns and mutates `state` directly, then calls `emit()` (which triggers `onStateChange`) after every mutation.

**Architecture note:** The engine has no network awareness. It exposes a clean method API and fires `onStateChange`. Callers (`socketHandlers.ts` for multiplayer, `useLocalGame.ts` for single-player) wire up `onStateChange` to broadcast to clients.

**Constructor:** Takes room code, two player descriptors `{ id, name }`, and `GameSettings`. Builds decks, deals 5 cards each, sets phase to `playing_play`. Player 0 always goes first (decided by RPS before the engine is created).

**Private helpers:**
- `makePlayer` — builds a `PlayerState` with a freshly shuffled deck and 5-card hand
- `ensureDeckHasCards` — reshuffles graveyard back into deck if draw pile is empty
- `drawOne` — takes the top deck card into the player's hand
- `removeFromHand` — removes a specific card by ID
- `discardToGraveyard` — moves a card to graveyard

**Public API:**

| Method | Description |
|--------|-------------|
| `drawCard(playerId)` | Draws one card for the current player (called on `playing_draw` phase) |
| `playCard(playerId, cardId)` | Plays a card from hand — starts the counter window (or pre_target phase for Red/Green) |
| `counterResponse(playerId, countering, blueCardId?, matchingCardId?)` | Defender response to the counter window |
| `counterCounterResponse(playerId, countering, blueCard1Id?, blueCard2Id?)` | Attacker response to a counter-counter window |
| `effectResponse(playerId, data)` | Handles all effect-resolution inputs (Black show/pick, Blue look, Red/Green target) |
| `surrender(playerId)` | Ends the game immediately with the opponent as winner |
| `applyCustomization(playerId, customizations)` | Updates a player's display name overrides live |
| `playerDisconnected(playerId)` | Marks the player disconnected; if no reconnect expected, ends the game via forfeit |
| `playerReconnected(playerId)` | Marks the player connected; triggers a state re-emit |

**Resolution flow:**
```
playCard()
  → startCounterWindow()  (phase = counter_window)
       ↓ counterResponse()
           countered?  → pushCounterChain()
                          → startCounterCounterWindow()  (phase = counter_response)
                               ↓ counterCounterResponse()
                                   CC submitted? → pushCounterChain() → startCounterWindow() again
                                   Passed? → resolveCounterWindow()
           passed?     → resolveCounterWindow()
                          chain length even? → land countered (to graveyard)
                          chain length odd?  → land resolves → fireEffect()
                                               → effect phase(s) → endTurn()
```

**Replay support:** Every call to `emit()` deep-clones `state` and pushes it to `replaySnapshots[]`, giving a complete frame-by-frame history.

---

#### [server/src/game/WinChecker.ts](server/src/game/WinChecker.ts)

Tiny pure module. Exports a single function `checkWin(field: Card[]): boolean`.

- Returns `false` immediately if `field.length < 5` (fast path).
- Counts each color on the field — returns `true` if any color has 5+ cards (5-of-a-kind).
- Checks if all 5 colors are present — returns `true` for rainbow.

Called by `GameEngine` after every land resolves onto a field.

---

#### [server/src/game/DeckBuilder.ts](server/src/game/DeckBuilder.ts)

Exports two functions:

- `buildDeck(): Card[]` — creates a 25-card deck (5 copies × 5 colors, each with a unique UUID), then shuffles it.
- `shuffle<T>(arr: T[]): T[]` — Fisher-Yates in-place shuffle on a copy. Does not modify the original array.

---

### 5.5 server/src/ai/

#### [server/src/ai/AIPlayer.ts](server/src/ai/AIPlayer.ts)

The AI opponent. Hooks into a running `GameEngine` by chaining onto `onStateChange`. Does not make network calls — it calls the engine's public API directly, just like a human socket handler would.

**Difficulty parameters:**

| Difficulty | Name | Think delay | Random move chance |
|-----------|------|------------|-------------------|
| `easy` | Sapling | 200–600ms | 80% |
| `medium` | Ironbark | 400–1000ms | 30% |
| `hard` | Dreadroot | 700–1600ms | 5% |

**Activation:** Call `aiPlayer.activate(engine)` after creating the engine. This wraps `engine.onStateChange` — the AI's logic runs after each state change, checks whether it's the AI's turn to act, schedules a think delay, then calls the appropriate engine method.

**Win path analysis:**

The AI computes all viable win paths for a player using `getWinPaths(player)`:
- **5-of-a-kind paths** — one per color the player has started accumulating (on field or in hand). Tracks `cardsNeeded` and `neededInGrave` (copies stuck in graveyard needing a Green to retrieve).
- **Rainbow path** — tracked whenever any card is on the field.
- `effectiveCardsNeeded(path)` — adds 1 to the cost if all remaining needed copies are in the graveyard (opponent must play Green first).

**Decision pipeline:**

| Method | Phase triggered | Description |
|--------|----------------|-------------|
| `doPlayCard` | `playing_play` | Evaluates every hand card via `scoreCard()`, applies random-move chance, plays the best card |
| `doCounter` | `counter_window` | Calls `evaluateCounter()` which computes a threat score 0–100; counters if above difficulty threshold |
| `doCounterCounter` | `counter_response` | Counters if the pending card is on the AI's win path or if it has a surplus of Blue cards (3+) |
| `doBlackPick` | `effect_black_pick` | Picks the opponent card to discard; prioritises Blue (removes counter capability), then win-path colors |
| `doBlackShow` | `effect_black_show` | Chooses 3 cards to reveal to the opponent; protects Blues and win-path cards |
| `doBlueLook` | `effect_blue_look` | Keeps top card if it advances a win path or is Blue; otherwise sends it to the bottom |
| `doRedPick` | `effect_red_pick` | Calls `chooseBestRedTarget()` — scores opponent field cards by win-path threat + singleton disruption |
| `doGreenPick` | `effect_green_pick` | Calls `chooseBestGreenTarget()` — retrieves the best win-path card from graveyard, or a Blue for counter capability |

**Hard AI exclusive features:**
- **Knowledge tracking** — records which colors have been seen in the opponent's hand via Black reveals. Decrements counts as opponent plays/counters/discards; increments when Green retrieves a graveyard card.
- **Hypergeometric counter-risk model** — computes the probability that the opponent holds the needed cards (Blue + matching) using a hypergeometric distribution over the remaining card pool. Hard AI refines this with known-hand data; Medium/Easy use public counts only.
- **Counter preservation** — when AI holds a winning card and the opponent is 1 card away from winning, heavily penalises moves that would break an assembled counter (−600 score), avoids spending partial pieces (−500), and prioritises Green to retrieve a missing counter card (+650–700).
- **Deferred win** — when counter risk is high and no counter-counter defense is available, the AI defers playing the winning card. In deferral mode: Black scores ~900 (strip opponent's counter), Green-retrieves-Blue scores ~850, Red scores ~820.

---

### 5.6 electron/

#### [electron/main.ts](electron/main.ts)

The Electron main process. Runs in Node.js outside of the browser sandbox.

**Window creation:** `createWindow()` — 1280×860, minimum 900×600, dark background `#0e0e12`, context isolation enabled, `node integration` disabled, `webSecurity` disabled to permit `file://` card image URLs.

**IPC handlers:**

| Channel | Description |
|---------|-------------|
| `start-server` | Starts (or restarts) the `LandsServer` on the given port; returns `{ port }` |
| `stop-server` | Gracefully shuts down the server |
| `get-ips` | Returns `{ local, public }` — local: first non-loopback IPv4; public: `api.ipify.org` fetch |
| `attempt-upnp` | Uses `nat-api` to attempt UPnP port mapping; returns `{ success, ip? }` |
| `open-image-dialog` | Opens a native file picker for images; returns selected file path |
| `save-card-image` | Copies the selected image into `userData/card-images/{color}.{ext}` |
| `get-card-image-urls` | Returns `file://` URLs for each color, applying priority: custom upload > active skin pack > bundled default art |
| `get-card-assets-base` | Returns the base path for bundled card assets |
| `reset-card-image` | Deletes the custom uploaded image for a color |
| `get-settings` | Reads and parses `userData/settings.json`; returns empty object if missing |
| `save-settings` | Writes settings object to `userData/settings.json` |
| `save-replay` | Writes a `ReplayFile` to `userData/replays/{id}.json` |
| `list-replays` | Reads all replay files; returns metadata (strips `snapshots` for efficiency) |
| `load-replay` | Reads and parses a single replay file by ID |
| `delete-replay` | Deletes a replay file by ID |
| `export-replay` | Opens a save-as dialog and copies a replay file to the chosen location |
| `import-replay` | Opens a file picker, validates the JSON as a `ReplayFile`, copies it to `userData/replays/` |

---

#### [electron/preload.ts](electron/preload.ts)

The security bridge. Runs with elevated Node.js privileges before the renderer loads. Uses `contextBridge.exposeInMainWorld('electronAPI', {...})` to expose exactly the functions the renderer needs — all as `ipcRenderer.invoke()` calls that are answered by the handlers in `main.ts`.

Exposed as `window.electronAPI.*`:  
`startServer`, `stopServer`, `getIPs`, `attemptUPnP`, `openImageDialog`, `saveCardImage`, `getCardImageUrls`, `getCardAssetsBase`, `resetCardImage`, `getSettings`, `saveSettings`, `saveReplay`, `listReplays`, `loadReplay`, `deleteReplay`, `exportReplay`, `importReplay`

---

### 5.7 client/src/

#### [client/src/App.tsx](client/src/App.tsx)

Top-level screen router and application root. Manages which screen is displayed and all top-level state shared between screens.

**Screens:**
`home`, `auth`, `profile`, `shop`, `skins`, `play-menu`, `single-player-menu`, `single-player`, `settings`, `rules`, `multiplayer-menu`, `private-menu`, `host`, `join`, `matchmaking`, `replays`, `replay-viewer`

**Top-level state:**
- `screen` — current active screen
- `serverUrl` — Socket.io server URL (set when user connects; null when disconnected)
- `playerName` — persisted to `localStorage`
- `hostSettings` — `GameSettings` (counter time limit) configured in the Lobby
- `localGameParams` — parameters for starting a single-player game
- `pendingJoin` — room code + settings for joining a room after connecting
- `replayToView` — `ReplayFile` to display in the replay viewer

**Hooks used:**
- `useSocket(serverUrl, authToken)` — manages Socket.io connection for multiplayer
- `useLocalGame(params)` — runs engine + AI in-process for single-player
- `useAuth()` — JWT auth session
- `useCardImagesProvider(activePack)` — provides card image URLs via `CardImagesContext`
- `useUISettingsProvider()` — provides UI preferences via `UISettingsContext`
- `useBGMusic()` — starts/stops background music

**Screen switching logic:** When `gameState` is non-null and the phase is beyond `waiting`/`customizing`, in-game screens (`RpsScreen`, `GameBoard`/`GameOver`) render regardless of the screen router.

**Page transitions:** All screen changes are wrapped in a Framer Motion `AnimatePresence` with a 180ms fade-and-slide.

---

#### [client/src/main.tsx](client/src/main.tsx)

Vite entry point. Mounts `<App />` into `#root` via `ReactDOM.createRoot`.

#### [client/src/index.css](client/src/index.css)

Global CSS: Tailwind base/components/utilities, CSS custom properties for the dark/light theme palette, card color theming, animation keyframes (status bar glow, pulsing turn indicator, game-end animation).

#### [client/src/electron.d.ts](client/src/electron.d.ts)

TypeScript declaration for `window.electronAPI` — the interface exposed by `preload.ts`. Typed with `undefined` fallback so the browser/web build compiles cleanly without Electron.

---

### 5.8 client/src/hooks/

#### [useSocket.ts](client/src/hooks/useSocket.ts)

Manages the Socket.io connection to the game server.

- Pass a non-null `serverUrl` to connect; `null` to disconnect and reset all state.
- Optional `authToken` is passed in the socket handshake `auth` object so the server can record ranked stats.
- Listens for: `game_state`, `room_created`, `error`, `chat_message`, `matchmaking_status`, `matchmaking_found`, `replay_complete` (auto-saves to Electron userData).
- Exposes a typed `send(event, ...args)` function that forwards to `socket.emit`.
- Returns: `gameState`, `roomCode`, `error`, `connected`, `send`, `chatMessages`, `matchmakingStatus`, `matchmakingFound`.

---

#### [useLocalGame.ts](client/src/hooks/useLocalGame.ts)

Runs the game engine and AI entirely in the renderer process — no port, no socket needed.

- Creates a `GameEngine` and `AIPlayer` from the `@lands/game` and `@lands/ai` path aliases.
- Wires `engine.onStateChange` to sanitize state (hide AI hand/deck, hide Blue topCard when it's the AI's turn) then calls `setGameState`.
- Exposes a `send(event, ...args)` function that maps socket-style events directly to engine method calls.
- On rematch: calls `startGame()` again with a fresh engine; uses an `engineInstance` guard ref to prevent stale callbacks from dead engines writing to React state.
- Automatically saves the replay to Electron userData when the game ends (`window.electronAPI?.saveReplay`).
- Returns: `{ gameState, send }`.

---

#### [useAuth.ts](client/src/hooks/useAuth.ts)

Manages the authenticated user session.

- Persists the JWT token in `localStorage` under key `authToken`.
- On mount, re-validates the stored token against `/profile/me` to refresh the profile (e.g. updated ELO after a game). On failure (expired/invalid token), clears it silently.
- Exports: `token`, `profile`, `loading`, `error`, `login`, `register`, `logout`, `refreshProfile`, `updateProfile`.
- Auth is entirely optional — the app works as a guest without it.

---

#### [useCardImages.ts](client/src/hooks/useCardImages.ts)

Provides card image URLs throughout the component tree via `CardImagesContext`.

**Priority (highest wins):**
1. Electron custom uploaded images (per-color file in `userData/card-images/`)
2. Active skin pack images (`/cards/skins/{packId}/color.ext`)
3. Default SVG cards (`/cards/color.svg`)

- `useCardImages()` — consumes the context in leaf components (e.g. `Card.tsx`)
- `useCardImagesProvider(activePack?)` — used once in `App.tsx`; calls `window.electronAPI.getCardImageUrls()` in Electron or falls back to URL resolution in the browser
- `CardImagesContext` — React context holding the current URL map

---

#### [useUISettings.ts](client/src/hooks/useUISettings.ts)

Persistent UI preferences stored in `localStorage`. Two-layer context pattern:
- `useUISettingsProvider()` — used once at root (`App.tsx`) to hold state and read/write `localStorage`
- `useUISettings()` — used in any component to read or set preferences
- `UISettingsContext` — the React context

**Settings managed:**

| Setting | Default | Description |
|---------|---------|-------------|
| `showCardTypeOnHover` | `true` | Show color name tooltip on card hover |
| `showCardEffectsOnHover` | `true` | Show effect description on card hover |
| `showEffectResult{Red,Green,Blue,Black}` | `true` (each) | Per-effect popup toggles for opponent |
| `theme` | `'dark'` | `'dark'` or `'light'` — synced to `data-theme` attribute on `<html>` |
| `musicVolume` | `0.5` | Background music volume (0–1) |
| `musicMuted` | `false` | Background music mute |
| `sfxVolume` | `0.7` | Sound effects volume (0–1) |
| `sfxMuted` | `false` | Sound effects mute |
| `showEndAnimation` | `true` | Whether to play the game-end CSS animation before revealing `GameOver` |

---

#### [useGameLog.ts](client/src/hooks/useGameLog.ts)

Generates a human-readable game log by diff-ing consecutive `GameState` snapshots.

- Compares each incoming `gameState` against a stored snapshot via `useEffect`.
- Detects: new plays, counters, counter-counters, land resolutions, Red destructions, Green retrievals, Blue top-card decisions, Black reveals/discards, turn changes, graveyard reshuffles, game end.
- Emits `LogEntry` objects: `{ id, timestamp, message }`.
- Auto-scrolls to the bottom on new entries (handled by `GameLog.tsx`).

---

#### [useSound.ts](client/src/hooks/useSound.ts)

Synthesizes all game sound effects using the Web Audio API — no audio files are loaded.

- Shares a single `AudioContext` ref per component mount; lazily created and resumed to handle browser autoplay policy.
- Reads `sfxVolume` and `sfxMuted` from `UISettingsContext`.
- Exports: `playDraw` (ascending whoosh), `playPlay` (soft thud), `playCounter` (warning sting), `playWin` (triumphant burst), `playLose` (descending fall).

---

#### [useBGMusic.ts](client/src/hooks/useBGMusic.ts)

Plays looping background music using the Web Audio API (procedurally generated or streamed from a file). Reads `musicVolume` and `musicMuted` from `UISettingsContext`.

---

### 5.9 client/src/components/

#### [HomeScreen.tsx](client/src/components/HomeScreen.tsx)

Main menu — entry point of the app. Buttons navigate to: Play, Settings, Rules, Replays, Profile/Auth, and Shop. Shows logged-in username if authenticated.

---

#### [AuthScreen.tsx](client/src/components/AuthScreen.tsx)

Login/register form. Toggles between login and register mode. Calls `auth.login()` or `auth.register()` then navigates to the profile screen on success.

---

#### [ProfileScreen.tsx](client/src/components/ProfileScreen.tsx)

Displays the logged-in player's stats: ELO rating, wins/losses/draws, current and best win streaks, wins by type (5-of-a-kind vs Rainbow). Links to the Skins and Shop screens. Includes a logout button.

---

#### [ShopScreen.tsx](client/src/components/ShopScreen.tsx)

Skin pack shop. Fetches available packs from `GET /shop/packs`. Shows purchasable packs (Classic/default is always free and shown elsewhere). On purchase: calls `POST /shop/checkout`. In dev mode (no Stripe key), grants immediately. In production, redirects to Stripe Checkout URL.

---

#### [SkinsScreen.tsx](client/src/components/SkinsScreen.tsx)

Card skin equip screen. Shows all packs the user owns. Clicking a pack calls `POST /profile/equip-pack` and refreshes the card image context so the new art appears immediately.

---

#### [PlayMenu.tsx](client/src/components/PlayMenu.tsx)

Mode selection screen with an inline player name input (persisted to `localStorage`). Buttons: Single Player → `single-player-menu`, Multiplayer → `multiplayer-menu`.

---

#### [SinglePlayerMenu.tsx](client/src/components/SinglePlayerMenu.tsx)

Single-player configuration: AI difficulty selector (Easy/Medium/Hard), counter time limit slider, and a go-first toggle. Calls `onStart(params)` which sets `localGameParams` in `App.tsx`.

---

#### [MultiplayerMenu.tsx](client/src/components/MultiplayerMenu.tsx)

Multiplayer mode selector: **Private Room** (host/join with a 4-character code) or **Matchmaking** (automatic pairing).

---

#### [Lobby.tsx](client/src/components/Lobby.tsx)

Two sub-components:

- **HostLobby** — user configures counter time limit → "Create Room" connects the socket to the dedicated server and emits `create_room`. Displays the generated 4-character code to share. Shows local IP (via Electron IPC) as a hint.
- **JoinLobby** — user enters a 4-character code → "Connect" emits `join_room`.

The actual Socket.io connection is managed in `App.tsx` via `serverUrl` + `useSocket`.

---

#### [MatchmakingScreen.tsx](client/src/components/MatchmakingScreen.tsx)

Shown while the player is waiting in the matchmaking queue. Displays queue position from `matchmaking_status` events. Once `matchmaking_found` is emitted by the server, `App.tsx` transitions automatically to the customizing/ready phase.

---

#### [ReadyScreen.tsx](client/src/components/ReadyScreen.tsx)

Customization + ready screen. Both players can rename their land colors (White → "Plains", etc.) before clicking Ready. Shows the opponent's customizations live as they update via `update_customization` events. When both players are ready, the server transitions to `rps_pick`.

---

#### [RpsScreen.tsx](client/src/components/RpsScreen.tsx)

Rock-Paper-Scissors screen shown before the game starts. Both players simultaneously pick; ties re-run automatically. The RPS winner then picks which player goes first (can choose either side). On confirmation, emits `rps_choose`.

---

#### [GameBoard.tsx](client/src/components/GameBoard.tsx)

The main game screen rendered during an active game. Composed of:

1. **Opponent info bar** — name, pulsing turn indicator, hand count
2. **Opponent hand** — face-down card backs showing `handCount`
3. **Opponent field** — land stacks grouped by color, plus graveyard button and deck fan
4. **Status bar** — turn number, phase label, color-coded glow animation, counter countdown timer
5. **My field** — same structure as opponent
6. **My hand** — face-up, clickable during `playing_play` phase
7. **My info bar** — name, surrender button, sidebar Log/Chat tab toggles

**Floating overlays (conditional):**
- `CounterPrompt` — counter/pass decision
- `EffectPrompt` — effect target selection
- Right sidebar — 272px panel with Log | Chat tabs (always visible)

**Status context** (`getStatusContext`): maps the current `GamePhase` and `isMyTurn` flag to a label, subtitle, glow class, and RGB color for the animated status bar.

---

#### [CounterPrompt.tsx](client/src/components/CounterPrompt.tsx)

Floating overlay shown to:
- The **defender** during `counter_window` (Counter / Pass)
- The **attacker** during `counter_response` (Counter-counter / Pass)

Handles automatic card pre-selection: scans the player's hand for the required Blue + matching-color cards. Shows a confirmation step listing the exact cards that will be spent before the player commits.

---

#### [EffectPrompt.tsx](client/src/components/EffectPrompt.tsx)

Handles all interactive effect resolution prompts:

| Phase | Player | Prompt |
|-------|--------|--------|
| `pre_target_red` / `effect_red_pick` | Attacker | Select an opponent field land to destroy |
| `pre_target_green` / `effect_green_pick` | Attacker | Select a graveyard card to retrieve |
| `effect_blue_look` | Attacker | Keep top card on top or send to bottom |
| `effect_black_show` | Defender | Pick 3 cards from your hand to reveal |
| `effect_black_pick` | Attacker | Pick one of the 3 revealed cards to discard |

---

#### [Field.tsx](client/src/components/Field.tsx)

Renders a player's field (lands in play). Cards are visually grouped into color stacks, each with a count badge. When `selectableIds` is provided (Red/Green effect prompts), only those cards are clickable; others are dimmed.

---

#### [Hand.tsx](client/src/components/Hand.tsx)

Renders a row of cards from a player's hand. When `hiddenCount` is set and `cards` is empty (opponent's hand), shows that many face-down `HiddenCard` placeholders. Supports `selectableIds + onSelect` for the `playing_play` selection flow.

---

#### [Graveyard.tsx](client/src/components/Graveyard.tsx)

Renders a player's graveyard as a compact button (showing count) that opens a modal card list. Graveyard contents are always public (needed for Green effect targeting).

---

#### [DeckDisplay.tsx](client/src/components/DeckDisplay.tsx)

Compact deck visualization: a fan of overlapping face-down cards with a count badge. Used in both `GameBoard` and `ReplayViewer`.

---

#### [Card.tsx](client/src/components/Card.tsx)

Individual card renderer. Reads the card image URL from `CardImagesContext`. Applies the player's color `customizations` for the display name tooltip. Supports hover tooltips showing the color name and effect description (controlled by `UISettings`).

---

#### [ChatPanel.tsx](client/src/components/ChatPanel.tsx)

Text chat panel in the right sidebar. Displays `ChatMessage` history and an input field. Available in both multiplayer and single-player (AI responds with canned messages for testing).

---

#### [GameLog.tsx](client/src/components/GameLog.tsx)

Scrolling log panel in the right sidebar. Receives `LogEntry[]` from `useGameLog()` and auto-scrolls to the bottom on new entries. Each entry shows a timestamp and a human-readable event message.

---

#### [GameOver.tsx](client/src/components/GameOver.tsx)

End-of-game overlay. Shows the winner, win reason (5-of-a-kind or Rainbow), and buttons for Rematch (emits `rematch_vote`) or Home. Sits on top of `GameBoard` so the final board state is visible behind it.

---

#### [GameEndAnimation.tsx](client/src/components/GameEndAnimation.tsx)

Full-screen animated overlay that plays for ~2800ms on game end (win/lose/draw), then calls `onDone` to reveal the `GameOver` screen. All animation is driven by CSS keyframes — no extra dependencies.

---

#### [ReplayBrowser.tsx](client/src/components/ReplayBrowser.tsx)

Lists all saved replay files loaded via `window.electronAPI.listReplays()`. Sorted newest-first. Each entry shows: date, player names, winner, turn count, and mode. Buttons to Watch (→ `ReplayViewer`) or Delete.

---

#### [ReplayViewer.tsx](client/src/components/ReplayViewer.tsx)

Watches a saved game snapshot-by-snapshot. Replicates the full game board layout. Both players' hands are fully visible.

**Controls:** Play/Pause, step backward/forward, jump to start/end, scrubber slider, speed buttons (0.5×, 1×, 2×, 4×), and a flip-perspective button to swap which player appears at the bottom.

---

#### [Settings.tsx](client/src/components/Settings.tsx)

Settings screen with three sections:
- **Appearance** — theme toggle (dark/light), effect notification toggles per land color
- **Cards** — card hover options (show name, show effect description), card art thumbnails with custom upload buttons (Electron only), reset to default
- **Audio** — music volume/mute, SFX volume/mute

---

#### [RulesScreen.tsx](client/src/components/RulesScreen.tsx)

Scrollable game rules reference. Numbered turn steps, dedicated rule boxes for each win condition, and a clear counter/counter-counter section. No MTG references.

---

## 6. Data Flow Diagrams

### Multiplayer Game Flow

```
Client A                      Server                       Client B
  │                              │                              │
  │──create_room──────────────→  │                              │
  │←─room_created ─────────────  │                              │
  │                              │  ←────────────join_room──────│
  │                              │  ─────game_state(waiting)──→ │
  │←─game_state(customizing)───  │                              │
  │──update_customization──────→ │                              │
  │──set_ready─────────────────→ │                              │
  │                              │  ←──────────────set_ready────│
  │←─game_state(rps_pick)──────  │  ─────game_state(rps_pick)─→ │
  │──rps_pick──────────────────→ │  ←──────────────rps_pick─────│
  │←─game_state(rps_choose)────  │  ───game_state(rps_choose)─→ │
  │──rps_choose────────────────→ │  (winner picks first player) │
  │←─game_state(playing_play)──  │  ──game_state(playing_play)→ │
  │──play_card─────────────────→ │                              │
  │←─game_state(counter_window)  │  ─game_state(counter_window)→│
  │                              │  ←──────counter_response─────│
  │←─game_state(playing_play)──  │  ──game_state(playing_play)→ │
  │          ...                 │          ...                  │
  │←─game_state(ended)─────────  │  ──game_state(ended)────────→│
  │←─replay_complete───────────  │  ──replay_complete──────────→│
```

### Single-Player Flow (in-process)

```
React Renderer Process
┌───────────────────────────────────────────────────────┐
│  useLocalGame.ts                                       │
│    │                                                   │
│    ├─── new GameEngine(roomCode, human, ai, settings)  │
│    │         └── state = { phase: 'playing_play', ... }│
│    │                                                   │
│    ├─── new AIPlayer(difficulty)                       │
│    │         aiPlayer.activate(engine)                 │
│    │                                                   │
│    │    engine.onStateChange = (state) => {            │
│    │      sanitize(state)  ──→  setGameState()         │
│    │      AI.onStateChange(state) → thinkDelay → act() │
│    │    }                                              │
│    │                                                   │
│    └─── send('play_card', {cardId}) ──→ engine.playCard│
└───────────────────────────────────────────────────────┘
```

---

## 7. State Machine

All 20 `GamePhase` values and their transitions:

```
waiting
  └─ (second player joins) ──→  customizing
       └─ (both set_ready) ───→  rps_pick
            └─ (both picked) ──→  rps_choose
                 └─ (winner picks first) ──→  playing_play
                      │
                      ├─ (play Red/Green card) ──→  pre_target_red / pre_target_green
                      │       └─ (target chosen) ──→  counter_window
                      │
                      ├─ (play any other card) ──→  counter_window
                      │       ├─ (defender passes OR timer expires) ──→  [effect phase]
                      │       └─ (defender counters) ──→  counter_response
                      │                └─ (attacker passes) ──→  [land sent to graveyard]
                      │                └─ (attacker counter-counters) ──→  counter_window (again)
                      │
                      ├─ [White effect] ──────────────────────────────→  (auto draw, skip effect phase)
                      ├─ [Red effect]  ──→  effect_red_pick
                      ├─ [Blue effect] ──→  effect_blue_look
                      ├─ [Green effect]──→  effect_green_pick
                      └─ [Black effect]──→  effect_black_show
                                               └─ (3 cards chosen) ──→  effect_black_pick
                                                    └─ (card chosen) ──→  playing_play (next turn)
                                                                                │
                                                                          (win condition met?)
                                                                                └──→  ended
```

---

## 8. AI System Deep Dive

### Card Scoring (Hard/Medium)

`scoreCard(card, state, aiIndex)` assigns a numeric score to each hand card:

| Condition | Score modifier |
|-----------|---------------|
| Winning card, low counter risk | +1000 (play immediately) |
| Winning card, high counter risk, no CC defense | Defer; Red/Black scored high instead |
| Win-path color card | +500 to +800 depending on distance to win |
| Blue card (counter reserve) | +200 (save for countering) |
| Green card (graveyard retrieval) | +150 to +700 depending on what it would retrieve |
| Red card (field disruption) | +100 to +820 depending on opponent threat |
| Black card (hand disruption) | +200 to +900 depending on opponent counter capability |
| Breaking an assembled counter | −600 penalty |
| Spending partial counter piece | −500 penalty |

### Counter Threat Estimation

Given the opponent's remaining card pool (deck + hand, minus known-hand data for Hard):

```
P(can_counter) = P(holds_blue) × P(holds_matching | holds_blue)
```

Each probability is computed via the hypergeometric distribution:
```
P(X ≥ k) = Σ C(K,i) × C(N-K, n-i) / C(N, n)
```
Where:
- `N` = total unseen cards in opponent's pool
- `K` = number of cards of the needed color in the pool
- `n` = opponent's hand size
- `k` = minimum needed (1 Blue + 1 matching for first counter; 2 Blue for CC)

---

## 9. Database Schema

```sql
users (
  id             TEXT PRIMARY KEY,
  username       TEXT NOT NULL,
  username_lower TEXT UNIQUE,
  passcode_hash  TEXT NOT NULL,
  elo            INTEGER DEFAULT 1000,
  wins           INTEGER DEFAULT 0,
  losses         INTEGER DEFAULT 0,
  draws          INTEGER DEFAULT 0,
  win_streak     INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  wins_five_kind INTEGER DEFAULT 0,
  wins_rainbow   INTEGER DEFAULT 0,
  games_for_k    INTEGER DEFAULT 0,   -- K-factor threshold tracker
  active_pack_id TEXT DEFAULT NULL,
  created_at     TEXT NOT NULL,
  last_seen      TEXT NOT NULL
)

game_results (
  id            TEXT PRIMARY KEY,
  p0_id         TEXT REFERENCES users(id),
  p1_id         TEXT REFERENCES users(id),
  winner_index  INTEGER,              -- 0, 1, or NULL (draw)
  win_reason    TEXT,
  turn_count    INTEGER NOT NULL,
  elo_delta_p0  INTEGER DEFAULT 0,
  elo_delta_p1  INTEGER DEFAULT 0,
  played_at     TEXT NOT NULL
)

skin_packs (
  id          TEXT PRIMARY KEY,       -- e.g. 'gilded'
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER DEFAULT 0,      -- 0 = free
  preview_url TEXT NOT NULL,
  released_at TEXT NOT NULL
)

user_owned_packs (
  user_id      TEXT REFERENCES users(id),
  pack_id      TEXT REFERENCES skin_packs(id),
  purchased_at TEXT NOT NULL,
  PRIMARY KEY (user_id, pack_id)
)
```

**ELO K-factors:** K=40 (first 39 games) → K=32 (40+ games) → K=20 (ELO ≥ 2000).

---

## 10. Build & Deploy

### Development

```bash
# Install all dependencies
npm run install:all

# Start dev mode (Vite + TS watch + Electron simultaneously)
npm run electron:dev
# or on Windows:
dev.bat
```

### Production Build (Electron)

```bash
# Build and package to release/win-unpacked/ and release/Lands.zip
npm run package:zip
# or on Windows:
package.bat
```

### Dedicated Server Deployment

The server (`server/`) is deployed separately from the Electron client.

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `JWT_SECRET` | Secret for signing JWTs (change from default in production) |
| `DB_PATH` | SQLite file path (e.g. `/data/lands.db`; default: `./data/lands.db`) |
| `ALLOWED_ORIGIN` | CORS allowed origin(s), comma-separated (default: `*`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (optional; omit to run in dev/free-grant mode) |
| `FRONTEND_URL` | Frontend URL used in Stripe Checkout success/cancel redirects |

**Client env vars (baked at build time):**

| Variable | Description |
|----------|-------------|
| `VITE_DEDICATED_SERVER_URL` | WebSocket server URL baked into the client bundle |

**Recommended hosting:**
- Server: **Railway** or **Render** (free tier, persistent disk for SQLite)
- Client (web): Static hosting (Netlify, Vercel, etc.)

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions.
