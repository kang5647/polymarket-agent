import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PolymarketRepository } from '../../repository.ts';

export function setupGetTrendingMarketsTool(server: McpServer, repo: PolymarketRepository) {
	server.tool(
		'get_trending_markets',
		'Get top-volume trending markets from Polymarket',
		{
			limit: z.number().optional().describe('Number of top markets to fetch (default 5)'),
			offset: z.number().optional().describe('Pagination offset (default 0)'),
		},
		async ({ limit = 5, offset = 0 }: { limit?: number; offset?: number }) => {
			try {
				// === 1️⃣ Build the API URL ===
				const url = `https://gamma-api.polymarket.com/markets?order=volumeNum&ascending=false&closed=false&limit=${limit}&offset=${offset}`;
				console.log(`🔍 Fetching Polymarket markets by volume: ${url}`);

				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch top markets`);

				// === 2️⃣ Parse and validate the data ===
				const data = await res.json();
				if (!Array.isArray(data)) throw new Error('Unexpected response format: expected array');

				console.log(`📊 Retrieved ${data.length} high-volume markets`);

				// === 3️⃣ Simplify for trader display ===
				const topMarkets = data.map((m: any) => {
					let outcomes: string[] = [];
					try {
						if (typeof m.outcomes === 'string') outcomes = JSON.parse(m.outcomes);
						else if (Array.isArray(m.outcomes)) outcomes = m.outcomes;
					} catch {
						outcomes = [];
					}

					return {
						id: m.id,
						title: m.question || 'Untitled Market',
						category: m.category || 'Uncategorized',
						description: m.description || '',
						image: m.image || '',
						volumeNum: m.volumeNum || 0,
						volume24hr: m.volume24hr ?? 0,
						liquidityNum: m.liquidityNum || 0,
						outcomes,
						outcomePrices: m.outcomePrices,
						bestBid: m.bestBid ?? null,
						bestAsk: m.bestAsk ?? null,
						enableOrderBook: m.enableOrderBook ?? false,
						lastTradePrice: m.lastTradePrice ?? null,
						startDate: m.startDate || '',
						endDate: m.endDate || '',
					};
				});

				await repo.saveMarketSnapshot(topMarkets);

				console.log(`✅ Simplified ${topMarkets.length} top-volume markets`);

				// === 4️⃣ Return in MCP-compatible format ===
				const payload = { topVolumeMarkets: topMarkets };

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(payload, null, 2),
						},
					],
				};
			} catch (err) {
				console.error('❌ Error fetching top volume markets:', err);
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error fetching top volume markets: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		}
	);
}
