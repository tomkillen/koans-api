import { Router } from "express";
import user from "./user";
import auth from "./auth";
import activities from "./activities";
import categories from "./categories";

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

  // routes for '/categories'
  router.use(categories());
  
  return router;
};

export default v1;