import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupGetActiveMarketsTool } from './tools/markets/get-active-markets.ts';
import { setupGetMarketDetailsTool } from './tools/markets/get-market-details.ts';
import { setupSearchMarketsTool } from './tools/markets/search-markets.ts';
import { setupGetTrendingMarketsTool } from './tools/markets/get-trending-markets.ts';

import { setupAnalyzeMarketTool } from './tools/intelligence/analyze-market.ts';
import { setupFindAnomaliesTool } from './tools/intelligence/find-anomalies.ts';
import { PolymarketRepository } from './repository.ts';
import { setupListBotsTool } from './tools/bots/list-bots.ts';
import { setupRunMarketMoverTool } from './tools/bots/run-market-mover.ts';

import { setupPrepareTradeTool } from './tools/trade/prepare-trade.ts';

/**
 * Set up all Polymarket tools for the MCP server
 */
export function setupServerTools(server: McpServer, repo: PolymarketRepository, env: Env): void {
	// Market data tools
	setupGetActiveMarketsTool(server);
	setupGetMarketDetailsTool(server);
	setupSearchMarketsTool(server);
	setupGetTrendingMarketsTool(server, repo);

	// Intelligence tools
	setupAnalyzeMarketTool(server);
	setupFindAnomaliesTool(server, repo);

	// Bot tools
	setupListBotsTool(server, env);
	setupRunMarketMoverTool(server, env);

	// Trade tools
	setupPrepareTradeTool(server, env);

	console.log('🔧 Toolbox Service: Initializing configured tools');
}
