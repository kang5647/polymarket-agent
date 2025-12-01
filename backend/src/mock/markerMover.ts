// Global mock state to preserve price between calls
let MOCK_PRICE_STATE: Record<string, number> = {};

function smoothPrice(oldValue: number | undefined) {
	if (oldValue == null) {
		// Should never occur now because we initialize manually
		return Math.random() * 0.5 + 0.25;
	}

	let newValue = oldValue;

	// Slow drift
	const smallStep = (Math.random() * 0.009 + 0.001) * (Math.random() < 0.5 ? -1 : 1);
	newValue += smallStep;

	// Rare spike
	if (Math.random() < 0.02) {
		const spike = (Math.random() * 0.15 + 0.05) * (Math.random() < 0.5 ? -1 : 1);
		newValue += spike;
	}

	// Clamp
	return Math.max(0.05, Math.min(0.95, newValue));
}

export async function runMarketMoverMock(env: any, userId: string) {
	// Load bot config
	const config = await env.DB.prepare(
		`SELECT market_id, market_name, target_yes, target_no, direction
     FROM market_mover
     WHERE user_id=?
	 ORDER BY created_at DESC
   	 LIMIT 1`
	)
		.bind(userId)
		.first();

	if (!config) {
		return { ok: false, reason: 'No Market Mover config found' };
	}
	console.log('target-yes ', config.target_yes);

	const prev = MOCK_PRICE_STATE[userId];

	// ======================================================
	//  INITIALIZATION LOGIC — start above target thresholds
	// ======================================================
	let priceYes: number;

	if (prev == null) {
		if (config.target_yes != null) {
			const base = config.target_yes;
			const range = base * 0.3; // ±30% relative
			const deviation = (Math.random() * 2 - 1) * range; // random in [-range, +range]
			priceYes = base + deviation;
		} else if (config.target_no != null) {
			// Convert NO target → YES equivalent
			const base = 1 - config.target_no;
			const range = base * 0.3;
			const deviation = (Math.random() * 2 - 1) * range;
			priceYes = base + deviation;
		} else {
			priceYes = Math.random() * 0.5 + 0.25; // fallback
		}

		// Clamp to a realistic PM range
		priceYes = Math.max(0.01, Math.min(0.99, priceYes));
	} else {
		// Normal smooth drift
		priceYes = smoothPrice(prev);
	}

	MOCK_PRICE_STATE[userId] = priceYes;

	const priceNo = 1 - priceYes;

	// -----------------------------------------------------
	// Target checking
	// -----------------------------------------------------
	let alertMessage = null;

	if (config.direction === 'buy') {
		// BUY means user wants a cheap entry (<= target)
		if (config.target_yes != null && priceYes <= config.target_yes) {
			alertMessage = `BUY signal triggered: YES price (${priceYes.toFixed(3)}) <= ${config.target_yes}`;
		}
		if (config.target_no != null && priceNo <= config.target_no) {
			alertMessage = `BUY signal triggered: NO price (${priceNo.toFixed(3)}) <= ${config.target_no}`;
		}
	}

	if (config.direction === 'sell') {
		// SELL means user wants high price (>= target)
		if (config.target_yes != null && priceYes >= config.target_yes) {
			alertMessage = `SELL signal triggered: YES price (${priceYes.toFixed(3)}) >= ${config.target_yes}`;
		}
		if (config.target_no != null && priceNo >= config.target_no) {
			alertMessage = `SELL signal triggered: NO price (${priceNo.toFixed(3)}) >= ${config.target_no}`;
		}
	}
	return {
		ok: true,
		marketId: config.market_id,
		marketName: config.market_name,

		priceYes,
		priceNo,

		targetYes: config.target_yes,
		targetNo: config.target_no,

		direction: config.direction,

		alert: alertMessage,
		timestamp: new Date().toISOString(),
	};
}
