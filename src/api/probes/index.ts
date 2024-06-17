import { Router } from "express";

const probes = (): Router => {
  const router: Router = Router();

  /**
   * @openapi
   *  /healthyz:
   *    get:
   *      description: Health check for the Koans API
   *      responses:
   *        200:
   *          description: OK
   */
  router.get('/healthyz', (_, res) => {
    // Commentary:
    // Health check should be a very cheap operation to indicate if this system is functional
    // Subsystems should implement their own health checks so we don't check the health of our 
    // dependencies here, but if we had internal subsystems (i.e. background processes, sidecars)
    // we would also have some mechanism of knowing if they are healthy and including that here
    res.status(200).send('OK');
  });

  /**
   * @openapi
   *  /alivez:
   *    get:
   *      description: Liveness probe for the Koans API
   *      responses:
   *        200:
   *          description: OK
   */
  router.get('/alivez', (_, res) => {
    // Commentary:
    // Alive check should be a very cheap "ping" type operation to check if the server is now running
    res.status(200).send('OK');
  });

  return router;
}

export default probes;