import serverRouter from "./server";
import { serve } from "napi-router/adapter";
const port = Number(process.env.PORT || "3000");

export default serve({
  port,
  hostname: "0.0.0.0",
  fetch: serverRouter.handle,
});

console.log(`Listening on http://0.0.0.0:${port}`);
