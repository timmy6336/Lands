# Lands

A 2-player land card game with effects, counters, and an AI opponent. Playable locally (single-player vs AI) or over a local network (multiplayer).

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
- Tracks cards seen via Black effect reveals
- Estimates counter risk using binomial probability of opponent's hand contents
- Defers playing a winning card when counter risk is high and no CC defense is available
- In deferral mode: prioritises Black (strip their counter), Red (disrupt), Green retrieval of Blue (build CC defense)
- When holding a winning card, prioritises discarding opponent's Blue lands during Black effect
- Considers duplicate win cards as bait to burn opponent's counter resources
- Counter-counter more liberally when holding 3+ Blue cards (surplus)

---

## Version History

### v0.3.1 — Current
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
