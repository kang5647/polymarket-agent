import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupGetMarketDetailsTool(server: McpServer) {
	server.tool(
		'get_market_details',
		'Get detailed information about a specific Polymarket market',
		{
			market_id: z.string().describe('The ID of the market to get details for'),
		},
		async ({ market_id }: { market_id: string }) => {
			try {
				// === 1️⃣ Build API request ===
				const url = `https://gamma-api.polymarket.com/markets?id=${market_id}`;
				console.log(`🔍 Fetching Polymarket market details: ${url}`);

				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch market details`);

				// === 2️⃣ Parse the JSON ===
				const data = await res.json();
				if (!Array.isArray(data)) throw new Error('Unexpected response format: expected array');

				// === 3️⃣ Return the full market object ===
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data, null, 2),
						},
					],
				};
			} catch (error) {
				console.error('❌ Error fetching market details:', error);
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error fetching market details: ${error instanceof Error ? error.message : 'Unknown error'}`,
						},
					],
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		}
	);
}
