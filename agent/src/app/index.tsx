// src/app/index.tsx
import React, { useState } from "react";
import Layout, { type TabId } from "./layout/Layout";
import ChatAgentPage from "./agents/chat";
import BotsPage from "./bots";
import MarketsPage from "./markets";
import AnalyzerPage from "./analyzers";
import "@/styles/theme-override.css";
import { useDemoUserId } from "@/hooks/useDemoUserId"; // ✅ add this

import { TabProvider, useTab } from "@/context/tabContext";
import { MCPProvider } from "@/context/mcpContext";
import ThirdwebPage from "./thirdweb";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Toaster } from "sonner";

const PolymarketApp: React.FC = () => {
  useDemoUserId();

  return (
    <ThirdwebProvider activeChain={"ethereum"}>
      <MCPProvider>
        <TabProvider>
          <Toaster richColors expand={false} position="top-right" />
          <AppContent />
        </TabProvider>
      </MCPProvider>
    </ThirdwebProvider>
  );
};

const AppContent = () => {
  const { activeTab, setActiveTab } = useTab();

  const renderPage = () => {
    switch (activeTab) {
      case "agent":
        return <ChatAgentPage />;
      case "bots":
        return <BotsPage />;
      case "analyzer":
        return <AnalyzerPage />;
      case "markets":
        return <MarketsPage />;
      case "thirdweb":
        return <ThirdwebPage />; // <-- add this
      default:
        return <ChatAgentPage />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </Layout>
  );
};

export default PolymarketApp;
