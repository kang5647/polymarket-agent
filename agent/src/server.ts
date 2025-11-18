import {
  routeAgentRequest,
  type AgentNamespace,
  type Schedule,
  callable
} from "agents";
import { getSchedulePrompt } from "agents/schedule";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
import { env } from "cloudflare:workers";

// ---- Type environment ----
type Env = {
  Chat: AgentNamespace<Chat>;
  OPENAI_API_KEY: string;
  HOST?: string;
  MOCK_POLYMARKET_CONTRACT?: string;
};

// ---- Initialize OpenAI client ----
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
const model = openai("gpt-4o-mini");

// ---- Define Chat Agent ----
export class Chat extends AIChatAgent<Env> {
  /**
   * Callable API to connect to an MCP server (used from frontend via agent.stub)
   */
  @callable()
  async connectMCPServer(url: string, headers?: Record<string, string>) {
    console.log("🔌 connectMCPServer called with:", url);

    // Close any existing MCP connections
    await this.mcp.closeAllConnections();

    const result = await this.addMcpServer(
      "Polymarket-MCP",
      url,
      this.env.HOST ?? undefined,
      undefined,
      headers
        ? {
            transport: {
              type: "auto",
              headers
            }
          }
        : {
            transport: {
              type: "auto"
            }
          }
    );

    return result; // { id, authUrl? }
  }

  /**
   * Callable API to disconnect an MCP server (or all servers)
   */
  @callable()
  async disconnectMCPServer(serverId?: string) {
    console.log("🔌 disconnectMCPServer called:", serverId);

    if (serverId) {
      await this.removeMcpServer(serverId);
    } else {
      const mcpState = this.getMcpServers();
      for (const id of Object.keys(mcpState.servers)) {
        await this.removeMcpServer(id);
      }
    }

    return { ok: true };
  }

  @callable()
  async prepareMockPolymarketTx(
    market: string,
    side: "YES" | "NO",
    amountEth: number = 0.001
  ) {
    const contract = env.MOCK_POLYMARKET_CONTRACT;
    if (!contract) {
      throw new Error("MOCK_POLYMARKET_CONTRACT not set in env");
    }

    const txRequest = {
      to: contract,
      value: String(BigInt(amountEth * 1e18)),
      data: "0x",
      chainId: 11155111
    };

    return {
      tool: "prepareMockPolymarketTx",
      market,
      side,
      txRequest
    };
  }

  /**
   * Chat message stream handler
   */
  override async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    const allTools = {
      ...tools,
      ...this.mcp.getAITools() // automatically includes connected MCP tools
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const cleanedMessages = cleanupMessages(this.messages);

        const userMessages = this.messages.filter((m) => m.role === "user");
        const lastUserMessage =
          userMessages.length > 0
            ? userMessages[userMessages.length - 1]
            : null;

        const userId = lastUserMessage?.metadata?.userId ?? "demo-user";

        console.log("🌐 Agent detected userId:", userId);

        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        const result = streamText({
          system: `You are **Polymarket Agent**, a conversational co-pilot for exploring and automating prediction markets.

User context:
- userId: ${userId}

Your goals:
- Help users discover, understand, and analyze Polymarket markets.
- Explain probabilities, trends, and reasoning in plain English.
- When appropriate, use available tools (search_markets, activate_bot, etc.).
- Always ask for user consent before activating any bot.
- Keep answers concise, confident, and educational.
- Does not support Markdown format yet

Context hints:
- Polymarket is a prediction market platform where users trade shares on real-world events.
- Market odds represent the crowd-implied probability of an event happening.
- You can fetch mock data for markets, analyzers, and bots for demo purposes.

${getSchedulePrompt({ date: new Date() })}

If the user asks to start monitoring or alerting, use the 'activate_bot' tool.
If the user wants to view trends, use the 'search_markets' tool.
If the user asks to compare or explain probabilities, reason step-by-step before answering.`,
          messages: convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }

  /**
   * Scheduled task execution
   */
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          { type: "text", text: `Running scheduled task: ${description}` }
        ],
        metadata: { createdAt: new Date() }
      }
    ]);
  }
}

// ---- Worker entrypoint ----
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    env.HOST = url.origin;

    if (url.pathname === "/check-openai-key") {
      const hasKey = !!env.OPENAI_API_KEY;
      return Response.json({ success: hasKey });
    }

    if (!env.OPENAI_API_KEY) {
      console.error(
        "⚠️ OPENAI_API_KEY is not set. Add it with `wrangler secret put OPENAI_API_KEY`"
      );
    }

    // Delegate to Agent router
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
