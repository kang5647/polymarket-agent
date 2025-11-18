# Polymarket MCP Server

A full-featured Model Context Protocol (MCP) server that provides tools for interacting with Polymarket prediction markets. This server follows the official NullShot MCP Framework structure and exposes 7 tools for reading market data and performing trades.

## 🚀 Features

The Polymarket MCP Server provides the following tools:

### 📊 Market Data Tools

- **`get_active_markets`** - Fetch currently active prediction markets
- **`get_market_details`** - Get detailed information about a specific market
- **`search_markets`** - Search markets by keyword
- **`get_market_prices`** - Get current YES/NO prices for any market
- **`get_trending_markets`** - Get top-volume trending markets

### 💰 Trading Tools

- **`place_order`** - Place YES/NO orders on markets
- **`get_orders`** - Retrieve user's active and filled orders

## 🏗️ Project Structure

```
polymarket-mcp/
├── src/
│   ├── index.ts          # Worker entrypoint and routing
│   ├── server.ts         # PolymarketMcpServer class
│   ├── tools.ts          # All 7 Polymarket tools
│   ├── resources.ts      # MCP resources (placeholder)
│   └── prompts.ts        # MCP prompts (placeholder)
├── wrangler.jsonc        # Cloudflare Workers configuration
├── package.json          # Dependencies and scripts
├── worker-configuration.d.ts  # TypeScript type definitions
└── .env.example          # Environment variables template
```

## ⚙️ Setup

### Prerequisites

- Node.js v20+ (required for Wrangler)
- pnpm package manager

### Installation

1. **Clone and install dependencies:**

```bash
cd polymarket-mcp
pnpm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your values
```

3. **Required Environment Variables:**

```bash
# Your Ethereum private key for trading on Polymarket
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Polygon RPC URL (optional, has default)
RPC_URL=https://polygon-rpc.com

# Polymarket API endpoint (optional, has default)
POLYMARKET_API=https://clob.polymarket.com
```

### Development

```bash
# Start development server
pnpm dev

# Build and type check
pnpm build

# Run tests
pnpm test
```

## 🔧 Tool Specifications

### get_active_markets

Fetches currently active prediction markets from Polymarket.

**Parameters:**

- `limit?: number` - Maximum number of markets to return (default: 50)

**Returns:**

```typescript
{
  content: [{ type: "text", text: string }],
  markets: Array<{
    id: string,
    question: string,
    description: string,
    end_date: string,
    volume: number,
    liquidity: number
  }>
}
```

### get_market_details

Get detailed information about a specific Polymarket market.

**Parameters:**

- `market_id: string` - The ID of the market to get details for

**Returns:**

```typescript
{
  content: [{ type: "text", text: string }],
  market: {
    id: string,
    question: string,
    description: string,
    end_date: string,
    volume: number,
    liquidity: number,
    outcomes: string[],
    creator: string,
    resolved: boolean,
    resolution: string | null
  }
}
```

### search_markets

Search Polymarket markets by keyword.

**Parameters:**

- `keyword: string` - The keyword to search for in market questions
- `limit?: number` - Maximum number of results to return (default: 20)

### get_market_prices

Get current YES/NO prices for a Polymarket market.

**Parameters:**

- `market_id: string` - The ID of the market to get prices for

**Returns:**

```typescript
{
  content: [{ type: "text", text: string }],
  prices: {
    market_id: string,
    yes_bid: number | null,
    yes_ask: number | null,
    no_bid: number | null,
    no_ask: number | null,
    timestamp: string
  }
}
```

### get_trending_markets

Get top-volume trending markets from Polymarket.

**Parameters:**

- `limit?: number` - Maximum number of trending markets to return (default: 10)

### place_order

Place a YES/NO order on a Polymarket market.

**Parameters:**

- `market_id: string` - The ID of the market to place an order on
- `side: 'buy_yes' | 'buy_no' | 'sell_yes' | 'sell_no'` - The side of the order
- `amount: number` - The amount to trade in USDC
- `price: number` - The price per share (between 0.01 and 0.99)

**Returns:**

```typescript
{
  content: [{ type: "text", text: string }],
  order: {
    id: string,
    market_id: string,
    side: string,
    amount: number,
    price: number,
    status: string,
    timestamp: string
  }
}
```

### get_orders

Retrieve user's active and filled orders from Polymarket.

**Returns:**

```typescript
{
  content: [{ type: "text", text: string }],
  orders: Array<{
    id: string,
    market_id: string,
    side: string,
    outcome: string,
    amount: number,
    price: number,
    status: string,
    created_at: string,
    filled_amount: number
  }>
}
```

## 🚨 Current Implementation Status

**Note:** The current implementation uses mock data for all tools to ensure the server compiles and runs correctly. To enable real Polymarket integration:

1. Set up your `PRIVATE_KEY` environment variable
2. Update the tools in `src/tools.ts` to use the actual Polymarket SDK calls
3. The Polymarket dependencies (`@polymarket/clob-client`, `@polymarket/sdk`, `ethers`) are already installed

The mock implementation provides the exact same API structure as the real implementation would, making it easy to swap in real data.

## 🔗 Usage with NullShot Agent

Add this server to your MCP configuration:

```json
{
	"mcpServers": {
		"polymarket_mcp": {
			"command": "pnpm",
			"args": ["dev"],
			"cwd": "/path/to/polymarket-mcp"
		}
	}
}
```

## 📚 Dependencies

- **@modelcontextprotocol/sdk** - MCP SDK for server implementation
- **@nullshot/mcp** - NullShot MCP framework base classes
- **@polymarket/clob-client** - Polymarket orderbook client
- **@polymarket/sdk** - Official Polymarket SDK
- **ethers** - Ethereum library for blockchain interactions
- **zod** - TypeScript-first schema validation

## 🛠️ Development

The server uses:

- **TypeScript** for type safety
- **Cloudflare Workers** runtime for deployment
- **Vitest** for testing
- **Wrangler** for local development and deployment

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Ready to trade on Polymarket with AI agents!** 🤖📈
