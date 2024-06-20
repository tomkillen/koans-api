import { NextFunction, Request, Response, Router, json } from "express";
import { adminBearerAuth, bearerAuth } from "../../../../services/auth/auth.middleware";
import { Schema, checkSchema, header, matchedData, param, validationResult } from "express-validator";
import ActivityService, { UpdateActivityRequestDTO } from "../../../../services/activity/activity.service";
import isDifficultyValidator from "../../../../validators/isDifficultyValidator";
import { Difficulty, getDifficultyValue } from "../../../../services/activity/activity.difficulty";
import activityCompleted from "./[completed]";

// Validation schema used for PATCH /activities/:id
const patchActivitiesRequestSchema: Schema = {
  id: {
    in: 'params',
    exists: true,
    isString: true,
    isMongoId: true,
  },
  title: {
    in: 'body',
    optional: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  category: {
    in: 'body',
    optional: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  description: {
    in: 'body',
    optional: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  content: {
    in: 'body',
    optional: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  difficulty: {
    in: 'body',
    optional: true,
    custom: {
      options: isDifficultyValidator,
    },
  },
  duration: {
    in: 'body',
    optional: true,
    isInt: {
      options: {
        min: 0,
      }
    },
    toInt: true,
  },
};

/**
 * Actions relating to a specific Activity
 */
const activity = (): Router => {
  const router = Router();
  const path = '/activities/:id';

  // Routes for /activities/:id/completed
  router.use(activityCompleted());

  // GET /activities/:id
  // Responses:
  //  - 200: OK
  //  - 401: Not Authorized
  //  - 404: Activity not found
  router.get(
    path,
    header('authorization'),
    bearerAuth,
    param('id').isMongoId(),
    async (req, res) => {
      if (!res.locals.user) {
        return res.status(401).end('Not Authorized');
      }

      if (!validationResult(req).isEmpty()) {
        return res.status(400).end('Bad Request');
      }

      const { id } = matchedData<{
        id: string;
      }>(req);

      try {
        const completed = await req.app.userActivityService.getUserActivity(res.locals.user.id, id);
        const activity = completed || await req.app.activityService.getActivity(id);
        return res.status(200).json({
          id: activity.id,
          created: activity.created,
          title: activity.title,
          category: activity.category,
          description: activity.description,
          duration: activity.duration,
          difficulty: activity.difficulty,
          content: activity.content,
          completed: completed !== null,
        }).end();
      }
      catch (err) {
        if (err instanceof Error && err.message === ActivityService.Errors.ActivityNotFound) {
          return res.status(404).end('Not Found');
        }
      }
    }
  );

  // PATCH /activities/:id
  // Updates an activity with the given values, requires administrator
  // Responses:
  //  - 204: Activity updated
  //  - 400: Malformed payload
  //  - 401: Not Authorized / Not Admin
  //  - 404: Activity doesn't exist
  //  - 409: Conflict: Attempted to rename the title to a title that is already in use
  router.patch(
    path,
    header('authorization'),
    adminBearerAuth,
    json(),
    checkSchema(patchActivitiesRequestSchema),
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
        const data = matchedData<{
          id: string;
          title?: string;
          category?: string;
          description?: string;
          content?: string;
          duration?: number;
          difficulty?: Difficulty;
        }>(req);

        const dto: UpdateActivityRequestDTO = {};

        // Be explicit about which fields we want to copy into the DTO
        // to help avoid unwanted data being injected
        // That's why some kind of casting or helper function isn't used here
        // I do NOT want to simply iterate over all keys in data otherwise I am
        // trusting the 3rd party validator far too much
        if (data.title)
          dto.title = data.title;
        if (data.category)
          dto.category = data.category;
        if (data.description)
          dto.description = data.description;
        if (data.content)
          dto.content = data.content;
        if (data.duration)
          dto.duration = data.duration;
        if (data.difficulty)
          dto.difficulty = getDifficultyValue(data.difficulty);

        if (Object.keys(dto).length === 0) {
          // Nothing to update!
          return res.status(400).end('Bad Request');
        }

        await req.app.activityService.updateActivity(data.id, dto);
  
        res.status(204).end('Activity updated');
      } catch (err) {
        if (err instanceof Error && err.message === ActivityService.Errors.TitleConflict) {
          // Title already in use
          res.status(409).end(ActivityService.Errors.TitleConflict);
        } else if (err instanceof Error && err.message === ActivityService.Errors.ActivityNotFound) {
          res.status(404).end(ActivityService.Errors.ActivityNotFound);
        } else {
          return next(err);
        }
      }
    },
  );

  // DELETE /activities/:id
  // Deletes the activity, requires administrator
  // Responses:
  //  - 204: Activity deleted
  //  - 400: Bad Request
  //  - 401: Not Authorized / Not Admin
  //  - 404: Activity doesn't exist
  router.delete(
    path,
    header('authorization'),
    adminBearerAuth,
    json(),
    param('id').isMongoId(),
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
        const data = matchedData<{
          id: string;
        }>(req);

        await req.app.activityService.deleteActivity(data.id);
  
        res.status(204).end('Activity deleted');
      } catch (err) {
        if (err instanceof Error && err.message === ActivityService.Errors.ActivityNotFound) {
          // Title already in use
          res.status(404).end(ActivityService.Errors.ActivityNotFound);
        } else {
          return next(err);
        }
      }
    },
  );

  return router;
};

export default activity;