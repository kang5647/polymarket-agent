// src/app/analyzers/index.tsx
import React from "react";
import marketsData from "@/data/mock-markets.json";
import { useBotStore } from "@/store/bots";

type Market = {
  id: string;
  name: string;
  category: string;
  volume: number;
};

const AnalyzerPage: React.FC = () => {
  const markets = marketsData as Market[];
  const { getActiveBots } = useBotStore();
  const activeBots = getActiveBots();

  const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
  const topMarket = [...markets].sort((a, b) => b.volume - a.volume)[0];

  const byCategory = markets.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + m.volume;
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-col h-full">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          📊 Analyzer
        </h2>
        <p className="text-sm text-[var(--text-color-ob-base-200)]">
          Mock analytics overview based on sample markets and active bots.
        </p>
      </header>

      {/* Active bots summary */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-2">
          Active Bots Overview
        </h3>
        {activeBots.length === 0 ? (
          <div
            className="rounded-2xl px-4 py-3 text-sm"
            style={{
              border: "1px dashed var(--color-ob-border)",
              backgroundColor: "var(--color-ob-base-200)"
            }}
          >
            No bots are currently active. Activate one on the Bots tab or via
            the AI Agent to see how it might behave here.
          </div>
        ) : (
          <div
            className="rounded-2xl px-4 py-3 text-sm"
            style={{
              border: "1px solid var(--color-ob-border)",
              backgroundColor: "var(--color-ob-base-200)"
            }}
          >
            <span className="text-[var(--text-color-ob-base-200)]">
              Active bots:
            </span>{" "}
            <span className="font-medium text-white">
              {activeBots.map((b) => b.name).join(", ")}
            </span>
          </div>
        )}
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-3 mb-6">
        <div
          className="rounded-2xl p-4"
          style={{
            border: "1px solid var(--color-ob-border)",
            backgroundColor: "var(--color-ob-base-200)"
          }}
        >
          <div className="text-xs uppercase tracking-wide text-[var(--text-color-ob-base-200)] mb-1">
            Total Volume (Mock)
          </div>
          <div className="text-2xl font-semibold text-white">
            ${totalVolume.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-[var(--text-color-ob-base-200)] mt-1">
            Across {markets.length} markets
          </div>
        </div>

        {topMarket && (
          <div
            className="rounded-2xl p-4"
            style={{
              border: "1px solid var(--color-ob-border)",
              backgroundColor: "var(--color-ob-base-200)"
            }}
          >
            <div className="text-xs uppercase tracking-wide text-[var(--text-color-ob-base-200)] mb-1">
              Top Gainer (by volume)
            </div>
            <div className="text-sm font-semibold text-white mb-1 line-clamp-3">
              {topMarket.name}
            </div>
            <div className="text-xs text-[var(--text-color-ob-base-200)]">
              Volume: ${topMarket.volume.toLocaleString()}
            </div>
          </div>
        )}

        {topCategory && (
          <div
            className="rounded-2xl p-4"
            style={{
              border: "1px solid var(--color-ob-border)",
              backgroundColor: "var(--color-ob-base-200)"
            }}
          >
            <div className="text-xs uppercase tracking-wide text-[var(--text-color-ob-base-200)] mb-1">
              Market Sentiment (Mock)
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              Strong interest in {topCategory[0]}
            </div>
            <div className="text-xs text-[var(--text-color-ob-base-200)]">
              Category share by volume is highest here among mock markets.
            </div>
          </div>
        )}
      </section>

      {/* Placeholder for future charts */}
      <section
        className="mt-auto rounded-2xl px-4 py-6 text-sm"
        style={{
          border: "1px dashed var(--color-ob-border)",
          backgroundColor: "var(--color-ob-base-200)"
        }}
      >
        <div className="font-semibold text-white mb-1">
          Coming soon: richer analytics
        </div>
        <div className="text-[var(--text-color-ob-base-200)]">
          This space can host win-probability charts, time-series of volumes,
          and bot PnL once you connect to live Polymarket data and real bot
          performance.
        </div>
      </section>
    </div>
  );
};

export default AnalyzerPage;
