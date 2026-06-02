import { Router } from "napi-router/adapter/router";
import { tablesRouter, crudRouter, authRouter, reelsRouter, feedRouter, socialRouter, uploadRouter, videoProcessingRouter } from "./index";

const v1Router = new Router();

v1Router.mount("/tables", tablesRouter);
v1Router.mount("/auth", authRouter);
v1Router.mount("/reels", reelsRouter);
v1Router.mount("/feed", feedRouter);
v1Router.mount("/social", socialRouter);
v1Router.mount("/upload", uploadRouter);
v1Router.mount("/video", videoProcessingRouter);
v1Router.mount("", crudRouter);

export default v1Router;
