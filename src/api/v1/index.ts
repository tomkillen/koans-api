import { Router } from "express";
import user from "./user";
import auth from "./auth";
import activities from "./activities";

/**
 * Creates a router for API v1
 */
const v1 = (): Router => {
  const router = Router();

  // routes for '/user'
  router.use(user());

  //routes for '/auth'
  router.use(auth());

  // routes for '/activities'
  router.use(activities());
  
  return router;
};

export default v1;