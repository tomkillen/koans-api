/**
 * Parses the given value into a valid port.
 * 
 * Value must be a number between 1 and 65535 (inclusive)
 * 
 * @param value integer-string to be parsed into a port, must be an integer string between 1 and 65535 (inclusive)
 * @returns value parsed into an integer string
 * @throws if value is not an integer string between 1 and 65535 (inclusive)
 */
const parsePort = (value: string): number => {
  // Only accept positive integer strings
  if (!/^\d+$/.test(value)) {
    throw new Error(`value ${value} is not an integer-string`);
  }

  const port = parseInt(value);

  // Ensure port is valid
  if (isNaN(port)) {
    throw new Error(`could not parse ${value} as an integer`);
  } 
  
  if (port < 1 || port > 65535) {
    throw new Error(`value ${value} is out of range, must be between 1 and 65535 (inclusive)`);
  }

  return port;
};

export default parsePort;