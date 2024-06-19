import { Response, Request, Router } from "express";
import { bearerAuth } from "../../../services/auth/auth.middleware";
import { Schema, checkSchema, matchedData, validationResult } from "express-validator";
import { SortOrder } from "mongoose";

const getCategoriesSchema: Schema = {
  page: {
    in: 'query',
    isInt: {
      options: {
        min: 1,
      }
    },
    toInt: true,
    optional: true,
  },
  pageSize: {
    in: 'query',
    isInt: {
      options: {
        min: 1,
        max: 100,
      }
    },
    toInt: true,
    optional: true,
  },
  order: {
    in: 'query',
    isIn: { options: [[ 'asc', 'desc', 1, -1, 'ascending', 'descending' ]] },
    optional: true,
  },
};

const categories = (): Router => {
  const router = Router();
  const path = '/categories';

  // GET /v1/categories
  // Responses:
  //  - 200 => OK
  //  - 400 => Bad Request
  //  - 401 => Not Authorized
  router.get(
    path,
    bearerAuth,
    checkSchema(getCategoriesSchema),
    async (req: Request, res: Response) => {
      // Check authorization
      if (!res.locals.user) {
        return res.status(401).end('Not Authorized');
      }

      // Check schema validation
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).end('Bad Request'); 
      }
      const filter = matchedData<{
        page?: number;
        pageSize?: number;
        order?: SortOrder;
      }>(req);

      const searchResult = await req.app.activityService.getCategories({
        page: filter.page,
        pageSize: filter.pageSize,
        order: filter.order,
      });

      res.status(200).json(searchResult).end();
    },
  )

  return router;
};

export default categories;