import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupListBotsTool(server: McpServer, env: any) {
	server.tool(
		'list_bots',
		'Fetch all bots available for a user',
		{
			userId: z.string().describe('The authenticated user ID'),
		},
		async ({ userId }) => {
			try {
				console.log(`🤖 Fetching bots for user: ${userId}`);

				const url = `${env.BOT_BACKEND_URL}/api/bots`;

				const res = await fetch(url, {
					headers: {
						'Content-Type': 'application/json',
						'user-id': userId,
					},
				});

				if (!res.ok) {
					throw new Error(`Backend returned status ${res.status}`);
				}

				const data = await res.json();

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data, null, 2),
						},
					],
				};
			} catch (err) {
				console.error('❌ Error listing bots:', err);
				return {
					content: [
						{
							type: 'text',
							text: `❌ Error listing bots: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		}
	);
}
