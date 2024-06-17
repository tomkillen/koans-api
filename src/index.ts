import { config as dotEnv } from 'dotenv';
import createConfig from './config/createConfig';
import Server from './Server';
import logger from './utilities/logger';

// Import environment variables from .env if it is present
// Note that shell or defined environment variables take precendence over .env
dotEnv();

const run = async () => {
  const config = createConfig();

  const server = await Server(config);
  server.start();

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down...');
    try {
      await server.stop();
    } catch (err) {
      logger.warning(`error while shutton down the server ${err}`);
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

run();
