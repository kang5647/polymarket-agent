// src/app/markets/index.tsx
import React from "react";
import marketsData from "@/data/mock-markets.json";

type Market = {
  id: string;
  name: string;
  category: string;
  volume: number;
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const MarketsPage: React.FC = () => {
  const markets = marketsData as Market[];

  return (
    <div className="flex flex-col h-full">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          📈 Markets
        </h2>
        <p className="text-sm text-[var(--text-color-ob-base-200)]">
          Mock Polymarket markets with category and volume.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {markets.map((mkt) => (
          <div
            key={mkt.id}
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{
              border: "1px solid var(--color-ob-border)",
              backgroundColor: "var(--color-ob-base-200)"
            }}
          >
            <div className="mb-3">
              <div className="text-xs uppercase tracking-wide mb-1 text-[var(--text-color-ob-base-200)]">
                {mkt.category}
              </div>
              <h3 className="text-base font-semibold text-white">{mkt.name}</h3>
            </div>
            <div className="mt-auto flex items-center justify-between text-sm">
              <span className="text-[var(--text-color-ob-base-200)]">
                24h Volume
              </span>
              <span className="font-semibold text-white">
                {formatter.format(mkt.volume)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketsPage;
