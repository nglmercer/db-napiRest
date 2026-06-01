import serverRouter from "./server";

const port = Number(process.env.PORT || "3000");

export default {
  port,
  hostname: "0.0.0.0",
  fetch: serverRouter.handle,
};

console.log(`Listening on http://0.0.0.0:${port}`);
