import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

function encodePlaceBetCall(market: string, side: string) {
	function keccak256(str: string) {
		return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
	}

	function hexPad32(hex: string) {
		return hex.padStart(64, '0');
	}

	// Convert string to hex
	const strToHex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');

	return (async () => {
		// Function selector = first 4 bytes of keccak256("placeBet(string,string)")
		const hash = await keccak256('placeBet(string,string)');
		const selector = Array.from(new Uint8Array(hash))
			.slice(0, 4)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		// Encode dynamic strings
		const marketHex = strToHex(market);
		const sideHex = strToHex(side);

		const marketOffset = hexPad32((2 * 32).toString(16));
		const sideOffset = hexPad32((2 * 32 + Math.ceil(marketHex.length / 2) + 32).toString(16));

		const marketLen = hexPad32((marketHex.length / 2).toString(16));
		const sideLen = hexPad32((sideHex.length / 2).toString(16));

		const marketPadded = marketHex.padEnd(Math.ceil(marketHex.length / 64) * 64, '0');
		const sidePadded = sideHex.padEnd(Math.ceil(sideHex.length / 64) * 64, '0');

		return '0x' + selector + marketOffset + sideOffset + marketLen + marketPadded + sideLen + sidePadded;
	})();
}

export function setupPrepareTradeTool(server: McpServer, env: any) {
	server.tool(
		'prepare_trade',
		'Prepare a mock Polymarket YES/NO trade',
		{
			market: z.string(),
			side: z.enum(['YES', 'NO']),
			amountEth: z.number(),
		},
		async ({ market, side, amountEth }) => {
			try {
				const contract = env.MOCK_POLYMARKET_CONTRACT;

				const data = await encodePlaceBetCall(market, side);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									txRequest: {
										to: contract,
										data,
										value: (amountEth * 1e18).toString(),
										chainId: 11155111,
									},
								},
								null,
								2
							),
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ prepare_trade error: ${error}`,
						},
					],
				};
			}
		}
	);
}
