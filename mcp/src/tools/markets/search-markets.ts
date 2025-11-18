import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupSearchMarketsTool(server: McpServer) {
	server.tool(
		'search_markets',
		'Search Polymarket markets by keyword',
		{
			query: z.string().describe('Search query for Polymarket (e.g. "crypto", "bitcoin", "trump")'),
			events_status: z.enum(['active', 'closed']).optional().describe('Filter events by status: active (default) or closed'),
			limit_per_type: z.number().optional().describe('Number of results per type (default 5)'),
			page: z.number().optional().describe('Pagination page number (default 1)'),
		},
		async ({
			query,
			events_status = 'active',
			limit_per_type = 5,
			page = 1,
		}: {
			query: string;
			events_status?: 'active' | 'closed';
			limit_per_type?: number;
			page?: number;
		}) => {
			try {
				// === 1️⃣ Build search request ===
				const url = `https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(
					query
				)}&events_status=${events_status}&limit_per_type=${limit_per_type}&page=${page}`;
				console.log(`🔍 Searching Polymarket Gamma API: ${url}`);

				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to search events`);

				// === 2️⃣ Parse and validate response ===
				const data = await res.json();
				if (!data || typeof data !== 'object' || !Array.isArray(data.events)) {
					console.error('⚠️ Unexpected response structure:', data);
					throw new Error("Unexpected response format: missing 'events' array");
				}

				const events = data.events;
				console.log(`📊 Retrieved ${events.length} matching events for query "${query}"`);

				// === 3️⃣ Simplify each event ===
				const simplifiedEvents = events.map((ev: any) => {
					const markets = Array.isArray(ev.markets)
						? ev.markets.map((m: any) => {
								let outcomes: string[] = [];
								let prices: number[] = [];

								try {
									outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : Array.isArray(m.outcomes) ? m.outcomes : [];
								} catch {
									outcomes = [];
								}

								try {
									prices =
										typeof m.outcomePrices === 'string'
											? JSON.parse(m.outcomePrices).map(Number)
											: Array.isArray(m.outcomePrices)
											? m.outcomePrices.map(Number)
											: [];
								} catch {
									prices = [];
								}

								return {
									id: m.id,
									question: m.question || 'Untitled market',
									outcomes,
									outcomePrices: prices,
									bestBid: m.bestBid ?? null,
									bestAsk: m.bestAsk ?? null,
									volumeNum: m.volumeNum ?? 0,
									liquidityNum: m.liquidityNum ?? 0,
									enableOrderBook: m.enableOrderBook ?? false,
									resolved: m.closed ?? false,
									lastTradePrice: m.lastTradePrice ?? null,
								};
						  })
						: [];

					return {
						id: ev.id,
						title: ev.title || 'Untitled Event',
						slug: ev.slug || '',
						category: ev.category || 'Uncategorized',
						description: ev.description || '',
						image: ev.image || '',
						startDate: ev.startDate || '',
						endDate: ev.endDate || '',
						volume: ev.volume || ev.volumeNum || 0,
						marketsCount: markets.length,
						markets,
					};
				});

				console.log(`✅ Processed ${simplifiedEvents.length} events for "${query}"`);

				// === 4️⃣ Return results in MCP format ===
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({ query, results: simplifiedEvents }, null, 2),
						},
					],
				};
			} catch (err) {
				console.error('❌ Error searching Polymarket events:', err);
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error searching Polymarket events: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		}
	);
}
