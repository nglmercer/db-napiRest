import { serve } from "@hono/node-server";
import { app } from "./http/server.js";
import { startWebSocketServer } from "./ws/server.js";
import { IPCServer } from "./ipc/server.js";
import { config } from "../config/index.js";

const PORT = config.port || 3002;

async function main() {
  // Start HTTP server
  serve({
    fetch: app.fetch,
    port: PORT,
  });
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);

  // Start WebSocket server
  const wss = startWebSocketServer(PORT + 1);
  console.log(`🔌 WebSocket Server running on ws://localhost:${PORT + 1}`);

  // Start IPC server
  const ipcServer = new IPCServer();
  await ipcServer.start();
  console.log(`📡 IPC Server ready for process communication`);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down servers...");
    wss.close();
    await ipcServer.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down servers...");
    wss.close();
    await ipcServer.stop();
    process.exit(0);
  });
}

main().catch(console.error);
