import { Router, type IRouter } from "express";
import { MIGRATION_SQL } from "../lib/migrate";

const router: IRouter = Router();

router.get("/admin/migrate", (_req, res): void => {
  res.type("text/plain").send(MIGRATION_SQL.trim());
});

export default router;
