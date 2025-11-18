import React, { useEffect, useState } from "react";
import { useBotStore } from "@/store/bots";
import { Button } from "@/components/button/Button";
import { deactivateMarketMoverBot } from "@/lib/botApi";
import MarketMoverSetupModal from "./MarketMoverSetup";
import MarketMoverLive from "../market-mover";
import { toast } from "sonner";

const BotsPage: React.FC = () => {
  const { bots, prevBots, loadBots } = useBotStore();

  const [showMarketMoverModal, setShowMarketMoverModal] = useState(false);
  const [showMarketMoverLive, setShowMarketMoverLive] = useState(false);

  useEffect(() => {
    loadBots();
  }, [loadBots]);

  useEffect(() => {
    if (!prevBots || prevBots.length === 0) return;

    bots.forEach((bot) => {
      const previous = prevBots.find((b) => b.id === bot.id);
      if (!previous) return;

      if (previous.status === "inactive" && bot.status === "active") {
        toast.success("🤖 Market Mover Activated", {
          description: "Your bot is now running."
        });
      }
    });
  }, [bots, prevBots, toast]);

  const handleActivate = (botName: string) => {
    if (botName === "Market Mover Bot") {
      setShowMarketMoverModal(true);
    }
  };

  const handleDeactivate = async (botName: string) => {
    if (botName === "Market Mover Bot") {
      await deactivateMarketMoverBot();
      await loadBots();
    }
  };

  // Show live page when requested
  if (showMarketMoverLive) {
    return <MarketMoverLive onBack={() => setShowMarketMoverLive(false)} />;
  }

  return (
    <div className="flex flex-col h-full p-4">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          🤖 Bots
        </h2>
        <p className="text-sm text-[var(--text-color-ob-base-200)]">
          Manage your Polymarket bots.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bots.map((bot) => {
          const active = bot.status === "active";
          const isMarketMover = bot.name === "Market Mover Bot";

          return (
            <div
              key={bot.id}
              className={`rounded-2xl p-5 flex flex-col justify-between border border-[var(--color-ob-border)] bg-[var(--color-ob-base-200)] cursor-pointer`}
              onClick={() => {
                if (isMarketMover && active) {
                  // Go to live market mover page
                  setShowMarketMoverLive(true);
                }
              }}
            >
              <div className="mb-3">
                <div>
                  <h3 className="text-lg text-white">{bot.name}</h3>
                  <p className="text-xs text-gray-400">{bot.description}</p>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-[0.7rem] font-semibold ${
                    active
                      ? "text-green-400 bg-green-900/20"
                      : "text-gray-400 bg-gray-700/20"
                  }`}
                >
                  {active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <Button
                className="rounded-xl py-2 text-sm font-medium"
                style={{
                  background: active
                    ? "var(--color-ob-base-300)"
                    : "linear-gradient(135deg, var(--user-start), var(--user-end))"
                }}
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering card click
                  if (!active) handleActivate(bot.name);
                  else handleDeactivate(bot.name);
                }}
              >
                {active ? "Deactivate Bot" : "Activate Bot"}
              </Button>

              {/* Small VIEW LIVE link under Activate button */}
              {isMarketMover && active && (
                <button
                  className="mt-2 text-xs text-blue-300 underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMarketMoverLive(true);
                  }}
                >
                  View Live →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showMarketMoverModal && (
        <MarketMoverSetupModal
          onClose={() => setShowMarketMoverModal(false)}
          onActivated={() => setShowMarketMoverLive(true)}
        />
      )}
    </div>
  );
};

export default BotsPage;
