import React, { useState } from "react";
import { activateMarketMoverBot } from "@/lib/botApi";
import { useBotStore } from "@/store/bots";

interface Props {
  onClose: () => void;
  onActivated: () => void;
}

const MarketMoverSetupModal: React.FC<Props> = ({ onClose, onActivated }) => {
  const [marketId, setMarketId] = useState("");
  const [marketName, setMarketName] = useState("");

  const [targetYes, setTargetYes] = useState("");
  const [targetNo, setTargetNo] = useState("");

  const [direction, setDirection] = useState<"buy" | "sell">("buy");

  const { loadBots } = useBotStore();

  const handleSubmit = async () => {
    if (!marketId || !marketName) {
      alert("Please enter Market ID and Market Name");
      return;
    }

    if (!targetYes && !targetNo) {
      alert("Please enter a target YES or NO price");
      return;
    }

    await activateMarketMoverBot(
      marketId,
      marketName,
      targetYes ? parseFloat(targetYes) : null,
      targetNo ? parseFloat(targetNo) : null,
      direction
    );

    await loadBots();
    onClose();
    onActivated();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-ob-base-200)] border border-[var(--color-ob-border)] p-6 rounded-xl w-[360px] text-white">
        <h2 className="text-lg mb-4 font-semibold">
          Activate Market Mover Bot
        </h2>

        {/* MARKET ID */}
        <label className="text-sm">Market ID</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white mb-3"
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
        />

        {/* MARKET NAME */}
        <label className="text-sm">Market Name</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white mb-3"
          value={marketName}
          onChange={(e) => setMarketName(e.target.value)}
        />

        {/* DIRECTION */}
        <label className="text-sm">Direction</label>
        <div className="flex gap-3 mb-4">
          <button
            className={`flex-1 px-3 py-2 rounded border ${
              direction === "buy"
                ? "bg-green-600 border-green-700"
                : "bg-gray-800 border-gray-700"
            }`}
            onClick={() => setDirection("buy")}
          >
            BUY
          </button>

          <button
            className={`flex-1 px-3 py-2 rounded border ${
              direction === "sell"
                ? "bg-red-600 border-red-700"
                : "bg-gray-800 border-gray-700"
            }`}
            onClick={() => setDirection("sell")}
          >
            SELL
          </button>
        </div>

        {/* TARGETS */}
        <label className="text-sm">Target YES Price (optional)</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white mb-3"
          placeholder="e.g. 0.65"
          value={targetYes}
          onChange={(e) => setTargetYes(e.target.value)}
        />

        <label className="text-sm">Target NO Price (optional)</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white mb-5"
          placeholder="e.g. 0.40"
          value={targetNo}
          onChange={(e) => setTargetNo(e.target.value)}
        />

        {/* EXPLANATION */}
        <p className="text-xs text-gray-400 mb-4">
          BUY → triggers when price goes **below** target. SELL → triggers when
          price goes **above** target. Fill at least one target.
        </p>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-700 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-purple-600 rounded"
            onClick={handleSubmit}
          >
            Activate
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketMoverSetupModal;
