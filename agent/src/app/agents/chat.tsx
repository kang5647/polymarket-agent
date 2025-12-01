"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/button/Button";
import { Textarea } from "@/components/textarea/Textarea";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { UIMessage } from "@ai-sdk/react";
import type { MCPServersState } from "agents";
import { useTab } from "@/context/tabContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

// Quick prompts
const QUICK_PROMPTS = [
  {
    title: "What’s trending now?",
    prompt:
      "What are the most active or atrending markets on Polymarket right now?"
  },
  {
    title: "Top crypto markets",
    prompt: "Show me the top crypto-related prediction markets."
  },
  {
    title: "Explain Polymarket",
    prompt: "Explain how Polymarket works like I’m completely new."
  },
  {
    title: "Explore Right Automation",
    prompt:
      "Explore available bots that can support my Polymarket trading workflow."
  }
];

type AgentMessage = UIMessage<{ createdAt?: string; userId?: string }>;

function getMessageText(message: AgentMessage): string {
  if (!message.parts) return "";
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text as string)
    .join("\n")
    .trim();
}

const ChatAgentPage = () => {
  const [input, setInput] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setActiveTab } = useTab();
  const goToBots = () => setActiveTab("bots");

  // MCP State (m fain logic preserved)
  const [mcpUrlInput, setMcpUrlInput] = useState(
    "https://polymarket-mcp.kang5647.workers.dev/sse"
  );
  const [mcpConnected, setMcpConnected] = useState(false);
  const [mcpServerId, setMcpServerId] = useState<string | undefined>(undefined);
  const [isMcpBusy, setIsMcpBusy] = useState(false);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);

  const lastBotActivationRef = useRef<string | null>(null);

  // Agent
  const agent = useAgent({
    agent: "chat",
    onMcpUpdate(mcpState: MCPServersState) {
      const ids = Object.keys(mcpState.servers || {});
      if (ids.length === 0) {
        setMcpConnected(false);
        setMcpServerId(undefined);
        return;
      }
      const id = ids[0];
      const server = mcpState.servers[id];

      setMcpServerId(id);
      const state = server.state as string;
      setMcpConnected(state === "connected");
    }
  });

  const {
    messages: agentMessages,
    sendMessage,
    status,
    clearHistory
  } = useAgentChat<unknown, AgentMessage>({ agent });

  useEffect(() => {
    const last = agentMessages[agentMessages.length - 1];
    if (!last || last.role !== "assistant") return;

    for (const part of last.parts) {
      // Check if it's a tool call
      if (typeof part.type === "string" && part.type.startsWith("tool-")) {
        const encoded = part.type;
        const realName = encoded.split("_").slice(2).join("_");

        if (realName === "run_market_mover") {
          // Prevent duplicate toasts for the same message
          if (lastBotActivationRef.current === last.id) return;

          lastBotActivationRef.current = last.id;

          toast("🤖 Bot Activated via AI Agent", {
            description: "The agent has activated Market Mover Bot for you."
          });
        }
      }
    }
  }, [agentMessages]);

  const isTyping = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages, isTyping]);

  const userId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("demo-user-id")
      : null;

  // Submit message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
      metadata: { userId: userId || undefined }
    });

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // MCP connect
  const handleConnectMcp = async () => {
    try {
      setIsMcpBusy(true);
      const res = await agent.stub.connectMCPServer(mcpUrlInput.trim());

      localStorage.setItem("mcp:url", mcpUrlInput.trim());
      localStorage.setItem("mcp:serverId", res.id);

      // FIX: instantly sync UI
      setMcpConnected(true);
      setMcpServerId(res.id);
      setStatusMsg(`Connected MCP: ${res.id}`);
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to connect MCP");
    } finally {
      setIsMcpBusy(false);
    }
  };

  const handleDisconnectMcp = async () => {
    try {
      setIsMcpBusy(true);
      await agent.stub.disconnectMCPServer(mcpServerId);

      setMcpConnected(false);
      setMcpServerId(undefined);

      localStorage.removeItem("mcp:url");
      localStorage.removeItem("mcp:serverId");

      setStatusMsg("Disconnected MCP");
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to disconnect");
    } finally {
      setIsMcpBusy(false);
    }
  };

  // Load MCP on first page load
  useEffect(() => {
    const savedUrl = localStorage.getItem("mcp:url");
    if (!savedUrl) return;

    setMcpUrlInput(savedUrl);

    (async () => {
      try {
        const res = await agent.stub.connectMCPServer(savedUrl);
        setMcpConnected(true);
        setMcpServerId(res.id);
        setStatusMsg(`Reconnected MCP: ${res.id}`);
      } catch (err) {
        console.warn("Auto-reconnect failed:", err);
        setMcpConnected(false);
      }
    })();
  }, []);

  const visibleMessages = agentMessages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );

  const hasMessages = visibleMessages.length > 0;

  return (
    <div className="flex flex-col h-full text-[1.05rem] leading-relaxed">
      {/* Header */}
      <header
        className="flex items-center justify-between pb-4 mb-4"
        style={{ borderBottom: "1px solid var(--color-ob-border)" }}
      >
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            🧠 Polymarket AI Agent
          </h2>
          <p className="text-sm text-[var(--text-color-ob-base-200)]">
            Discover, understand & explore prediction markets.
          </p>
        </div>

        {/* Top-right panel */}
        <div className="flex items-center gap-4">
          {/* MCP indicator */}
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: mcpConnected
                  ? "var(--color-green-400)"
                  : "var(--color-red-400)"
              }}
            />
            <span className="text-[var(--text-color-ob-base-200)] text-sm">
              MCP: {mcpConnected ? "Connected" : "Not connected"}
            </span>
          </div>

          {/* Settings */}
          <Button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              background: "var(--assistant-bg)",
              border: "1px solid var(--assistant-border)",
              color: "white"
            }}
          >
            Settings
          </Button>
        </div>
      </header>

      {/* Demo banner */}
      <div
        className="mb-4 rounded-2xl px-5 py-4 flex justify-between items-center"
        style={{
          border: "1px solid var(--color-ob-border)",
          backgroundColor: "var(--color-ob-base-200)"
        }}
      >
        <div className="text-sm text-[var(--text-color-ob-base-200)]">
          <strong className="text-white">Agent-to-Bot Demo</strong>: The agent
          can offer to activate trading bots for you.
        </div>
        <Button
          className="rounded-xl px-4 py-2 text-sm"
          style={{
            background:
              "linear-gradient(135deg, var(--user-start), var(--user-end))",
            color: "white"
          }}
          onClick={goToBots}
        >
          Explore bots
        </Button>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className="text-sm text-center text-[var(--text-color-ob-base-200)] mb-2">
          {statusMsg}
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-8 py-2">
        {!hasMessages && (
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl px-8 py-6"
              style={{
                border: "2px solid var(--assistant-border)",
                backgroundColor: "var(--assistant-bg)"
              }}
            >
              <div className="text-base whitespace-pre-wrap">
                👋 <strong>Welcome to Polymarket AI!</strong>
                {"\n\n"}
                Ask anything about markets or try a quick prompt:
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.title}
                  onClick={() => setInput(q.prompt)}
                  className="rounded-2xl px-6 py-5 text-left transition hover:scale-[1.03]"
                  style={{
                    border: "2px solid var(--color-ob-border)",
                    backgroundColor: "var(--color-ob-base-200)",
                    color: "white"
                  }}
                >
                  <div className="font-semibold mb-2">{q.title}</div>
                  <div className="text-sm text-[var(--text-color-ob-base-200)]">
                    {q.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {visibleMessages.map((msg) => {
            const text = getMessageText(msg);
            if (!text) return null;
            const isUser = msg.role === "user";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-6 py-4 text-base ${
                    isUser ? "text-white" : ""
                  }`}
                  style={{
                    background: isUser
                      ? "linear-gradient(135deg, var(--user-start), var(--user-end))"
                      : "var(--assistant-bg)",
                    border: isUser
                      ? "none"
                      : "1px solid var(--assistant-border)"
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {text}
                  </ReactMarkdown>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-6 py-4"
              style={{
                backgroundColor: "var(--assistant-bg)",
                border: "1px solid var(--assistant-border)"
              }}
            >
              <div className="flex gap-1">
                <motion.div
                  className="w-3 h-3 rounded-full bg-blue-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-blue-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-blue-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="pt-4 mt-2"
        style={{ borderTop: "1px solid var(--color-ob-border)" }}
      >
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about markets, trends, or probabilities..."
            className="flex-1 min-h-[72px] max-h-[240px] rounded-2xl px-5 py-4 resize-none"
            style={{
              backgroundColor: "var(--color-ob-base-200)",
              border: "1.5px solid var(--color-ob-border)",
              color: "white"
            }}
          />

          <Button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--user-start), var(--user-end))",
              color: "#fff"
            }}
          >
            <Send className="h-6 w-6" />
          </Button>
        </form>

        {hasMessages && (
          <button
            className="mt-3 text-sm underline text-[var(--text-color-ob-base-200)]"
            onClick={clearHistory}
          >
            Clear conversation
          </button>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-[var(--assistant-bg)] border border-[var(--assistant-border)]"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                MCP Settings
              </h3>

              <label className="text-sm text-[var(--text-color-ob-base-200)]">
                MCP Server URL
              </label>
              <input
                type="text"
                value={mcpUrlInput}
                onChange={(e) => setMcpUrlInput(e.target.value)}
                className="w-full my-2 rounded-xl px-3 py-2 bg-black border border-[var(--color-ob-border)] text-white text-sm outline-none"
              />

              {!mcpConnected ? (
                <Button
                  onClick={handleConnectMcp}
                  disabled={isMcpBusy}
                  className="w-full rounded-xl py-2 text-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--user-start), var(--user-end))",
                    color: "#fff",
                    opacity: isMcpBusy ? 0.6 : 1
                  }}
                >
                  {isMcpBusy ? "Connecting..." : "Connect MCP"}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnectMcp}
                  disabled={isMcpBusy}
                  className="w-full rounded-xl py-2 text-sm"
                  style={{
                    background: "#7f1d1d", // dark red
                    color: "#fff",
                    opacity: isMcpBusy ? 0.6 : 1
                  }}
                >
                  {isMcpBusy ? "Disconnecting..." : "Disconnect"}
                </Button>
              )}

              {mcpServerId && (
                <div className="text-xs mt-3 text-[var(--text-color-ob-base-200)]">
                  Server ID: <span className="font-mono">{mcpServerId}</span>
                </div>
              )}

              <Button
                onClick={() => setShowSettings(false)}
                className="w-full rounded-xl py-2 mt-4 text-sm"
                style={{
                  background: "var(--color-ob-base-200)",
                  border: "1px solid var(--assistant-border)"
                }}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatAgentPage;
