import { NextFunction, Request, Response, Router, json } from "express";
import { adminBearerAuth, bearerAuth } from "../../../services/auth/auth.middleware";
import { Schema, checkSchema, header, matchedData, validationResult } from "express-validator";
import { ActivitiesSortByKey } from "../../../services/activity/activity.service";
import { SortOrder } from "mongoose";
import activity from "./{id}";
import logger from "../../../utilities/logger";

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
    isIn: {
      options: [
        { isInt: { min: 1 } },
        [ 'easy', 'medium', 'difficult', 'challenging', 'extreme' ],
      ],
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

const createActivityRequestSchema: Schema = {
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
    isIn: {
      options: [
        { isInt: { min: 1, max: 5 } },
        [ 'easy', 'medium', 'difficult', 'challenging', 'extreme' ],
      ],
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

// These should be promoted into the Activity service
type Difficulty = 'easy' | 'medium' | 'difficult' | 'challenging' | 'extreme';
const Difficulties: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  difficult: 3,
  challenging: 4,
  extreme: 5,
};

/**
 * Helper function that converts a difficulty string or number to a difficulty number
 */
const getDifficulty = (difficulty: number | Difficulty): number => {
  if (typeof difficulty === 'number') {
    return difficulty;
  }
  return Difficulties[difficulty];
}

/**
 * Creates router for /activities
 */
const activities = (): Router => {
  const router = Router();
  const path = '/activities';

  // add /activities/{id}
  router.use(activity());

  // GET /activities
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
    async (req: Request, res: Response, next: NextFunction) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).send('Bad Request').end(); 
      }
      const filter = matchedData<{
        page?: number;
        pageSize?: number;
        query?: string,
        category?: string | string[],
        duration?: number;
        difficulty?: number | Difficulty;
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
        difficulty: filter.difficulty ? { min: getDifficulty(filter.difficulty) } : undefined,
        sortBy: (filter.sort || filter.order) ? {
          key: filter.sort ?? 'title',
          direction: filter.order ?? 'asc',
        } : undefined,
      });

      res.status(200).json(searchResult).end();
      next();
    },
  );

  // POST /activities
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
    checkSchema(createActivityRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        logger.debug(`Validation errors creating activity: ${JSON.stringify(result.array(), null, 2)}`)
        return res.status(400).send('Bad Request').end(); 
      }
      const data = matchedData<{
        title: string;
        category: string;
        description: string;
        content: string;
        duration: number;
        difficulty: number | Difficulty;
      }>(req);

      try {
        const id = await req.app.activityService.createActivity({
          title: data.title,
          category: data.category,
          description: data.description,
          content: data.content,
          duration: data.duration,
          difficulty: getDifficulty(data.difficulty),
        });
  
        res.send(201).json({ id }).end();
      } catch (err) {
        logger.warning(`Error creating activity: ${err}: \n${JSON.stringify(err, null, 2)}`);
        next(err);
      }

      next();
    },
  )

  return router;
};

export default activities;