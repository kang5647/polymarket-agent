import { useEffect } from "react";

export function useDemoUserId() {
  useEffect(() => {
    let id = localStorage.getItem("demo-user-id");

    // 1️⃣ Generate once per browser
    if (!id) {
      id = "demo-" + Math.random().toString(36).substring(2, 8);
      localStorage.setItem("demo-user-id", id);
      console.log("[Demo] Assigned new user ID:", id);
    }

    // 2️⃣ Monkey-patch fetch so every request adds the header
    const origFetch = window.fetch;
    window.fetch = (url, opts: RequestInit = {}) => {
      const headers = new Headers(opts.headers || {});
      headers.set("user-id", id!);
      opts.headers = headers;
      return origFetch(url, opts);
    };

    // 3️⃣ Optional cleanup (restore fetch on unmount)
    return () => {
      window.fetch = origFetch;
    };
  }, []);
}
