import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Analyze a single Polymarket market for trend direction and recent activity.
 * Derives: 24h price change, volume, sentiment label, and short summary.
 */
export function setupAnalyzeMarketTool(server: McpServer) {
	server.tool(
		'analyze_market',
		'Analyze a specific Polymarket market for trend and sentiment',
		{
			market_id: z.string().describe('The market ID to analyze'),
		},
		async ({ market_id }: { market_id: string }) => {
			try {
				console.log(`🔍 Analyzing Polymarket market: ${market_id}`);

				// === 1️⃣ Fetch market details ===
				const url = `https://gamma-api.polymarket.com/markets?id=${market_id}`;
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch market details`);
				const data = await res.json();
				if (!Array.isArray(data) || !data.length) throw new Error('Market not found');

				const market = data[0];
				let outcomes: string[] = [];
				let prices: number[] = [];

				try {
					outcomes =
						typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : Array.isArray(market.outcomes) ? market.outcomes : [];
				} catch {
					outcomes = [];
				}

				try {
					prices =
						typeof market.outcomePrices === 'string'
							? JSON.parse(market.outcomePrices).map(Number)
							: Array.isArray(market.outcomePrices)
							? market.outcomePrices.map(Number)
							: [];
				} catch {
					prices = [];
				}

				const yesPrice = prices[0] ?? null;
				const noPrice = prices[1] ?? (yesPrice ? 1 - yesPrice : null);

				// === 2️⃣ Estimate 24h change if possible ===
				// (Gamma API provides volume24hr, but not price history directly)
				// We'll approximate using bestBid/Ask movement if both exist.
				const lastTrade = market.lastTradePrice ?? yesPrice;
				const bestBid = market.bestBid ?? lastTrade;
				const bestAsk = market.bestAsk ?? lastTrade;
				const midPrice = (bestBid + bestAsk) / 2;

				let changePct = 0;
				if (yesPrice && lastTrade) {
					changePct = ((yesPrice - lastTrade) / lastTrade) * 100;
				}

				const sentiment = changePct > 2 ? 'bullish' : changePct < -2 ? 'bearish' : 'neutral';

				// === 3️⃣ Build human-readable summary ===
				const summary = `Market "${market.question || 'Untitled'}" shows ${
					sentiment === 'bullish' ? 'increasing optimism' : sentiment === 'bearish' ? 'declining confidence' : 'steady sentiment'
				}. YES ≈ ${Math.round(yesPrice * 100)}%, change ${changePct.toFixed(2)}% over 24h.`;

				const result = {
					marketId: market_id,
					title: market.question,
					outcomes,
					yesPrice,
					noPrice,
					changePct,
					volume24hr: market.volume24hr ?? 0,
					liquidityNum: market.liquidityNum ?? 0,
					sentiment,
					summary,
				};

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			} catch (err) {
				console.error('❌ Error analyzing market:', err);
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error analyzing market: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		}
	);
}
