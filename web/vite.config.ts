import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Local end-to-end check: the Go server on :8080 answers the Visitor endpoints, as Caddy does in prod.
  server: { proxy: { "/v1/published-lists": "http://localhost:8080" } },
});
