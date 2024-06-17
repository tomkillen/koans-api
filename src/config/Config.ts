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

  /** 
   * mongo connection string
   * @exmaple mongodb://username:password@127.0.0.1:27017/dbname
   */
  mongo: string;
};

export default Config;