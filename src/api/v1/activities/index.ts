import { NextFunction, Request, Response, Router, json } from "express";
import { adminBearerAuth, bearerAuth } from "../../../services/auth/auth.middleware";
import { Schema, checkSchema, header, matchedData, validationResult } from "express-validator";
import ActivityService, { ActivitiesSortByKey, CreateActivityRequestDTO } from "../../../services/activity/activity.service";
import { SortOrder } from "mongoose";
import activity from "./[id]";
import { Difficulty, getDifficultyValue } from "../../../services/activity/activity.difficulty";
import isDifficultyValidator from "../../../validators/isDifficultyValidator";

// Validation schema used for GET /activities
const getActivitiesRequestSchema: Schema = {
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
  query: {
    in: 'query',
    isString: true,
    trim: true,
    optional: true,
  },
  category: {
    in: 'query',
    isIn: {
      options: [
        { isString: true },
        { isArray: true },
      ]
    },
    optional: true,
  },
  sort: {
    in: 'query',
    isIn: { options: [[ 'created', 'title', 'category', 'duration', 'difficulty' ]] },
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

// Validation schema used for POST /activities
const postActivitiesRequestSchema: Schema = {
  title: {
    in: 'body',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  category: {
    in: 'body',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  description: {
    in: 'body',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  content: {
    in: 'body',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  difficulty: {
    in: 'body',
    exists: true,
    custom: {
      options: isDifficultyValidator,
    },
  },
  duration: {
    in: 'body',
    exists: true,
    isInt: {
      options: {
        min: 0,
      }
    },
    toInt: true,
  },
};

/**
 * Creates router for /activities
 */
const activities = (): Router => {
  const router = Router();
  const path = '/activities';

  // add /activities/{id}
  router.use(activity());

  // GET /v1/activities
  // Supports filtering and searching available activities
  // Requires user to be signed in
  // Responses:
  //  - 200: OK => { GetActivitiesResponseDTO }
  //  - 400: Bad Request => text
  //  - 401: Not Authorized => text
  router.get(path,
    header('authorization'),
    bearerAuth,
    checkSchema(getActivitiesRequestSchema),
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
        query?: string,
        category?: string | string[],
        duration?: number;
        difficulty?: Difficulty;
        sort?: ActivitiesSortByKey;
        order?: SortOrder;
        completed?: boolean;
      }>(req);

      const searchResult = await req.app.activityService.getActivities({
        page: filter.page,
        pageSize: filter.pageSize,
        searchTerm: filter.query,
        category: filter.category,
        duration: filter.duration ? { min: filter.duration } : undefined,
        difficulty: filter.difficulty ? { min: getDifficultyValue(filter.difficulty) } : undefined,
        sortBy: (filter.sort || filter.order) ? {
          key: filter.sort ?? 'title',
          direction: filter.order ?? 'asc',
        } : undefined,
      });

      res.status(200).json(searchResult).end();
    },
  );

  // POST /v1/activities
  // Creates a new activity
  // Requires user to be signed in as admin
  // Responses:
  //  - 201: Created => string id of the created activity
  //  - 400: Missing or malformed data => text
  //  - 401: Not authorized (not signed in or not admin) => text
  //  - 409: Conflict (title already in use) => text
  router.post(
    path,
    header('authorization'),
    adminBearerAuth,
    json(),
    checkSchema(postActivitiesRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      const checkDataValidation = validationResult(req);
      
      // Check data validation results
      if (!checkDataValidation.isEmpty()) {
        return res.status(400).end('Bad Request'); 
      }

      // Check user has authority to perform admin actions
      if (!res.locals.user || !res.locals.user.roles || res.locals.user.roles.indexOf('admin') < 0) {
        return res.status(401).end('Not Authorized');
      }

      try {
        // We could be fancy and type this as
        // Omit<CreateActivityRequestDTO, 'difficulty'> & { difficulty: Difficulty }
        // but then it becomes unreadable
        const data = matchedData<{
          title: string;
          category: string;
          description: string;
          content: string;
          duration: number;
          difficulty: Difficulty;
        }>(req);

        // Be explicit about which fields we want to copy into the DTO
        // to help avoid unwanted data being injected
        // That's why a helper function isn't being used
        const dto: CreateActivityRequestDTO = {
          title: data.title,
          category: data.category,
          description: data.description,
          content: data.content,
          duration: data.duration,
          difficulty: getDifficultyValue(data.difficulty),
        };

        const id = await req.app.activityService.createActivity(dto);
  
        res.status(201).json({ id }).end();
      } catch (err) {
        if (err instanceof Error && err.message === ActivityService.Errors.TitleConflict) {
          res.status(409).end(ActivityService.Errors.TitleConflict);
        } else {
          return next(err);
        }
      }
    },
  )

  return router;
};

export default activities;