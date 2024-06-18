import { Router } from "express";
import v1 from "./v1";
import docs from "./docs";
import probes from "./probes";

/**
 * Creates a router that handles routing for all supported versions of the API
 * @returns Router for the API
 */
const api = (): Router => {
  const router = Router();

  // Add probes, e.g. '/healthz' '/alivez'
  router.use(probes());

  // Route '/api-docs'
  router.use(docs());

  // Route '/v1' handlers
  router.use('/v1', v1());
  
  return router;
}

export default api;