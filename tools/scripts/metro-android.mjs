#!/usr/bin/env node

// Start Metro in interactive development-client mode. Android is opened only
// when the developer presses `a` in Expo's terminal UI.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const metroArgs = process.argv.slice(2).filter((arg) => arg !== "--");

const metro = spawn(
  "pnpm",
  [
    "--filter",
    "client",
    "exec",
    "expo",
    "start",
    "--dev-client",
    "--host",
    "localhost",
    ...metroArgs,
  ],
  {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  },
);

metro.once("error", (error) => {
  console.error(`[metro] Nao foi possivel iniciar o Metro: ${error.message}`);
  process.exitCode = 1;
});

metro.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
