/** Prepare the optional, ignored publishable-logo configuration for file:// use.
 * Usage from repository root: node docs/design/setup-jobs-demo.mjs
 * Never reads LOGO_DEV_SECRET_KEY or prints a token. */
import { readFile, writeFile } from "node:fs/promises";

let token = process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim();
if (!token) {
  try {
    const env = await readFile(new URL("../../apps/client/.env", import.meta.url), "utf8");
    const match = env.match(
      /^\s*(?:export\s+)?EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY\s*=\s*(.*?)\s*$/m,
    );
    if (match) {
      const value = match[1];
      token = (/^(['"])(.*)\1$/.exec(value)?.[2] ?? value.replace(/\s+#.*$/, "")).trim();
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const config = token ? { logoDevPublishableKey: token } : {};
await writeFile(
  new URL("./jobs-demo-v2.config.local.js", import.meta.url),
  `// Local publishable-key configuration. Do not commit.\nwindow.PATCH_JOBS_DEMO_CONFIG = ${JSON.stringify(config)};\n`,
  { mode: 0o600 },
);
console.log(
  token
    ? "Demo configured with the existing publishable logo key."
    : "Demo configured without a logo key; company initials will be shown.",
);
