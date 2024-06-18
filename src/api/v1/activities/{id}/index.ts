import { Router } from "express";
import { bearerAuth } from "../../../../services/auth/auth.middleware";
import { matchedData, oneOf, param, validationResult } from "express-validator";
import { ActivityServiceErrors } from "../../../../services/activity/activity.service";

/**
 * Actions relating to a specific Activity
 */
const activity = (): Router => {
  const router = Router();
  const path = '/activity/:id';

  router.get(
    path,
    bearerAuth,
    param('id').isMongoId(),
    async (req, res) => {
      if (!res.locals.user) {
        return res.status(401).send('Not Authorized').end();
      }

      if (!validationResult(req).isEmpty()) {
        return res.status(400).send('Bad Request').end();
      }

      const { id } = matchedData<{
        id: string;
      }>(req);

      try {
        const activity = await req.app.activityService.getActivity(id);
        return res.status(200).json({
          id: activity.id,
          created: activity.created,
          title: activity.title,
          category: activity.category,
          description: activity.description,
          duration: activity.duration,
          difficulty: activity.difficulty,
          content: activity.content,
        });
      }
      catch (err) {
        if (err instanceof Error && err.message === ActivityServiceErrors.ActivityNotFound) {
          return res.status(404).send('Not Found').end();
        }
      }
    }
  )

  return router;
};

export default activity;