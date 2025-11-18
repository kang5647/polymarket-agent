declare global {
	interface Env {
		POLYMARKET_MCP_SERVER: DurableObjectNamespace;
		PRIVATE_KEY?: string;
		RPC_URL?: string;
		POLYMARKET_API?: string;
	}
}

export {};
