import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PolymarketRepository } from '../../repository.ts';

/**
 * Scan Polymarket markets for abnormal price swings, volume surges, or liquidity changes.
 */
export function setupFindAnomaliesTool(server: McpServer, repo: PolymarketRepository) {
	server.tool(
		'find_anomalies',
		'Detect markets with unusual volatility or volume spikes',
		{
			limit: z.number().optional().describe('Number of markets to scan (default 10)'),
			price_threshold: z.number().optional().describe('Absolute % price change threshold (default 10%)'),
			volume_threshold: z.number().optional().describe('Relative volume jump threshold (default 2x)'),
		},
		async ({
			limit = 10,
			price_threshold = 10,
			volume_threshold = 2,
		}: {
			limit?: number;
			price_threshold?: number;
			volume_threshold?: number;
		}) => {
			try {
				console.log(`🔎 Scanning Polymarket for anomalies (limit=${limit})`);

				// === 1️⃣ Fetch latest high-volume markets ===
				const url = `https://gamma-api.polymarket.com/markets?order=volumeNum&ascending=false&closed=false&limit=${limit}`;
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch markets`);
				const data = await res.json();
				if (!Array.isArray(data)) throw new Error('Unexpected response format: expected array');

				// === 2️⃣ Analyze each market ===
				const anomalies: any[] = [];

				for (const m of data) {
					let outcomes: string[] = [];
					let prices: number[] = [];

					try {
						if (typeof m.outcomes === 'string') outcomes = JSON.parse(m.outcomes);
						else if (Array.isArray(m.outcomes)) outcomes = m.outcomes;
					} catch {}

					try {
						prices =
							typeof m.outcomePrices === 'string'
								? JSON.parse(m.outcomePrices).map(Number)
								: Array.isArray(m.outcomePrices)
								? m.outcomePrices.map(Number)
								: [];
					} catch {}

					const yesPrice = prices[0] ?? null;
					const lastTrade = m.lastTradePrice ?? yesPrice;
					const changePct = yesPrice && lastTrade ? ((yesPrice - lastTrade) / lastTrade) * 100 : 0;

					// Relative volume spike heuristic
					const vol24 = m.volume24hr ?? 0;
					const avgVol = m.volumeNum && vol24 ? m.volumeNum / 7 : 0; // assume ~7d average
					const volRatio = avgVol ? vol24 / avgVol : 0;

					// Detect anomalies
					if (Math.abs(changePct) > price_threshold || volRatio > volume_threshold) {
						anomalies.push({
							id: m.id,
							title: m.question || 'Untitled Market',
							category: m.category || 'Uncategorized',
							changePct: Number(changePct.toFixed(2)),
							vol24hr: vol24,
							totalVolume: m.volumeNum,
							volRatio: Number(volRatio.toFixed(2)),
							liquidityNum: m.liquidityNum ?? 0,
							note:
								Math.abs(changePct) > price_threshold
									? `⚠️ Price swing ${changePct.toFixed(1)}%`
									: `⚡ Volume spike ${volRatio.toFixed(1)}× average`,
						});
					}
				}

				console.log(`✅ Found ${anomalies.length} anomalous markets`);

				const payload = { anomalies, count: anomalies.length };

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(payload, null, 2),
						},
					],
				};
			} catch (err) {
				console.error('❌ Error detecting anomalies:', err);
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error detecting anomalies: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		}
	);
}
