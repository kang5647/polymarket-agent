import { PolymarketMcpServer } from './server.ts';
// Export the PolymarketMcpServer class for Durable Object binding
export { PolymarketMcpServer };

// Worker entrypoint for handling incoming requests
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const sessionIdStr = url.searchParams.get('sessionId');

		// Generate a Durable Object ID - either from a valid hex string or create a new one
		let id;
		if (sessionIdStr && /^[0-9a-fA-F]{64}$/.test(sessionIdStr)) {
			// If sessionId is a valid 64-character hex string, use it
			id = env.POLYMARKET_MCP_SERVER.idFromString(sessionIdStr);
		} else if (sessionIdStr) {
			// If sessionId exists but isn't valid hex, derive ID from the name
			id = env.POLYMARKET_MCP_SERVER.idFromName(sessionIdStr);
		} else {
			// No sessionId provided, create a new unique ID
			id = env.POLYMARKET_MCP_SERVER.newUniqueId();
		}

		console.log(`Fetching sessionId: ${sessionIdStr} with id: ${id}`);

		// Update the URL with the actual Durable Object ID
		url.searchParams.set('sessionId', id.toString());

		return env.POLYMARKET_MCP_SERVER.get(id).fetch(new Request(url.toString(), request));
	},
};
