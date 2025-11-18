import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupGetActiveMarketsTool(server: McpServer) {
	server.tool(
		'get_active_markets',
		'Get latest active markets from Polymarket',
		{
			limit: z.number().optional().describe('Number of markets to fetch (default 5)'),
			offset: z.number().optional().describe('Pagination offset (default 0)'),
		},
		async ({ limit = 5, offset = 0 }: { limit?: number; offset?: number }) => {
			try {
				// === 1️⃣ Build API request ===
				const url = `https://gamma-api.polymarket.com/events?order=creationDate&ascending=false&closed=false&limit=${limit}&offset=${offset}`;
				console.log(`🔍 Fetching Polymarket Gamma markets: ${url}`);

				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch markets`);

				// === 2️⃣ Parse and validate response ===
				const data = await res.json();
				if (!Array.isArray(data)) throw new Error('Unexpected response format: expected array');

				console.log(`📊 Retrieved ${data.length} events from Gamma API`);

				// === 3️⃣ Extract and flatten key market info ===
				const activeMarkets = data.map((event: any) => {
					const market = event.markets?.[0] || {}; // Use first market for summary
					let outcomes: string[] = [];

					try {
						if (typeof market.outcomes === 'string') {
							outcomes = JSON.parse(market.outcomes);
						} else if (Array.isArray(market.outcomes)) {
							outcomes = market.outcomes;
						}
					} catch {
						outcomes = [];
					}

					return {
						eventId: event.id,
						marketId: market.id,
						title: event.title || market.question || 'Untitled',
						slug: event.slug || market.slug || '',
						category: event.category || market.category || 'Uncategorized',
						description: market.description || event.description || '',
						image: event.image || market.image || '',
						endDate: event.endDate || market.endDate || '',
						startDate: event.startDate || market.startDate || '',
						outcomes,
						outcomePrices:
							market.outcomePrices && typeof market.outcomePrices === 'string'
								? JSON.parse(market.outcomePrices)
								: market.outcomePrices || [],
						bestBid: market.bestBid ?? null,
						bestAsk: market.bestAsk ?? null,
						lastTradePrice: market.lastTradePrice ?? null,
						volumeNum: market.volumeNum ?? 0,
						volume24hr: market.volume24hr ?? 0,
						liquidityNum: market.liquidityNum ?? 0,
					};
				});

				console.log(`✅ Simplified ${activeMarkets.length} active markets`);

				// === 4️⃣ Wrap inside top-level object ===
				const payload = { activeMarkets };

				// === 5️⃣ Return JSON string ===
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(payload, null, 2),
						},
					],
				};
			} catch (err) {
				console.error('❌ Error fetching active markets:', err);
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error fetching active markets: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		}
	);
}
