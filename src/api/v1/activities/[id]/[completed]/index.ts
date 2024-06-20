import { Request, Response, Router, json } from "express";
import { Schema, checkSchema, matchedData, validationResult } from "express-validator";
import { bearerAuth } from "../../../../../services/auth/auth.middleware";
import ActivityService from "../../../../../services/activity/activity.service";
import UserActivityService from "../../../../../services/useractivity/useractivity.service";

const putActivityCompletedSchema: Schema = {
  id: {
    in: 'params',
    exists: true,
    isString: true,
    isMongoId: true,
  },
  completed: {
    in: 'body',
    exists: true,
    isBoolean: true,
  }
}

const activityCompleted = (): Router => {
  const router = Router();
  const path = '/activities/:id/completed';

  // PUT /v1/activties/{id}/completed
  // Sets if the specified activity has been completed
  // Responses:
  //  - 204 OK
  //  - 400 Bad request
  //  - 401 Not Authorized
  //  - 404 Not found
  //  - 409 Already complete / not complete
  router.put(
    path,
    bearerAuth,
    json(),
    checkSchema(putActivityCompletedSchema),
    async (req: Request, res: Response) => {
      // Check authorization
      if (!res.locals.user) {
        return res.status(401).end('Not Authorized');
      }

      // Check validations
      if (!validationResult(req).isEmpty()) {
        console.log(`PUT validation errors: ${JSON.stringify(validationResult(req).array(), null, 2)}`);
        return res.status(400).end('Bad Request');
      }

      const { id, completed } = matchedData<{
        id: string;
        completed: boolean;
      }>(req);

      try {
        if (completed) {
          await req.app.userActivityService.completeActivity(res.locals.user.id, id);
        } else {
          await req.app.userActivityService.uncompleteActivity(res.locals.user.id, id);
        }
        return res.status(204).end();
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === ActivityService.Errors.ActivityNotFound) {
            return res.status(404).end();
          } else if (err.message === UserActivityService.Errors.AlreadyComplete || err.message === UserActivityService.Errors.AlreadyNotComplete) {
            return res.status(409).end();
          }
        }

        // Unhandled error, rethrow
        throw err;
      }
    },
  )

  return router;
}

export default activityCompleted;