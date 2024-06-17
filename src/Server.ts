import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import logger from './utilities/logger';
import api from './api';
import Config from './config/Config';

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

  // Add api router
  root.use(api(config));

  // Catch-all not found handler
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
