// src/app/layout/Layout.tsx
import React, { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type TabId = "agent" | "bots" | "analyzer" | "markets" | "thirdweb";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "agent", label: "AI Agent", icon: "🧠" },
  { id: "bots", label: "Bots", icon: "🤖" },
  { id: "analyzer", label: "Analyzer", icon: "📊" },
  { id: "markets", label: "Markets", icon: "📈" },
  { id: "thirdweb", label: "Web3 Wallet", icon: "🔗" }
];

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <div
      className="h-screen flex flex-col text-[1.05rem]"
      style={{
        backgroundColor: "var(--color-ob-base-100)",
        color: "var(--text-color-ob-base-300)"
      }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-8 h-16"
        style={{ borderBottom: "2px solid var(--color-ob-border)" }}
      >
        <div>
          <h1 className="text-xl font-semibold text-white">
            Polymarket Dashboard
          </h1>
          <p className="text-sm text-[var(--text-color-ob-base-200)]">
            Chat with the AI agent, manage bots, and explore markets.
          </p>
        </div>
        <div className="text-xs text-[var(--text-color-ob-base-200)]">
          v0.1 • Mock demo
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className="w-64 flex-shrink-0 flex flex-col px-4 py-6 gap-4"
          style={{
            borderRight: "2px solid var(--color-ob-border)",
            backgroundColor: "var(--color-ob-base-200)"
          }}
        >
          <div className="font-semibold text-sm text-[var(--text-color-ob-base-200)] px-2">
            Navigation
          </div>

          <nav className="space-y-1">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-150 ${
                    isActive ? "scale-[1.02]" : "hover:scale-[1.01]"
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-ob-base-300)"
                      : "transparent",
                    color: isActive ? "#fff" : "var(--text-color-ob-base-200)",
                    border: isActive
                      ? "1px solid var(--color-ob-border)"
                      : "1px solid transparent"
                  }}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Page content with transition */}
        <main className="flex-1 flex flex-col min-h-0 px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
