import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import processosRouter from "./processos";
import pacientesRouter from "./pacientes";
import medicamentosRouter from "./medicamentos";
import distribuidorasRouter from "./distribuidoras";
import faturasRouter from "./faturas";
import glosasRouter from "./glosas";
import monitoramentosRouter from "./monitoramentos";
import cotacoesRouter from "./cotacoes";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(processosRouter);
router.use(pacientesRouter);
router.use(medicamentosRouter);
router.use(distribuidorasRouter);
router.use(faturasRouter);
router.use(glosasRouter);
router.use(monitoramentosRouter);
router.use(cotacoesRouter);
router.use(aiRouter);

export default router;
