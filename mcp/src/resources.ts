// src/resources.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PolymarketRepository } from './repository';

export function setupPolymarketResources(server: McpServer, repo: PolymarketRepository) {
	// 1️⃣ Top 5 markets resource
	server.resource(
		'polymarket-top5', // ✅ unique name
		'resource://polymarket-top5', // ✅ unique URI
		async () => {
			const markets = await repo.getRecentMarkets(5); // your DO-backed repo
			const payload = {
				updatedAt: new Date().toISOString(),
				markets,
			};

			return {
				contents: [
					{
						uri: 'resource://polymarket-top5',
						mimeType: 'application/json',
						text: JSON.stringify(payload, null, 2),
					},
				],
			};
		}
	);

	// 2️⃣ Anomaly watchlist resource
	server.resource(
		'polymarket-anomaly-watchlist', // ✅ different name
		'resource://polymarket-anomaly-watchlist', // ✅ different URI
		async () => {
			const anomalies = await repo.getRecentAnomalies(10);
			const payload = {
				updatedAt: new Date().toISOString(),
				anomalies,
			};

			return {
				contents: [
					{
						uri: 'resource://polymarket-anomaly-watchlist',
						mimeType: 'application/json',
						text: JSON.stringify(payload, null, 2),
					},
				],
			};
		}
	);
}
