import React, { useState } from "react";
import { activateMarketMoverBot } from "@/lib/botApi";
import { useBotStore } from "@/store/bots";

interface Props {
  onClose: () => void;
  onActivated: () => void; // NEW
}

const MarketMoverSetupModal: React.FC<Props> = ({ onClose, onActivated }) => {
  const [marketId, setMarketId] = useState("");
  const [marketName, setMarketName] = useState("");

  const [targetYes, setTargetYes] = useState("");
  const [targetNo, setTargetNo] = useState("");

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
      targetNo ? parseFloat(targetNo) : null
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

        <label className="text-sm">Market ID</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white mb-3"
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
        />

        <label className="text-sm">Market Name</label>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white mb-3"
          value={marketName}
          onChange={(e) => setMarketName(e.target.value)}
        />

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

        <p className="text-xs text-gray-400 mb-4">
          You only need to fill one. Example: If YES reaches 0.65 → trigger
          alert.
        </p>

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
