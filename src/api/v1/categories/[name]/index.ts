import { NextFunction, Request, Response, Router, json } from "express";
import { adminBearerAuth, bearerAuth } from "../../../../services/auth/auth.middleware";
import { Schema, checkSchema, matchedData, validationResult } from "express-validator";
import isDifficultyValidator from "../../../../validators/isDifficultyValidator";
import { SortOrder } from "mongoose";
import ActivityService, { ActivitiesSortByKey } from "../../../../services/activity/activity.service";
import { Difficulty, getDifficultyValue } from "../../../../services/activity/activity.difficulty";

const deleteCategorySchema: Schema = {
  name: {
    in: 'params',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
};

const patchCategorySchema: Schema = {
  name: {
    in: 'params',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  newName: {
    in: 'body',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
};

const getCategorySchema: Schema = {
  name: {
    in: 'params',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
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
  duration: {
    in: 'query',
    isInt: {
      options: {
        min: 0,
      }
    },
    toInt: true,
    optional: true,
  },
  difficulty: {
    in: 'query',
    custom: {
      options: isDifficultyValidator,
    },
    optional: true,
  },
  sort: {
    in: 'query',
    isIn: { options: [[ 'created', 'title', 'duration', 'difficulty' ]] },
    optional: true,
  },
  order: {
    in: 'query',
    isIn: { options: [[ 'asc', 'desc', 1, -1, 'ascending', 'descending' ]] },
    optional: true,
  },
  completed: {
    in: 'query',
    isBoolean: true,
    optional: true,
  }
};

const category = (): Router => {
  const router = Router();
  const path = '/categories/:name';

  // GET /v1/categories/:name
  // Responses:
  //  - 200
  //  - 400
  //  - 401
  //  - 404
  router.get(
    path,
    bearerAuth,
    checkSchema(getCategorySchema),
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

      // Find all activities within this category
      // and allow the user to filter
      // Very similar to activity searching
      const query = matchedData<{
        name: string,
        page?: number;
        pageSize?: number;
        query?: string,
        duration?: number;
        difficulty?: Difficulty;
        sort?: ActivitiesSortByKey;
        order?: SortOrder;
        completed?: boolean;
      }>(req);

      const queryResult = await req.app.activityService.getActivities({
        page: query.page,
        pageSize: query.pageSize,
        searchTerm: query.query,
        category: query.name,
        duration: query.duration ? { min: query.duration } : undefined,
        difficulty: query.difficulty ? { min: getDifficultyValue(query.difficulty) } : undefined,
        sortBy: (query.sort || query.order) ? {
          key: query.sort ?? 'title',
          direction: query.order ?? 'asc',
        } : undefined,
      });

      // If there are no activities for the category, then the category
      // does not exist
      if (queryResult.total === 0) {
        res.status(404).end('Not found');
      } else {
        res.status(200).json(queryResult).end();
      }
    },
  );

  // PATCH /v1/categories/:name
  // Rename a category, requires admin
  // Responses:
  //  - 204 category renamed
  //  - 400 bad request
  //  - 401 missing auth
  //  - 404 not found
  router.patch(
    path,
    adminBearerAuth,
    json(),
    checkSchema(patchCategorySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      // Check authorization
      if (!res.locals.user || !res.locals.user.roles || res.locals.user.roles.indexOf('admin') < 0) {
        return res.status(401).end('Not Authorized');
      }

      // Check schema validation
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).end('Bad Request'); 
      }

      const data = matchedData<{ name: string, newName: string}>(req);

      try {
        await req.app.activityService.renameCategory(data.name, data.newName);
        return res.status(204).end('OK');
      } catch (err) {
        if (err instanceof Error && err.message === ActivityService.Errors.CategoryNotFound) {
          return res.status(404).end('Not found');
        } else {
          // Unhandled error
          next(err);
        }
      }
    },
  );

  // DELETE /v1/categories/:id
  // Delete a category and all activities within it, requires admin
  // Responses:
  //  - 204 category deleted
  //  - 400 bad request
  //  - 401 missing auth
  //  - 404 not found
  router.delete(
    path,
    adminBearerAuth,
    checkSchema(deleteCategorySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      // Check authorization
      if (!res.locals.user || !res.locals.user.roles || res.locals.user.roles.indexOf('admin') < 0) {
        return res.status(401).end('Not Authorized');
      }

      // Check schema validation
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).end('Bad Request'); 
      }

      const data = matchedData<{ name: string }>(req);

      try {
        await req.app.activityService.deleteCategory(data.name);
        return res.status(204).end('OK');
      } catch (err) {
        if (err instanceof Error && err.message === ActivityService.Errors.CategoryNotFound) {
          return res.status(404).end('Not found');
        } else {
          // Unhandled error
          next(err);
        }
      }
    },
  );

  return router;
};

export default category;