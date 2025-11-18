"use client";

import {
  ConnectWallet,
  useAddress,
  useContract,
  useContractWrite
} from "@thirdweb-dev/react";

import { useState } from "react";

const MOCK_POLYMARKET = "0xYourContractAddressHere"; // Sepolia contract

export default function ThirdwebBet() {
  const address = useAddress();
  const { contract } = useContract(MOCK_POLYMARKET);
  const { mutateAsync: placeBet, isLoading } = useContractWrite(
    contract,
    "placeBet"
  );

  const [msg, setMsg] = useState<string | null>(null);

  async function handleBet(side: "YES" | "NO") {
    if (!address) return setMsg("Please connect your wallet first.");

    try {
      setMsg("Preparing transaction…");

      const tx = await placeBet({
        args: ["Bitcoin Market", side],
        overrides: {
          value: "1000000000000000" // 0.001 ETH mock bet
        }
      });

      setMsg(`Bet successful! Tx: ${tx.receipt.transactionHash}`);
    } catch (err) {
      console.error(err);
      setMsg("Failed to send transaction");
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "520px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
        🧩 Thirdweb Wallet (Sepolia)
      </h1>

      <p style={{ opacity: 0.7, marginTop: "8px" }}>
        Connect wallet and place demo Polymarket-style YES/NO bets.
      </p>

      {/* Wallet Connect UI */}
      <div style={{ marginTop: "20px" }}>
        <ConnectWallet theme="dark" btnTitle="Connect Wallet" />
      </div>

      {address && (
        <>
          <p style={{ marginTop: "12px", color: "#4ade80" }}>
            Connected: {address.slice(0, 6)}…{address.slice(-4)}
          </p>

          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              borderRadius: "12px",
              background: "#0f0f0f",
              border: "1px solid #333"
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
              📈 Bitcoin YES/NO Market
            </h2>

            <div style={{ marginTop: "14px", display: "flex", gap: "40px" }}>
              <div>
                <p style={{ opacity: 0.7 }}>YES Price</p>
                <p style={{ color: "#4ade80", fontWeight: "bold" }}>0.45</p>
              </div>

              <div>
                <p style={{ opacity: 0.7 }}>NO Price</p>
                <p style={{ color: "#60a5fa", fontWeight: "bold" }}>0.55</p>
              </div>
            </div>

            <div style={{ marginTop: "18px", display: "flex", gap: "12px" }}>
              <button
                onClick={() => handleBet("YES")}
                disabled={isLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "#166534",
                  color: "white",
                  border: "none"
                }}
              >
                Bet YES
              </button>

              <button
                onClick={() => handleBet("NO")}
                disabled={isLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "#1e3a8a",
                  color: "white",
                  border: "none"
                }}
              >
                Bet NO
              </button>
            </div>

            {msg && (
              <p style={{ marginTop: "16px", opacity: 0.8, fontSize: "14px" }}>
                {msg}
              </p>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: "40px", opacity: 0.6, fontSize: "14px" }}>
        <h3 style={{ fontWeight: "bold" }}>🤖 Agentic Execution</h3>
        <p>
          The AI Agent can analyze the market, prepare a trade, then ask you to
          sign the transaction using Thirdweb wallet — showcasing real
          agent-to-chain automation.
        </p>
      </div>
    </div>
  );
}
