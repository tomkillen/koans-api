import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { serve as serveSwaggerUi, setup as setupSwaggerUi } from 'swagger-ui-express';
import logger from './utilities/logger';
import Config from './config/Config';
import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Server for the Koans API
 */
const Server = (config: Config) => {
  const root = express();
  const server = createServer(root);

  // Setup permissive CORS policy since we aren't restricting usage of this API
  root.use(cors({
    // Allow any origin, this is an open service
    origin: '*',

    // IE11 and Smart TV's can't handle 204 for OPTIONS
    optionsSuccessStatus: 200,
  }));

  /**
   * @openapi
   *  /healthyz:
   *    get:
   *      description: Health check for the Koans API
   *      responses:
   *        200:
   *          description: OK
   */
  root.get('/healthyz', (_, res) => {
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
  root.get('/alivez', (_, res) => {
    // Commentary:
    // Alive check should be a very cheap "ping" type operation to check if the server is now running
    res.status(200).send('OK');
  });

  // Add API DOC middleware when development mode is enabled
  if (config.developmentMode) {
    root.use(
      '/api-docs/swagger',
      serveSwaggerUi,
      setupSwaggerUi(swaggerJSDoc({
        failOnErrors: true,
        definition: {
          openapi: '3.1.0',
          host: config.hostname,
          basePath: config.hostname,
          info: {
            title: 'Koans API',
            description: 'A REST API designed to promote relaxation, boost self-esteem, improve productivity, enhance physical health, and foster social connections.',
            version: '0.1.0',
          },
        },
        apis: [ '**/*.routes.js', '**/*.routes.ts' ],
      })),
    );
  };

  // Catch-all not found
  root.all('*', (_, res) => {
    res.status(404).send('not found');
  });

  return {
    /**
     * Starts the server on the specified port
     */
    start: (): Promise<void> => {
      logger.info('Starting server on port %d...', config.port);

      // Promisify server.listen
      return new Promise<void>((resolve) => {
        server.listen(config.port, () => {
          logger.info('Server started');
          resolve();
        });
      });
    },

    /**
     * Stop the server gracefully, allowing current connections to finish their work
     * @throws {Error} if the server was not yet started
     */
    stop: (): Promise<void> => {
      logger.info('Stopping server...');
      // promisify server.close
      return new Promise((resolve, reject) => {
        // tell the server to start shutting down and wait for it to finish
        // callback contains an error if the server was not started
        server.close((err) => {
          if (err) {
            // the server was not started
            logger.warning('failed to stop server with error: %s. Was the server started?', err);
            reject(err);
          } else {
            // the server has finished closing
            logger.info('Stopped server')
            resolve();
          }
        });
      });
    },
  };
};

export default Server;
