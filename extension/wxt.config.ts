import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Keep extension HMR on :5173, separate from the dashboard on :3001
  // (constants.DASHBOARD_URL). A fixed port also keeps its CSP origin stable.
  dev: {
    server: {
      port: 5173,
      origin: "http://localhost:5173",
    },
  },
  // Force Vite's HMR client onto the same port (avoids stale/default :3000
  // websocket targets after a port change).
  vite: () => ({
    server: {
      hmr: {
        protocol: "ws",
        host: "localhost",
        clientPort: 5173,
      },
    },
  }),
  webExt: {
    startUrls: ["https://leetcode.com"],
    chromiumArgs: [
      "--disable-blink-features=AutomationControlled",
      "--user-data-dir=./.chrome-dev-data",
    ],
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Algomora",
    short_name: "Algomora",
    action: {
      // Let the browser scale the original for the toolbar's display density.
      default_icon: "icon/2048.png",
    },
    description: "Algomora — track LeetCode submissions and build mastery with spaced repetition.",
    // Interception is done by wrapping window.fetch in the injected bridge,
    // so only storage is needed (no webRequest).
    // "tabs" lets startLogin() focus an existing login tab instead of spawning
    // duplicates when the popup Sign in button is clicked again.
    permissions: ["storage", "tabs"],

    // Match the content-script/web-accessible-resource patterns: any
    // leetcode.com subdomain (e.g. www.) over http or https.
    host_permissions: ["*://*.leetcode.com/*"],
    web_accessible_resources: [
      {
        resources: ["/fetch-bridge.js"],
        matches: ["*://*.leetcode.com/*"],
      },
    ],
  },
});
