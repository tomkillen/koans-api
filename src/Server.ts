import { createServer } from 'http';
import logger from './utilities/logger';
import Config from './config/Config';
import App from './App';
import mongoose from 'mongoose';

/**
 * Server for the Koans API
 */
const Server = async (config: Config) => {
  const mongooseClient: mongoose.Mongoose = await mongoose.connect(config.mongo);
  const server = createServer(await App(mongooseClient));

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
        server.close(async (err) => {
          if (err) {
            // the server was not started
            logger.warning('failed to stop server with error: %s. Was the server started?', err);
            reject(err);
          } else {
            // the server has finished closing
            logger.info('Stopped server')
            try {
              await mongooseClient.disconnect();
            } catch (err) {
              logger.warning(`Failed to disconnect: ${err}`);
            } finally {
              resolve();
            }
          }
        });
      });
    },
  };
};

export default Server;
