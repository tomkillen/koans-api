import { Router } from "express";
import v1 from "./v1";
import docs from "./docs";
import Config from "../config/Config";
import probes from "./probes";

/**
 * Creates a router that handles routing for all supported versions of the API
 * @returns Router for the API
 */
const api = (config: Config): Router => {
  const router = Router();

  // Add probes, e.g. '/healthz' '/alivez'
  router.use(probes());

  // Route '/api-docs'
  router.use(docs(config));

  // Route '/v1'
  router.use(v1());
  
  return router;
}

export default api;