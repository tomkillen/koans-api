/**
 * Logging utility
 * 
 * Currently a placeholder / stub.
 * All logging directed to console, but this could be replaced with a proper logging utility
 * that is more appropriate for production.
 */
const logger = {

  /**
   * debug log that can accept a format argument
   * See [`util.format()`](https://nodejs.org/docs/latest-v20.x/api/util.html#utilformatformat-args) for more information.
   * @example `logger.debug('count: %d', 5);` outputs "count: 5"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (...data: any[]) => console.log(...data),

  /**
   * trace log that can accept a format argument
   * See [`util.format()`](https://nodejs.org/docs/latest-v20.x/api/util.html#utilformatformat-args) for more information.
   * @example `logger.trace('count: %d', 5);` outputs "count: 5"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trace: (...data: any[]) => console.log(...data),

  /**
   * info log that can accept a format argument
   * See [`util.format()`](https://nodejs.org/docs/latest-v20.x/api/util.html#utilformatformat-args) for more information.
   * @example `logger.info('count: %d', 5);` outputs "count: 5"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (...data: any[]) => console.log(...data),

  /**
   * warning log that can accept a format argument
   * See [`util.format()`](https://nodejs.org/docs/latest-v20.x/api/util.html#utilformatformat-args) for more information.
   * @example `logger.warning('count: %d', 5);` outputs "count: 5"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warning: (...data: any[]) => console.warn(...data),

  /**
   * error log that can accept a format argument
   * See [`util.format()`](https://nodejs.org/docs/latest-v20.x/api/util.html#utilformatformat-args) for more information.
   * @example `logger.info('count: %d', 5);` outputs "count: 5"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...data: any[]) => console.error(...data),

  /**
   * FATAL log that can accept a format argument
   * After the log is written, the server will kill itself
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fatal: (message: string) => {
    process.stdout.write(message, () => {
      process.exit(-1);
    });
  },
};

export default logger;