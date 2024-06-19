/* eslint-disable @typescript-eslint/no-explicit-any */

import { jest } from "@jest/globals";
import { Response } from "express"

const mockResponse = ({
  locals,
}: {
  locals?: any;
}): Response => {
  const res: any = {};
  res.locals = locals ?? {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

export default mockResponse;