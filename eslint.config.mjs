import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/animated-countdown/animated-countdown.tsx"],
    rules: {
      // Preserve the supplied Nexus UI component's mount-time countdown initialization.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores(["dist/**", ".next/**", ".vinext/**", ".wrangler/**"]),
]);

