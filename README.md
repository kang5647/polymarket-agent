# 🚀 Polymarket Agent Platform

### _AI Agents • MCP Tools • Automated Trading Bots • Market Analyzer_

This project is an exploration of a **full Polymarket ecosystem**, built using the [Nullshot Framework](https://github.com/null-shot) integrating multiple components:

- 🤖 **AI Agent** (LLM UI + tool invocation)
- 🔌 **Model Context Protocol (MCP) Server** providing tools
- 🛠️ **Polymarket Bots** (Market Mover bot MVP)
- 📊 **Market Analyzer (WIP)**
- 📈 **Trading Tools (WIP)**

The current MVP focuses on:

### **➡ Agent → MCP Tool → Bot Activation Flow**

This demonstrates how an AI Agent can autonomously activate a trading bot via MCP tools, update UI state, and drive the user experience.

---
# Architecture Diagram 
<img width="3311" height="2065" alt="omnipoly_architecture_diagram" src="https://github.com/user-attachments/assets/57f9744f-5d47-461d-bab3-0d6accf1203d" />

--- 

# 📂 Project Structure

```
polymarket-agent/
  agent/        → Frontend (Vite + React)
  backend/      → Cloudflare Worker backend (bot API + DB)
  mcp/          → MCP server providing agent tools
  contract/     → (Future) Smart contract integration
```

### **Agent (Frontend)**

- React + Vite UI
- AI Assistant chat interface
- Agent invokes MCP tools
- Bot dashboard + live price monitor
- Thirdweb integration (WIP)

### **Backend**

- Cloudflare Worker API
- Bot activation, status, and simulation logic
- SQLite / D1-based storage
- Market Mover Bot logic (mock execution loop)

### **MCP Server**

- Connects agent to backend tools
- Provides:

  - `run_market_mover`
  - `list_markets`
  - `intelligence` (WIP)
  - other Polymarket utilities (WIP)

- Implements Model Context Protocol (MCP)

---

# 🧠 Agent + MCP + Bot Interaction Flow (MVP)

1. **User chats with the AI agent**
2. Agent decides to activate a bot → calls MCP tool
3. MCP tool calls backend API
4. Backend starts Market Mover Bot
5. UI updates dynamically through polling
6. Bot sends live price updates + trigger notifications

This showcases how **autonomous agents** can manage Polymarket strategies through tool invocation.

---

# 🛠️ Installation & Setup

## 1️⃣ Start the Backend

```bash
cd backend
pnpm install
pnpm dev
```

This launches the bot API + D1 database.

---

## 2️⃣ Start the MCP Server

Open a second terminal:

```bash
cd mcp
cp .dev.vars.example .dev.vars
```

➡ **Set your BOT_BACKEND_URL**
Example:

```
BOT_BACKEND_URL=http://localhost:8787
```

Then:

```bash
pnpm install
pnpm dev
```

MCP server will start on a local port and register tools.

---

## 3️⃣ Start the Agent (Frontend)

Open a third terminal:

```bash
cd agent
cp .dev.vars.example .dev.vars
```

➡ **Set your OpenAI key**

```
OPENAI_API_KEY=sk-xxxx
```

➡ Also copy the example environment for backend URL:

```bash
cp .env.example .env
```

Fill in:

```
VITE_BACKEND_URL=http://localhost:8787
VITE_MCP_URL=http://localhost:xxxx   # MCP server port
```

Then run:

```bash
npm install
npm start
```

The app will open at:

```
http://localhost:5173
```

---

# 🔧 Requirements

- Node 18+
- pnpm (recommended)
- Cloudflare Wrangler for backend
- OpenAI API Key
- Modern browser

---

# 🌐 Features (MVP)

### ✔ AI Agent

- Streams responses
- Calls MCP tools
- Detects tool results
- Triggers toast notifications when bots activate

### ✔ MCP Server

- Registers tools for Polymarket operations
- Supports agent → tool → backend interaction
- Includes type-safe schemas (zod)

### ✔ Market Mover Bot

- Activate via MCP tool
- Tracks Polymarket YES/NO prices
- Sends toast + audio alerts
- Threshold-triggered notifications
- Live chart-like tick streaming
- Bot status storage

### ✔ Clean UI

- Multi-tab layout (Agent / Bots / Analyzer / Markets / Thirdweb)
- Live Market Mover terminal
- Vite + Tailwind + React

---

# 📌 Future Direction

- Auto-trading strategies
- Arbitrage scanner
- Market intelligence agent
- Per-market risk scoring
- Multi-bot scheduling
- Thirdweb wallet-based execution
- On-chain strategy publishing
- Real Polymarket price feed integration

---
