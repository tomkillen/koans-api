import { Router } from "express";
import v1Routes from "./v1/v1.routes";

/**
 * Creates a router that handles routing for all supported versions of the API
 * @returns Router for the API
 */
const apiRoutes = (): Router => {
  const router = Router();
  router.use(v1Routes());
  return router;
};

export default apiRoutes;