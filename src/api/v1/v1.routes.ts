import { Router } from "express";
import v1UserRoutes from "./v1.user.routes";

/**
 * Creates a router for API v1
 */
const v1Routes = (): Router => {
  const router = Router();
  router.use(v1UserRoutes('/v1'));
  return router;
};

export default v1Routes;