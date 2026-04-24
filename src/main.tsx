import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { msalReady } from "./lib/msal";

// Wait for MSAL to initialize and process any redirect response BEFORE
// React renders, so useIsAuthenticated reads the correct state on first paint.
msalReady.finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
