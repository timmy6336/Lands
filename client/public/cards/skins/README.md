# Card Skin Packs

Each skin pack lives in its own folder here, named by the pack's `id`.

## Folder Structure

```
client/public/cards/skins/
├── README.md           ← this file
├── default/
│   └── preview.webp    ← shop preview image for the Classic pack
├── autumn/             ← example paid pack
│   ├── preview.webp    ← shown in the shop grid (recommended 400×260 px)
│   ├── white.webp      ← replaces /cards/white.svg for players with this pack
│   ├── red.webp
│   ├── blue.webp
│   ├── green.webp
│   ├── black.webp
│   └── back.webp       ← card back texture
└── ...
```

## Adding a New Pack — Checklist

### 1. Server: register the pack

Open `server/src/db.ts` and add an entry to `BUILTIN_PACKS`:

```ts
{
  id: 'autumn',
  name: 'Autumn Lands',
  description: 'Warm fall tones for every land type.',
  price_cents: 499,           // 0 = free
  preview_url: '/cards/skins/autumn/preview.webp',
  released_at: new Date().toISOString(),
},
```

Restart the server — it inserts the row on startup via `INSERT OR IGNORE`.

### 2. Client: add image assets

Create `client/public/cards/skins/<packId>/` and place the files listed in
the folder structure above. Use `.webp` for best compression.

Recommended sizes:
- Card face (`white`, `red`, `blue`, `green`, `black`): match existing card SVG dimensions ~200 × 280 px
- `back.webp`: same dimensions
- `preview.webp`: 400 × 260 px landscape thumbnail

### 3. Stripe (paid packs only)

1. Create a **Product** and one-time **Price** in the Stripe dashboard.
2. Copy the Price ID (e.g. `price_1Abc...`) into `STRIPE_PRICE_IDS` in `server/src/shop.ts`:
   ```ts
   const STRIPE_PRICE_IDS: Record<string, string> = {
     autumn: 'price_1Abc...',
   };
   ```
3. Make sure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set in your
   server environment variables (Render → Environment tab).

### Dev / Electron mode

When `STRIPE_SECRET_KEY` is **not** set, `POST /shop/checkout` immediately
grants the pack instead of creating a Stripe session. This lets you test the
full UI flow locally without a Stripe account.
