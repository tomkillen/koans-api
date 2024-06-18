import { Request, Response, Router } from "express";
import { bearerAuth } from "../../../services/auth/auth.middleware";
import { Schema, checkSchema, header, matchedData, validationResult } from "express-validator";
import { ActivitiesSortByKey } from "../../../services/activity/activity.service";
import { SortOrder } from "mongoose";

const queryActivitiesSchema: Schema = {
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
    isIn: { options: [ 'created', 'title', 'category', 'duration', 'difficulty' ] },
    optional: true,
  },
  order: {
    in: 'query',
    isIn: { options: [ 'asc', 'desc', 1, -1, 'ascending', 'descending' ] },
    optional: true,
  },
  completed: {
    in: 'query',
    isBoolean: true,
    optional: true,
  }
};

type Difficulty = 'easy' | 'medium' | 'difficult' | 'challenging' | 'extreme';
const Difficulties: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  difficult: 3,
  challenging: 4,
  extreme: 5,
};

const getDifficulty = (difficulty: number | Difficulty): number => {
  if (typeof difficulty === 'number') {
    return difficulty;
  }
  return Difficulties[difficulty];
}

/**
 * @openapi
 * components:
 *  parameters:
 *    page:
 *      name: page
 *      in: query
 *      required: false
 *      description: Which page of results to load
 *      schema:
 *        type: integer
 *        minimum: 1
 *        example: 1
 *        default: 1
 *    pageSize:
 *      name: pageSize
 *      in: query
 *      required: false
 *      description: How many results to load per page
 *      schema:
 *        type: integer
 *        minimum: 1
 *        maximum: 100
 *        example: 10
 *        default: 10
 *    query:
 *      name: query
 *      in: query
 *      required: false
 *      description: Search activities containing these terms
 *      schema:
 *        type: string
 *        example: Relaxing
 *    category:
 *      name: category
 *      in: query
 *      required: false
 *      description: Filter by category or categories
 *      schema:
 *        oneOf:
 *          - type: string
 *          - type: array
 *            items: 
 *              type: string
 *    difficulty:
 *      name: difficulty
 *      in: query
 *      required: false
 *      description: Specify a minimum difficulty
 *      schema:
 *        oneOf:
 *          - type: string
 *            enum: [ easy, medium, difficult, challenging, extreme ]
 *          - type: integer
 *            minimum: 1
 *            maximum: 5
 *            default: 1
 *    duration:
 *      name: duration
 *      in: query
 *      required: false
 *      description: Specifiy a minimum duration (seconds)
 *      schema:
 *        type: integer
 *        minimum: 0
 *        default: 0
 *    sort:
 *      name: sort
 *      in: query
 *      required: false
 *      description: Sort results
 *      schema:
 *        type: string
 *        enum: [ created, title, category, duration, difficulty ]
 *        default: title
 *    order:
 *      name: order
 *      in: query
 *      required: false
 *      description: Set the direction of sorting
 *      schema:
 *        type: string
 *        enum: [ asc, desc, ascending, descending ]
 *        default: asc
 *    completed:
 *      name: completed
 *      in: query
 *      required: false
 *      description: Limit to activities you have completed
 *      schema:
 *        type: boolean
 *        default: false
 *  schemas:
 *    Activity:
 *      type: object
 *      required:
 *        - id
 *        - created
 *        - title
 *        - category
 *        - description
 *        - duration
 *        - difficulty
 *        - content
 *      properties:
 *        id:
 *          description: Activity identifier
 *          type: string
 *        created:
 *          description: Time the activity was created
 *          type: string
 *          example: 2011-09-07T08:37:37Z
 *        title:
 *          description: Title of the activity
 *          type: string
 *          example: A relaxing jog
 *        category:
 *          description: Category of the activity
 *          type: string
 *          example: Relaxation
 *        description:
 *          description: A description of the activity
 *          type: string
 *          example: Go for a long jog and clear your mind
 *        duration:
 *          description: The duration of the activity, in seconds
 *          type: integer
 *          example: 60
 *          minimum: 0
 *        difficulty:
 *          description: The difficulty rating of the activity
 *          type: integer
 *          example: 1
 *          minimum: 1
 *          maximum: 5
 *        content:
 *          description: Detailed information about an activity
 *          type: string
 *          example: Content can be very long, often many paragraphs
 *    SearchActivitiesResults:
 *      type: object
 *      required:
 *        - page
 *        - pageSize
 *        - total
 *        - activities
 *      properties:
 *        page:
 *          description: The current page of results
 *          type: integer
 *          example: 1
 *          minimum: 1
 *        pageSize:
 *          description: How many results per page
 *          type: integer
 *          example: 10
 *          minimum: 1
 *        total:
 *          description: The total number of results available
 *          type: integer
 *          example: 100
 *          minimum: 0
 *        activities:
 *          $ref: '#/components/schemas/Activity'
 * paths:
 *  /activities:
 *    get:
 *      summary: search available activities
 *      tags:
 *        - activities
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - $ref: '#/components/parameters/page'
 *        - $ref: '#/components/parameters/pageSize'
 *        - $ref: '#/components/parameters/query'
 *        - $ref: '#/components/parameters/category'
 *        - $ref: '#/components/parameters/duration'
 *        - $ref: '#/components/parameters/difficulty'
 *        - $ref: '#/components/parameters/sort'
 *        - $ref: '#/components/parameters/order'
 *        - $ref: '#/components/parameters/completed'
 */
const activities = (): Router => {
  const router = Router();
  const path = '/activities';
  router.get(path,
    header('authorization').isJWT(),
    bearerAuth,
    checkSchema(queryActivitiesSchema),
    async (req: Request, res: Response) => {
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
    },
  );

  return router;
};

export default activities;