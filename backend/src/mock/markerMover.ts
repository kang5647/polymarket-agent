// Global mock state to preserve price between calls
let MOCK_PRICE_STATE: Record<string, number> = {};

function smoothPrice(oldValue: number | undefined) {
	// If no previous value exists → initialize
	if (oldValue == null) {
		return Math.random() * 0.5 + 0.25; // 0.25–0.75 initial
	}

	let newValue = oldValue;

	// --- Slow normal drift ---
	const smallStep = (Math.random() * 0.009 + 0.001) * (Math.random() < 0.5 ? -1 : 1);
	newValue += smallStep;

	// --- Occasional spike (2% chance) ---
	if (Math.random() < 0.02) {
		const spike = (Math.random() * 0.15 + 0.05) * (Math.random() < 0.5 ? -1 : 1);
		newValue += spike;
	}

	// Clamp between 5%–95%
	newValue = Math.max(0.05, Math.min(0.95, newValue));

	return newValue;
}

export async function runMarketMoverMock(env: any, userId: string) {
	// Load config
	const config = await env.DB.prepare(
		`SELECT market_id, market_name, target_yes, target_no
     FROM market_mover
     WHERE user_id=?`
	)
		.bind(userId)
		.first();

	if (!config) {
		return { ok: false, reason: 'No Market Mover config found' };
	}

	// ---- Smooth fluctuating prices ----
	const prev = MOCK_PRICE_STATE[userId];
	const priceYes = smoothPrice(prev);
	MOCK_PRICE_STATE[userId] = priceYes;

	const priceNo = 1 - priceYes;

	// ---- Target checking ----
	let alertTriggered = false;
	let alertMessage = null;

	if (config.target_yes != null && priceYes >= config.target_yes) {
		alertTriggered = true;
		alertMessage = `YES price reached target ${config.target_yes}`;
	}

	if (config.target_no != null && priceNo <= config.target_no) {
		alertTriggered = true;
		alertMessage = `NO price reached target ${config.target_no}`;
	}

	return {
		ok: true,
		marketId: config.market_id,
		marketName: config.market_name,

		priceYes,
		priceNo,

		targetYes: config.target_yes,
		targetNo: config.target_no,

		alert: alertMessage,
		timestamp: new Date().toISOString(),
	};
}
