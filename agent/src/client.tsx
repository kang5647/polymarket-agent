import { createRoot } from "react-dom/client";
import App from "./app";
import { Providers } from "@/providers";
import "./styles.css";
const root = createRoot(document.getElementById("app")!);

root.render(
  <Providers>
    <App />
  </Providers>
);
