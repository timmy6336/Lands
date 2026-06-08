// ─────────────────────────────────────────────────────────────────────────────
// server/src/shop.ts — skin pack shop REST endpoints
//
// Endpoints:
//   GET  /shop/packs              → { packs: SkinPack[], ownedIds: string[] }
//   POST /shop/checkout           → { granted, pack } | { checkoutUrl }  (requires auth)
//   POST /shop/webhook            → Stripe webhook (when STRIPE_SECRET_KEY is set)
//   POST /profile/equip-pack      → { profile }  (requires auth)
//
// ── Adding a new skin pack ────────────────────────────────────────────────────
//
//  1. Add an entry to the BUILTIN_PACKS array in db.ts.
//     Pick a short snake_case id (e.g. 'autumn').
//     Set price_cents: 0 for free packs or e.g. 499 for $4.99.
//
//  2. Create the card images:
//       client/public/cards/skins/{id}/white.webp
//       client/public/cards/skins/{id}/red.webp
//       client/public/cards/skins/{id}/blue.webp
//       client/public/cards/skins/{id}/green.webp
//       client/public/cards/skins/{id}/black.webp
//       client/public/cards/skins/{id}/back.webp
//       client/public/cards/skins/{id}/preview.webp  ← shown in the shop
//     SVG is also fine — just keep the extension consistent with preview_url in db.ts.
//
//  3. For paid packs: create the product in your Stripe dashboard,
//     copy the price ID and set it in the stripe_price_ids object below.
//     Deploy the server with STRIPE_SECRET_KEY set.
//
// When STRIPE_SECRET_KEY is absent (dev / Electron), checkout immediately
// grants the pack so you can test the full UI without a Stripe account.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllSkinPacks, getUserOwnedPackIds, grantPack, setActivePack,
  findUserById, toPublicProfile,
} from './db';
import { requireAuth, JwtPayload } from './auth';

// Map pack_id → Stripe Price ID for paid packs.
// Add entries here once you create the products in the Stripe dashboard.
const STRIPE_PRICE_IDS: Record<string, string> = {
  // autumn: 'price_XXXXXXXXXXXXXXXXXXXXXX',
};

// ─────────────────────────────────────────────────────────────────────────────

const authMiddleware = requireAuth as (req: Request, res: Response, next: NextFunction) => void;

function getAuth(req: Request): JwtPayload {
  return (req as Request & { auth: JwtPayload }).auth;
}

// ── Shop router ───────────────────────────────────────────────────────────────

export function createShopRouter(): Router {
  const router = Router();

  // GET /shop/packs
  // Returns all packs; if the request includes a valid auth token,
  // also returns which pack IDs the user owns.
  router.get('/packs', async (req, res) => {
    try {
      const packs = await getAllSkinPacks();

      // Optionally resolve owned packs if token is present
      let ownedIds: string[] = [];
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const { verifyToken } = await import('./auth');
        const payload = verifyToken(authHeader.slice(7));
        if (payload) ownedIds = await getUserOwnedPackIds(payload.userId);
      }

      res.json({ packs, ownedIds });
    } catch (err) {
      console.error('[shop] GET /packs error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /shop/checkout   body: { packId: string }
  // Dev/Electron mode (no STRIPE_SECRET_KEY): immediately grants the pack.
  // Production mode: creates a Stripe Checkout session and returns the URL.
  router.post('/checkout', authMiddleware, async (req, res) => {
    try {
      const { packId } = req.body as { packId?: string };
      if (!packId) { res.status(400).json({ error: 'packId is required' }); return; }

      const auth = getAuth(req);

      // Verify the pack exists
      const packs = await getAllSkinPacks();
      const pack = packs.find(p => p.id === packId);
      if (!pack) { res.status(404).json({ error: 'Pack not found' }); return; }

      // Free packs — always grant immediately
      if (pack.price_cents === 0) {
        await grantPack(auth.userId, packId);
        res.json({ granted: true, pack });
        return;
      }

      // Already owned
      const owned = await getUserOwnedPackIds(auth.userId);
      if (owned.includes(packId)) {
        res.json({ granted: true, pack });
        return;
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeKey) {
        // ── Dev / Electron mode: grant immediately without payment ────────────
        console.log(`[shop] DEV MODE — granting pack '${packId}' to user '${auth.username}' without payment`);
        await grantPack(auth.userId, packId);
        res.json({ granted: true, pack, _devMode: true });
        return;
      }

      // ── Production: real Stripe Checkout session ──────────────────────────
      // Install stripe: npm install stripe (when going to production)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require('stripe') as typeof import('stripe').default;
      const stripe = new Stripe(stripeKey, { apiVersion: '2026-01-28.clover' });

      const priceId = STRIPE_PRICE_IDS[packId];
      if (!priceId) {
        res.status(500).json({ error: `No Stripe price ID configured for pack '${packId}'` });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        metadata: { userId: auth.userId, packId },
        success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}?checkout=success&pack=${packId}`,
        cancel_url:  `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}?checkout=cancel`,
      });

      res.json({ checkoutUrl: session.url });
    } catch (err) {
      console.error('[shop] POST /checkout error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /shop/webhook  (Stripe sends this after successful payment)
  // Must be mounted before express.json() globally — raw body required for sig check.
  // In dev (no STRIPE_WEBHOOK_SECRET) just parses JSON for manual testing.
  router.post('/webhook', async (req, res) => {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: { type: string; data: { object: Record<string, unknown> } };

      if (webhookSecret) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Stripe = require('stripe') as typeof import('stripe').default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' });
        const sig = req.headers['stripe-signature'] as string;
        try {
          event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret) as unknown as typeof event;
        } catch {
          res.status(400).json({ error: 'Invalid webhook signature' });
          return;
        }
      } else {
        // Dev: accept raw JSON body
        event = req.body as typeof event;
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: { userId?: string; packId?: string } };
        const userId = session.metadata?.userId;
        const packId = session.metadata?.packId;
        if (userId && packId) {
          await grantPack(userId, packId);
          console.log(`[shop] Granted pack '${packId}' to user '${userId}' via webhook`);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error('[shop] webhook error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

// ── Equip-pack route (lives under /profile) ───────────────────────────────────

export function createEquipPackRouter(): Router {
  const router = Router();

  // POST /profile/equip-pack   body: { packId: string | null }
  router.post('/equip-pack', authMiddleware, async (req, res) => {
    try {
      const { packId } = req.body as { packId?: string | null };
      const auth = getAuth(req);

      if (packId !== null && packId !== undefined) {
        // Verify ownership (free packs are universally owned; paid require a purchase)
        const packs = await getAllSkinPacks();
        const pack  = packs.find(p => p.id === packId);
        if (!pack) { res.status(404).json({ error: 'Pack not found' }); return; }

        if (pack.price_cents > 0) {
          const owned = await getUserOwnedPackIds(auth.userId);
          if (!owned.includes(packId)) {
            res.status(403).json({ error: 'You do not own this pack' });
            return;
          }
        }
      }

      await setActivePack(auth.userId, packId ?? null);

      const user    = await findUserById(auth.userId);
      const ownedIds = await getUserOwnedPackIds(auth.userId);
      res.json({ profile: toPublicProfile(user!, ownedIds) });
    } catch (err) {
      console.error('[profile] equip-pack error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}
