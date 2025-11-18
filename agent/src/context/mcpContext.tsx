"use client";
import { createContext, useContext, useState, useEffect } from "react";

const MCPContext = createContext(null);

export function MCPProvider({ children }) {
  const [mcpConnected, setMcpConnected] = useState(false);
  const [mcpServerId, setMcpServerId] = useState<string | null>(null);
  const [mcpUrl, setMcpUrl] = useState<string | null>(null);

  // Auto-restore from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("mcp:url");
    const savedId = localStorage.getItem("mcp:serverId");

    if (savedUrl) setMcpUrl(savedUrl);
    if (savedId) setMcpServerId(savedId);
    if (savedUrl && savedId) setMcpConnected(true);
  }, []);

  return (
    <MCPContext.Provider
      value={{
        mcpConnected,
        mcpServerId,
        mcpUrl,
        setMcpConnected,
        setMcpServerId,
        setMcpUrl
      }}
    >
      {children}
    </MCPContext.Provider>
  );
}

export const useMCP = () => useContext(MCPContext);
