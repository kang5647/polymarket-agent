import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupRunMarketMoverTool(server: McpServer, env: any) {
	server.tool(
		'run_market_mover',
		'Activate and run the Market Mover bot. NOTE: Only ONE of targetYes or targetNo is required. The user can set either a YES trigger or a NO trigger.',
		{
			userId: z.string().describe('User ID running the bot'),
			marketId: z.string().describe('Market ID to track'),
			marketName: z.string().describe('Human-friendly name of the market'),
			targetYes: z.number().nullable().optional().describe('Target YES price trigger'),
			targetNo: z.number().nullable().optional().describe('Target NO price trigger'),
		},
		async ({ userId, marketId, marketName, targetYes = null, targetNo = null }) => {
			try {
				console.log(`🚀 Running Market Mover for user ${userId} | Market ${marketId}`);

				const url = `${env.BOT_BACKEND_URL}/api/bots/market-mover/activate`;

				const res = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'user-id': userId,
					},
					body: JSON.stringify({
						marketId,
						marketName,
						targetYes,
						targetNo,
					}),
				});

				if (!res.ok) {
					throw new Error(`Backend returned ${res.status}`);
				}

				const json = await res.json();

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(json, null, 2),
						},
					],
				};
			} catch (err) {
				console.error('❌ Error running market mover:', err);

				return {
					content: [
						{
							type: 'text',
							text: `❌ Error running Market Mover: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		}
	);
}
