import parsePort from '../helpers/parsePort';
import Config from './Config';

/**
 * Initializes a Config object from the environment
 * @returns {Config} config object
 * @throws {Error} if the value of KOANS_PORT is specified with an invalid port value
 */
const createConfig = (): Config => ({
  developmentMode: process.env.NODE_ENV === 'development',
  port: parsePort(process.env.KOANS_PORT ?? '3000'),
  hostname: process.env.KOANS_HOSTNAME ?? 'localhost',
  mongo: process.env.KOANS_MONGO_URI ?? '',
});

export default createConfig;