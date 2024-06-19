/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request } from "express"
import type { IncomingHttpHeaders } from 'http';

const mockRequest = ({
  headers,
  body,
  app,
}: {
  headers?: IncomingHttpHeaders,
  body?: any,
  app?: any,
}): Request => {
  const req: any = {};
  req.app = app ?? {};
  req.headers = headers ?? {};
  req.body = body ?? {};
  return req;
};

export default mockRequest;