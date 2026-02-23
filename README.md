# Lands

A 2-player land card game with effects, counters, and an AI opponent.  Playable locally (single-player vs AI) or online via the dedicated server (private rooms with room codes or automatic matchmaking).

---

## How to Play

### Goal
Be the first player to get **5 lands of the same type** or **one of each of the 5 land types** on your field.

### Turn Structure
Each turn, the active player plays one card from their hand. The played card goes to their field after surviving the counter window. At the end of the turn the next player automatically draws a card.

### Land Types & Effects

| Land | Effect |
|------|--------|
| **White** | Draw a card from your deck |
| **Red** | Choose one of your opponent's field lands to destroy |
| **Blue** | Peek at the top card of your deck — keep it on top or send it to the bottom |
| **Green** | Retrieve a land from your graveyard back to your hand |
| **Black** | Force your opponent to reveal 3 cards from their hand — pick one to discard |

### Countering
When an opponent plays a land, you have a window to counter it:
- **Counter a play**: Spend **1 Blue + 1 card matching the played color** — the land is negated and goes to the attacker's graveyard
- **Counter-counter**: After your play is countered, spend **2 Blue cards** to negate their counter — your land resolves as normal
- Countering a **Blue land** specifically requires **2 Blue cards** (one Blue + one matching Blue)

The counter window has a configurable time limit (or can be set to infinite, requiring a manual Pass).

### Win Conditions
- **5-of-a-kind**: 5 lands of the same type on your field
- **Rainbow**: 1 of each of the 5 land types on your field

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + Socket.io + TypeScript |
| Shared types | `shared/types.ts` |
| Desktop wrapper | Electron (portable Windows exe) |

---

## Running & Building

```bash
# Development (Vite + TSC watch + Electron)
npm run electron:dev

# Build (compile TS + Vite build)
npm run electron:build

# Package to zip
npm run package:zip
```

> **Windows note**: If `electron-builder` fails with a symlink error, use `release/win-unpacked/Lands.exe` directly and zip the folder manually:
> ```powershell
> Compress-Archive -Path 'release/win-unpacked/*' -DestinationPath 'release/Lands.zip' -Force
> ```

---

## AI Opponent

Three difficulty levels:

| Difficulty | Name | Think Delay | Random Move Chance |
|-----------|------|------------|-------------------|
| Easy | Sapling | 200–600ms | 80% |
| Medium | Ironbark | 400–1000ms | 30% |
| Hard | Dreadroot | 700–1600ms | 5% |

**Hard AI strategic behaviours:**
- Tracks card colors seen via Black effect reveals; decrements counts accurately as the opponent plays, counters, or discards, and increments when graveyard cards are retrieved via Green
- Estimates counter risk using a **hypergeometric probability model** over the opponent's remaining card pool; Hard refines this with known-hand data, Medium/Easy use public counts only
- **Counter preservation**: actively protects assembled counter capability when the opponent is 1 card away from winning — penalises breaking a prepared counter, avoids spending partial pieces, and prioritises Green to retrieve a missing counter card from the graveyard
- Defers playing a winning card when counter risk is high and no CC defense is available
- In deferral mode: prioritises Black (~900, strip their counter) > Green-retrieves-Blue (~850, build CC) > Red (~820, disrupt) while saving Blues
- When holding a winning card, prioritises discarding opponent's Blue cards during Black effect
- Considers duplicate win cards as bait to burn opponent's counter resources
- Counter-counters more liberally when holding 3+ Blue cards (surplus)
- **Counter chain awareness**: when a subsequent counter requires 2 Blues, uses the same importance-based decision as counter-counter rather than a simplified check
- **Effective threat scoring**: treats win paths locked in the graveyard as one step further away (opponent needs a Green play first), preventing over-reaction to non-immediate threats
- **Red/Green targeting**: scores Red targets by win-path threat level and singleton disruption value; Green retrieval prioritises the best win-path card, then Blues for counter capability

---

## Version History

### v0.5.0 — Current
**UI Overhaul · Light/Dark Mode · Counter Chain Fix · Settings & Rules Refresh**

