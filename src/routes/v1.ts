import { Router } from "napi-router/adapter/router";
import { tablesRouter, crudRouter, authRouter, reelsRouter } from "./index";

const v1Router = new Router();

v1Router.mount("/tables", tablesRouter);
v1Router.mount("/auth", authRouter);
v1Router.mount("/reels", reelsRouter);
v1Router.mount("", crudRouter);

export default v1Router;
