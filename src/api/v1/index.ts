import { Router } from "express";
import user from "./user";

/**
 * Creates a router for API v1
 */
const v1 = (): Router => {
  const router = Router();

  // routes for '/user'
  router.use(user());
  
  return router;
};

export default v1;