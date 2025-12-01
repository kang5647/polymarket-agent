import express from 'express';
import cors from 'cors';
import { env } from 'cloudflare:workers';
import { httpServerHandler } from 'cloudflare:node';
import { AVAILABLE_BOTS } from './configs/bots';
import { runMarketMoverMock } from './mock/markerMover';
const app = express();

app.use(
	cors({
		origin: '*',
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'user-id'],
	})
);

app.use(express.json());

// Simple middleware to identify user
app.use((req, res, next) => {
	req.url = req.url.replace(/\/{2,}/g, '/');

	res.setHeader('Cache-Control', 'no-store');

	const userId = req.headers['user-id'];
	if (!userId) {
		return res.status(400).json({ success: false, error: 'Missing user-id header' });
	}
	// @ts-ignore
	req.userId = String(userId);
	next();
});

// Health check
app.get('/', (req, res) => {
	res.json({ message: 'Polymarket Bot Backend (Multi-tenant) is running!' });
});

// --- List bots for this user ---
app.get('/api/bots', async (req: any, res) => {
	try {
		// 1️⃣ Load user’s bots
		let result = await env.DB.prepare(
			`SELECT id, name, status, last_activated, created_at
       FROM bots
       WHERE user_id=?`
		)
			.bind(req.userId)
			.all();

		let bots = result.results;

		// 2️⃣ Seed missing bots
		for (const def of AVAILABLE_BOTS) {
			const exists = bots.some((b) => b.name === def.name);
			if (!exists) {
				await env.DB.prepare(
					`INSERT INTO bots (user_id, name, status)
           VALUES (?, ?, 'inactive')`
				)
					.bind(req.userId, def.name)
					.run();
			}
		}

		// 3️⃣ Reload fully updated list
		result = await env.DB.prepare(
			`SELECT id, name, status, last_activated, created_at
         FROM bots
         WHERE user_id=?`
		)
			.bind(req.userId)
			.all();
		bots = result.results;

		// 4️⃣ Attach dynamic descriptions
		const enriched = bots.map((b) => {
			const found = AVAILABLE_BOTS.find((x) => x.name === b.name);
			return {
				...b,
				description: found?.description ?? 'Polymarket bot',
			};
		});

		res.json({ success: true, bots: enriched });
	} catch (error) {
		console.error('GET /api/bots error:', error);
		res.status(500).json({ success: false, error: 'Failed to fetch bots' });
	}
});

// --- Deactivate a bot ---
app.post('/api/bots/deactivate', async (req: any, res) => {
	try {
		const { name } = req.body;
		if (!name) return res.status(400).json({ success: false, error: 'Name required' });

		const result = await env.DB.prepare("UPDATE bots SET status='inactive' WHERE user_id=? AND name=?").bind(req.userId, name).run();

		if (result.meta.changes === 0) {
			return res.status(404).json({ success: false, error: 'Bot not found' });
		}

		res.json({ success: true, message: `${name} deactivated for user ${req.userId}` });
	} catch (error) {
		console.error('Deactivate error:', error);
		res.status(500).json({ success: false, error: 'Failed to deactivate bot' });
	}
});

app.post('/api/bots/market-mover/activate', async (req: any, res) => {
	try {
		const { marketId, marketName, targetYes, targetNo, direction } = req.body;

		if (!marketId || !marketName) {
			return res.status(400).json({
				success: false,
				error: 'marketId and marketName are required',
			});
		}

		if (targetYes === null && targetNo === null) {
			return res.status(400).json({
				success: false,
				error: 'At least one of targetYes or targetNo required',
			});
		}

		// ensure bot exists
		await env.DB.prepare(
			`
      INSERT OR IGNORE INTO bots (user_id, name, status)
      VALUES (?, 'Market Mover Bot', 'inactive')
    `
		)
			.bind(req.userId)
			.run();

		// activate bot
		await env.DB.prepare(
			`
      UPDATE bots SET status='active', last_activated=datetime('now')
      WHERE user_id=? AND name='Market Mover Bot'
    `
		)
			.bind(req.userId)
			.run();

		// save config
		await env.DB.prepare(
			`
	INSERT OR REPLACE INTO market_mover
	(user_id, market_id, market_name, target_yes, target_no, direction)
	VALUES (?, ?, ?, ?, ?, ?)
    `
		)
			.bind(req.userId, marketId, marketName, targetYes, targetNo, direction)
			.run();

		return res.json({
			success: true,
			message: 'Market Mover Bot activated',
			config: { marketId, marketName, targetYes, targetNo },
		});
	} catch (err) {
		console.error('Market Mover Activation Error:', err);
		res.status(500).json({ success: false, error: 'Activation failed' });
	}
});

app.post('/api/bots/market-mover/deactivate', async (req: any, res) => {
	try {
		// mark bot inactive
		await env.DB.prepare(
			`UPDATE bots 
       SET status='inactive'
       WHERE user_id=? AND name='Market Mover Bot'`
		)
			.bind(req.userId)
			.run();

		res.json({ success: true, message: 'Market Mover Bot deactivated' });
	} catch (err) {
		console.error('Deactivate error:', err);
		res.status(500).json({ success: false });
	}
});

app.get('/api/bots/market-mover/status', async (req: any, res) => {
	try {
		// 1️⃣ Check bot activation state
		const bot = await env.DB.prepare(
			`SELECT status
       FROM bots
       WHERE user_id=? AND name='Market Mover Bot'`
		)
			.bind(req.userId)
			.first();

		// If bot missing or inactive → return inactive response
		if (!bot || bot.status !== 'active') {
			return res.json({
				active: false,
				watching: null,
				runner: null,
			});
		}

		// 2️⃣ Load bot config
		const config = await env.DB.prepare(
			`SELECT market_id, market_name, target_yes, target_no, direction
       FROM market_mover
       WHERE user_id=?
	   ORDER BY created_at DESC
       LIMIT 1
	   `
		)
			.bind(req.userId)
			.first();

		if (!config) {
			return res.json({
				active: false,
				watching: null,
				runner: null,
			});
		}

		// 3️⃣ Run mock price generator
		const result = await runMarketMoverMock(env, req.userId);

		// 4️⃣ Return final payload
		return res.json({
			active: true,
			watching: {
				marketId: config.market_id,
				marketName: config.market_name,
				targetYes: config.target_yes,
				targetNo: config.target_no,
				direction: config.direction,
			},
			runner: result,
		});
	} catch (err) {
		console.error('MarketMover Status Error:', err);
		res.status(500).json({ success: false });
	}
});

app.listen(3000);
export default httpServerHandler({ port: 3000 });
