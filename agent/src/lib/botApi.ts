import { BOT_BACKEND_URL } from "./config";

export interface Bot {
  id?: number;
  name: string;
  status: "active" | "inactive";
  last_activated?: string;
  created_at?: string;
  description?: string;
}

export async function fetchBots(): Promise<Bot[]> {
  const res = await fetch(`${BOT_BACKEND_URL}/api/bots`, {
    method: "GET",
    mode: "cors",
    cache: "no-store"
  });

  const data = await res.json();
  return data.bots || [];
}

export async function activateBot(name: string) {
  const res = await fetch(`${BOT_BACKEND_URL}/api/bots/activate`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  const data = await res.json();
  return data;
}

export async function deactivateBot(name: string) {
  const res = await fetch(`${BOT_BACKEND_URL}/api/bots/deactivate`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  const data = await res.json();
  return data;
}

export async function activateMarketMoverBot(
  marketId: string,
  marketName: string,
  targetYes: number | null,
  targetNo: number | null
) {
  const res = await fetch(`${BOT_BACKEND_URL}/api/bots/market-mover/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      marketId,
      marketName,
      targetYes,
      targetNo
    })
  });

  return res.json();
}

export async function deactivateMarketMoverBot() {
  const res = await fetch(
    `${BOT_BACKEND_URL}/api/bots/market-mover/deactivate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }
  );

  return res.json();
}
