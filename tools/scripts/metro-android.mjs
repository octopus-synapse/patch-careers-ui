#!/usr/bin/env node

// Keep the development build in sync with native dependencies before opening it.
// Metro alone cannot add a native module to an APK that is already installed.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const client = path.join(root, "apps/client");
const apk = path.join(client, "android/app/build/outputs/apk/debug/app-debug.apk");
const metroArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const children = new Set();
let stopping = false;

function start(command, args, cwd = root, capture = false) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
  });
  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}

function run(command, args, cwd = root, capture = false) {
  return new Promise((resolve, reject) => {
    const child = start(command, args, cwd, capture);
    let output = "";
    if (capture) {
      for (const stream of [child.stdout, child.stderr]) {
        stream.on("data", (chunk) => {
          const message = chunk.toString();
          output += message;
          process.stdout.write(message);
        });
      }
    }
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code, output }));
  });
}

async function waitForMetro(metro) {
  for (let attempt = 0; attempt < 240; attempt++) {
    if (metro.exitCode !== null) throw new Error("Metro encerrou antes de iniciar.");
    try {
      const response = await fetch("http://localhost:8081/status");
      if (response.ok && (await response.text()) === "packager-status:running") return;
    } catch {
      // Metro is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Metro não iniciou na porta 8081 em 2 minutos.");
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}

process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));

try {
  const metro = start("pnpm", ["--filter", "client", "exec", "expo", "start", "--dev-client", "--host", "localhost", ...metroArgs]);
  metro.once("exit", (code) => stop(code ?? 1));
  await waitForMetro(metro);

  console.log("\n[android] Compilando o cliente de desenvolvimento...");
  const build = await run("pnpm", ["--filter", "client", "android:no-bundler"], root, true);
  if (build.code !== 0 && !build.output.includes("BUILD SUCCESSFUL")) {
    throw new Error("O build Android falhou.");
  }
  if (!existsSync(apk)) throw new Error(`APK não encontrado: ${apk}`);

  // Expo run:android may finish building while adb briefly disconnects. Install
  // explicitly after the build so a stale development client cannot be opened.
  let installed = false;
  for (let attempt = 0; attempt < 3 && !installed; attempt++) {
    const result = await run("adb", ["install", "-r", apk]);
    installed = result.code === 0;
    if (!installed) await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  if (!installed) throw new Error("Não foi possível instalar o APK no Android.");

  if ((await run("adb", ["reverse", "tcp:8081", "tcp:8081"])).code !== 0) {
    throw new Error("Não foi possível conectar o Android ao Metro na porta 8081.");
  }
  const url = "patchcareers://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081";
  if ((await run("adb", ["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url])).code !== 0) {
    throw new Error("Não foi possível abrir o cliente de desenvolvimento no Android.");
  }
  console.log("[android] App aberto e conectado ao Metro.\n");
  await new Promise((resolve) => metro.once("exit", resolve));
} catch (error) {
  console.error(`[android] ${error.message}`);
  stop(1);
}
