type Config = {
  /** Is development mode enabled? */
  developmentMode: boolean;

  /** 
   * what is the hostname of the server 
   * @example http://localhost
   */
  hostname: string;

  /** Which port should the server listen to for incoming connections */
  port: number;
};

export default Config;