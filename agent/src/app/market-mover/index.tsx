import React, { useEffect, useState } from "react";
import { BOT_BACKEND_URL } from "@/lib/config";
import { Button } from "@/components/button/Button";
import { toast } from "sonner";

interface PriceTick {
  yes: number;
  no: number;
  direction: "up" | "down";
  ts: string;
}

interface Props {
  onBack: () => void;
}

const MarketMoverLive: React.FC<Props> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<PriceTick[]>([]);

  // sound
  const playAlertSound = () => {
    if (typeof window === "undefined") return;
    try {
      const audio = new Audio("/sounds/alert.mp3");
      audio.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `${BOT_BACKEND_URL}/api/bots/market-mover/status`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setData(json);

      if (json.active && json.runner) {
        setHistory((prev) => {
          const lastYes = prev[prev.length - 1]?.yes ?? json.runner.priceYes;
          const tick: PriceTick = {
            yes: json.runner.priceYes,
            no: json.runner.priceNo,
            direction: json.runner.priceYes > lastYes ? "up" : "down",
            ts: json.runner.timestamp
          };
          return [...prev.slice(-40), tick];
        });

        const targetYes = json.watching?.targetYes ?? null;
        const targetNo = json.watching?.targetNo ?? null;

        // 🎯 Direction-aware alerts
        const direction = json.watching?.direction;

        if (direction === "buy") {
          if (targetYes !== null && json.runner.priceYes <= targetYes) {
            toast.success(`🟢 BUY signal: YES <= ${targetYes}`, {
              description: `YES @ ${json.runner.priceYes.toFixed(3)}`
            });
            playAlertSound();
          }
          if (targetNo !== null && json.runner.priceNo <= targetNo) {
            toast.success(`🟢 BUY signal: NO <= ${targetNo}`, {
              description: `NO @ ${json.runner.priceNo.toFixed(3)}`
            });
            playAlertSound();
          }
        }

        if (direction === "sell") {
          if (targetYes !== null && json.runner.priceYes >= targetYes) {
            toast.warning(`🔴 SELL signal: YES >= ${targetYes}`, {
              description: `YES @ ${json.runner.priceYes.toFixed(3)}`
            });
            playAlertSound();
          }
          if (targetNo !== null && json.runner.priceNo >= targetNo) {
            toast.warning(`🔴 SELL signal: NO >= ${targetNo}`, {
              description: `NO @ ${json.runner.priceNo.toFixed(3)}`
            });
            playAlertSound();
          }
        }
      }
    };

    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  if (!data) return <div className="p-6 text-white">Loading...</div>;
  if (!data.active)
    return <div className="p-6 text-white">Bot is inactive.</div>;

  const watching = data.watching;
  const targetYes = watching.targetYes ?? null;
  const targetNo = watching.targetNo ?? null;

  return (
    <div className="relative p-6 text-white">
      {/* HEADER: Left content + Right Telegram button */}
      <div className="flex items-start justify-between mb-4">
        {/* LEFT */}
        <div>
          <h2 className="text-xl font-semibold">📈 Market Mover Bot</h2>
          <p className="mt-2 text-gray-300">
            <p className="mt-2 text-gray-300">
              Watching: <b>{watching.marketName}</b> (
              {watching.direction.toUpperCase()})
            </p>
          </p>

          {/* Target badges */}
          <div className="mt-3 flex gap-3 flex-wrap">
            {targetYes !== null && (
              <span className="px-3 py-1 rounded-full bg-green-900/30 border border-green-700 text-green-300 text-sm">
                🎯 Target YES: <b>{targetYes}</b>
              </span>
            )}
            {targetNo !== null && (
              <span className="px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700 text-blue-300 text-sm">
                🎯 Target NO: <b>{targetNo}</b>
              </span>
            )}
          </div>
        </div>

        {/* RIGHT – Telegram button */}
        <div className="flex flex-col items-end">
          <Button
            className="flex items-center gap-2 rounded-xl px-4 py-2 bg-[#229ED9]/20 
                       border border-[#229ED9]/40 hover:bg-[#229ED9]/30 transition-colors"
            onClick={() =>
              toast("📨 Telegram Alerts (WIP)", {
                description:
                  "Telegram alerts are coming soon — the bot will notify your Telegram chat automatically."
              })
            }
          >
            <img src="/icons/telegram.svg" alt="Telegram" className="w-5 h-5" />
            <span className="text-[#229ED9] font-medium">
              Send alert to Telegram
            </span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/5">
              WIP
            </span>
          </Button>

          <span className="text-[11px] text-gray-500 mt-1">
            Alerts will push to Telegram (coming soon)
          </span>
        </div>
      </div>

      {/* BACK BUTTON */}
      <Button
        className="mb-4 rounded-lg px-4 py-2 text-sm bg-[var(--assistant-bg)] border border-[var(--assistant-border)] hover:bg-white/5"
        onClick={onBack}
      >
        ← Back to Bots
      </Button>

      {/* Terminal Panel */}
      <div className="mt-2 bg-black/40 border border-[var(--color-ob-border)] p-4 rounded-xl h-[360px] overflow-y-auto font-mono text-sm">
        {history.map((tick, idx) => (
          <div
            key={idx}
            className="flex justify-between py-1 border-b border-white/5"
          >
            <span className="text-gray-400">
              {new Date(tick.ts).toLocaleTimeString()}
            </span>

            <span
              className={
                tick.direction === "up" ? "text-green-400" : "text-red-400"
              }
            >
              YES: {tick.yes.toFixed(3)}
            </span>

            <span className="text-blue-300">NO: {tick.no.toFixed(3)}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Live simulated price feed updating every 3s.
      </p>
    </div>
  );
};

export default MarketMoverLive;
