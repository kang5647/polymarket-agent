import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@nullshot/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupServerTools } from './tools.ts';
import { setupPolymarketResources } from './resources.ts';
import { setupServerPrompts } from './prompts.ts';
import { PolymarketRepository } from './repository.ts';

/**
 * PolymarketMcpServer extends McpHonoServerDO for Polymarket trading operations
 */
export class PolymarketMcpServer extends McpHonoServerDO<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * Implementation of the required abstract method
	 */
	getImplementation(): Implementation {
		return {
			name: 'PolymarketMcpServer',
			version: '1.0.0',
		};
	}

	/**
	 * Implements the required abstract configureServer method
	 * Registers Polymarket tools for the MCP server
	 */
	configureServer(server: McpServer): void {
		const repo = new PolymarketRepository(this.ctx); // ✅ pass DurableObjectState
		repo.initializeDatabase(); // ✅ initialize tables
		setupPolymarketResources(server, repo);
		// Set up tools and resources for Polymarket operations
		setupServerTools(server, repo, this.env);
		setupServerPrompts(server);
	}
}
