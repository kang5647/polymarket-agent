import React, { createContext, useContext, useState } from "react";
import type { TabId } from "@/app/layout/Layout";

interface TabContextState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const TabContext = createContext<TabContextState | null>(null);

export const TabProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState<TabId>("agent");

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTab must be used inside TabProvider");
  return ctx;
};