- **Redesigned game board**: Complete two-column layout — game area on the left, always-visible 272px sidebar on the right with Log and Chat tabs. No more toggling panels open/closed mid-game.
- **Animated status bar**: 52px bar at the top of the board shows the current phase, turn counter, and a color-coded CSS glow animation that changes based on whose turn it is and whether a counter window is open.
- **Blinking turn indicators**: Player header bars show a pulsing dot (emerald on your turn, amber on opponent's turn) for at-a-glance turn awareness.
- **Light / dark theme**: New theme toggle in Settings → Appearance. Switches between a dark slate palette and a muted slate-blue light palette. Persists across sessions.
- **Player name moved to Play screen**: The "Your Name" input now appears above the Single Player / Multiplayer buttons on the Play screen, so you set your name where it's most relevant rather than buried in Settings.
- **Counter chain validation fixed**: The server and AI now correctly enforce the two-tier counter cost:
  - *First counter* — requires **1 Blue + 1 card matching the played land's color**. Previously the matching-color check was not enforced.
  - *Counter-counter (and any further counters in the chain)* — requires **2 Blue cards**. Previously any second card was accepted, allowing illegal color combinations.
- **Major AI overhaul (Hard / Medium)**:
  - **Counter preservation**: The AI now actively protects counter and counter-counter capability when the opponent is one card away from winning. It penalises spending cards that would break an assembled counter (−600), avoids discarding partial pieces while waiting for the missing half (−500), and prioritises Green to retrieve a missing counter piece from the graveyard (+650–700).
  - **Knowledge tracking**: The Hard AI tracks exactly which colors it has seen in the opponent's hand via Black effect reveals. It decrements those counts accurately as the opponent plays, fields, or discards cards, and increments them when a graveyard card is retrieved. This gives the Hard AI precise known-hand data rather than relying purely on probability.
  - **Hypergeometric counter-risk model**: Counter risk is now estimated using a proper hypergeometric distribution — probability that the opponent's hand contains the needed Blue(s) and matching-color card given the visible pool of remaining cards. Hard AI refines this with known-hand data; Medium/Easy use public deck/field/graveyard counts only.
  - **Counter chain decision logic**: When a subsequent counter is required (chain length > 1, always 2 Blues), the AI now applies the same importance-based decision tree as for counter-counter rather than a simplified random check — it will spend 2 Blues only when the pending card is on its win path or when it has a Blue surplus.
  - **Effective cards-needed metric**: Win-path urgency now accounts for graveyard locks — if the opponent's remaining win cards are all in the graveyard, their path is treated as one step further away (they need a Green play first), preventing the AI from over-reacting to threats that are not yet immediate.
  - **Red & Green target selection**: Red now scores targets by opponent win-path threat, singleton disruption value, and whether the AI has seen that color in the opponent's hand (Hard only). Green retrieval prioritises the best win-path card, then Blues for counter capability.
- **Settings cleanup**: Removed the UPnP / port-forwarding network section (no longer relevant). Sections reorganised into three groups — Appearance, Cards, and Effect Notifications. The card art thumbnails (all 5 colors + card back) are now shown in a single unified grid.
- **Rules page rewrite**: Fully reorganised with numbered turn steps, dedicated rule boxes for each win condition, and a clear two-entry countering section (First Counter vs Counter-Counter). Remaining MTG land type name references removed. Fixed the Blue card description which incorrectly said "see Countering below" — the Countering section appears above card effects.

---

### v0.3.3
**Hosted Multiplayer Server — Private Rooms & Matchmaking**

- **Dedicated server**: Multiplayer now routes through a hosted server instead of a peer-to-peer LAN setup.  See [DEPLOY.md](DEPLOY.md) for hosting instructions (Render / Railway free tier recommended).
- **Matchmaking**: New matchmaking option pairs you with another player automatically.  A live queue-position counter shows your place while you wait.
- **Private rooms — simplified**: Hosting generates a 4-character room code; joining only requires that code.  No more IP address, port, or UPnP steps.
- **Multiplayer menu restructure**: Play → Single Player / Multiplayer → Private Room / Matchmaking → Host / Join.
- **Server URL config**: Set `VITE_DEDICATED_SERVER_URL` in `client/.env.local` before building to bake your server address into the client (see `client/.env.example`).

---

### v0.3.1
**MTG Name Removal · Rematch RPS · Effect Result Popups**

- **Land names cleaned up**: Removed all MTG-derived land names (Plains, Mountain, Island, Forest, Swamp). Cards are now labelled by their color only (White, Red, Blue, Green, Black) throughout the UI, card art, and codebase.
- **Rematch now re-runs RPS (multiplayer)**: After both players vote rematch, the game returns to the Rock-Paper-Scissors screen so players decide who goes first again, just like the start of a new game.
- **Rematch go-first picker (single-player)**: After choosing rematch in a single-player game, a prompt asks who goes first (you or the AI) before the new game starts.
- **Effect result popups**: After a Red, Green, Blue, or Black land effect resolves, the *opponent* (not the caster) sees a brief popup showing what happened:
  - **Red** — which land color was destroyed and from whose field
  - **Green** — which land color was retrieved and to whose hand
  - **Blue** — whether the opponent's top deck card was kept on top or sent to the bottom
  - **Black** — which land color was discarded from whose hand
- **Per-effect notification toggles**: Each of the four effect popups can be independently enabled or disabled in Settings → Effect Notifications.

---

### v0.3.0
**Replay System**

- **Replay recording**: Every completed game (single-player and multiplayer) is automatically saved as a replay file in `userData/replays/`.
- **Replay Browser**: Accessible from the home screen via the Replays button. Lists all saved replays with metadata — date, players, winner, turn count, and mode. Replays can be watched or deleted.
- **Replay Viewer**: Watch any saved game step by step. The viewer replicates the exact game board layout (opponent field, hands, status bar, your field) so it reads identically to a live game.
  - **Controls** (bottom bar): Play/Pause auto-advance, step backward/forward one snapshot, jump to start/end, scrubber slider, and speed buttons (0.5×, 1×, 2×, 4×)
  - **Flip perspective**: Swap which player's side is shown at the bottom
  - Both hands are fully visible during replay
- **Snapshot capture**: The game engine records a deep-clone of the full `GameState` after every state emission, ensuring every phase transition and effect is replayable.
- **Multiplayer support**: After an online game ends the server emits the full replay to both players, who each save it locally.

---

### v0.2.0
**Counter & Targeting Overhaul + UI Polish**

- **Targeting order fixed**: Red and Green lands now open the counter window *before* the attacker picks their target. Previously the target was selected first, revealing information before the opponent decided whether to counter. Target selection now happens after the counter window resolves.
- **Red/Green pick deduplication**: When choosing a target for Red (destroy) or Green (retrieve), duplicate land types are collapsed into a single card — selecting it removes/retrieves one of that type. No more redundant choices.
- **Counter UI simplified**: Removed manual card selection from the counter prompt. Clicking Counter auto-selects the appropriate cards (Blue + matching) and shows a confirmation step listing the cards that will be spent. One less step, no ambiguity.
- **Blue counter validation fixed**: Countering a Blue land now correctly requires 2 Blue cards (previously only 1 was required since the matching color check was satisfied by the same Blue card).
- **Game log detail added**: The log now shows:
  - Which 3 cards were revealed during a Black effect
  - Which card was discarded as a result
  - Which land was destroyed by Red
  - Which land was retrieved by Green
- **Game log ordering fixed**: Land resolve events now always appear in the log before the turn-change entry.
- **Counter log fixed**: "X counters!" now only fires when a counter is actually submitted, not when the counter window opens.
- **Text chat added**: Expandable chat panel on the left side of the board. Messages also appear in the game log. Available in both multiplayer and single-player (for testing).
- **AI strategic improvements**:
  - Win card timing: AI weighs counter risk, CC defense availability, duplicate win cards, and deck replenishment ratio when deciding whether to play a winning card or set up first
  - deferWin mode: when deferring, Black scores 900 (strip their counter), Red scores 820 (disrupt), Blue scores low (save for CC), Green retrieving a Blue scores 850 (build CC defense)
  - Black pick prioritisation: when holding the winning card, discarding opponent's Blue is ranked above their win-path color
  - CC with blue surplus: counter-counter more liberally when 3+ Blues available
  - Improved Red/Green counter threat estimation (target unknown at counter time, uses field/graveyard composition)

### v0.1.0 — Initial Release
- Full 2-player game with all 5 land types and effects
- Counter / counter-counter chain system
- Configurable counter time limit (or infinite)
- Rock-paper-scissors to decide who goes first
- Card and field customization (rename land types per player)
- Single-player mode with Easy / Medium / Hard AI
- Multiplayer over local network via room codes
- Graveyard viewer
- Game log panel
- Electron wrapper for portable Windows distribution
