import { Hono } from "hono";
import { tablesRouter, crudRouter } from "./index";

const v1Router = new Hono();

v1Router.route("/tables", tablesRouter);
v1Router.route("", crudRouter);

export default v1Router;