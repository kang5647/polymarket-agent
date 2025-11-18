// src/store/bots.ts
import { create } from "zustand";
import { fetchBots, activateBot, deactivateBot, type Bot } from "@/lib/botApi";

interface BotStore {
  bots: Bot[];
  prevBots: Bot[];
  loading: boolean;
  loadBots: () => Promise<void>;
  activateBot: (name: string) => Promise<void>;
  deactivateBot: (name: string) => Promise<void>;
  getActiveBots: () => Bot[];
}

export const useBotStore = create<BotStore>((set, get) => ({
  bots: [],
  prevBots: [],
  loading: false,

  loadBots: async () => {
    set({ loading: true });
    try {
      const prev = get().bots; // capture old state
      const bots = await fetchBots();
      set({
        bots,
        prevBots: prev // store old bots
      });
    } catch (err) {
      console.error("Failed to load bots:", err);
    } finally {
      set({ loading: false });
    }
  },

  activateBot: async (name: string) => {
    await activateBot(name);
    await get().loadBots();
  },

  deactivateBot: async (name: string) => {
    await deactivateBot(name);
    await get().loadBots();
  },

  getActiveBots: () => {
    return get().bots.filter((b) => b.status === "active");
  }
}));
