import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	vi,
} from '../$node_modules/.pnpm/vitest@3.2.4_@types+node@24.10.0/$node_modules/vitest/dist/index.js';
import { Client } from '../$node_modules/.pnpm/@modelcontextprotocol+sdk@1.17.4/$node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { WorkerSSEClientTransport } from '../$node_modules/.pnpm/@nullshot+test-utils@0.3.1/$node_modules/@nullshot/test-utils/dist/index.js';
import { WorkerWebSocketClientTransport } from '../$node_modules/.pnpm/@nullshot+test-utils@0.3.1/$node_modules/@nullshot/test-utils/dist/index.js';

describe('MCP Client Connection Tests', () => {
	const baseUrl = 'http://localhost';
	const wsBaseUrl = 'ws://localhost';

	// Define transport configurations
	const transportConfigs = [
		{
			name: 'SSE',
			createTransport: (ctx: ExecutionContext) => {
				const url = new URL(`${baseUrl}/sse`);
				return new WorkerSSEClientTransport(url, ctx);
			},
		},
		{
			name: 'WebSocket',
			createTransport: (ctx: ExecutionContext) => {
				const url = new URL(`${wsBaseUrl}/ws`);
				return new WorkerWebSocketClientTransport(url, ctx);
			},
		},
	];

	// Parameterized tests for each transport type
	describe.each(transportConfigs)('$name Transport', (transportConfig) => {
		let client: Client;
		let ctx: ExecutionContext;

		beforeEach(async () => {
			console.log(`--------- ${transportConfig.name} TEST STARTING ---------`);
			ctx = createExecutionContext();

			// Create a new client
			client = new Client({
				name: 'test-client',
				version: '1.0.0',
			});

			console.log(`Created MCP Client for ${transportConfig.name} testing`);
		});

		afterEach(async () => {
			console.log(`--------- ${transportConfig.name} TEST ENDING ---------`);
			try {
				await client.close();
				console.log(`${transportConfig.name} client closed successfully`);
			} catch (err) {
				console.warn(`Error closing ${transportConfig.name} client:`, err);
			}
		});

		it('should successfully connect to the mcp server', async () => {
			console.log(`Testing ${transportConfig.name} transport connection`);

			const transport = transportConfig.createTransport(ctx);
			await client.connect(transport);

			await waitOnExecutionContext(ctx);
			console.log(`${transportConfig.name} client connection test passed!`);
		});

		it('should return server version matching the implementation', async () => {
			console.log(`Testing ${transportConfig.name} server version`);

			const transport = transportConfig.createTransport(ctx);
			await client.connect(transport);

			const serverInfo = await client.getServerVersion();

			// Verify that serverInfo is defined
			expect(serverInfo).not.toBeUndefined();

			if (serverInfo) {
				// Expected values from TestHonoServer's getImplementation method
				expect(serverInfo.name).toBe('ExampleMcpServer');
				expect(serverInfo.version).toBe('1.0.0');
			}

			await waitOnExecutionContext(ctx);
			console.log(`${transportConfig.name} server version test passed!`);
		});
	});
});
