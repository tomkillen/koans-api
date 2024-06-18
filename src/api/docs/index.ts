import { Router } from "express";
import SwaggerUI from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import logger from "../../utilities/logger";

export const OpenAPISpecPath = path.join(__dirname, 'openapi.yaml');
export const OpenApiSpec = (() => {
  try {
    return YAML.parse(fs.readFileSync(OpenAPISpecPath, 'utf-8'));
  } catch (err) {
    logger.warning(`error loading openapi.yaml: ${err}`);
    return {};
  }
})();

/**
 * Creates a router that handles serving api documentation
 * route '/api-docs' serves the OpenAPI specification
 * route '/api-docs/swagger' serves Swagger UI
 */
const docs = (): Router => {
  const router = Router();

  // GET /api-docs
  // Serves our OpenAPI spec
  router.get('/api-docs', function(req, res) {
    if (req.accepts('yaml')) {
      // See https://www.rfc-editor.org/rfc/rfc9512.html
      // Defines the mimetype for yaml as 'application/yaml'
      // as of February 2024 so we should prefer that now
      // But this RFC is very recent and most browsers will
      // treat it as a download which is inconvenient so
      // use text/yaml if they don't accept application/yaml
      if (req.accepts('application/yaml')) {
        res.setHeader('Content-Type', 'application/yaml');
      } else {
        res.setHeader('Content-Type', 'text/yaml');
      }
      res.status(200).send(YAML.stringify(OpenApiSpec, null, 2));
    } else {
      // Default to JSON if YAML is not accepted
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(OpenApiSpec, null, 2));
    }
  });

  // GET '/api-docs/swagger'
  // Serve swagger UI
  // Commentary: I really would have prefered to use https://www.npmjs.com/package/swagger-ui-dist
  //             but it was too hard to get working with a Server-Side app (vs a SPA, e.g. with React).
  //             I've done projects in the past where I serve it as a react component and it's much
  //             nicer. But I didn't get it working so here you have the old swagger ui. Enjoy.
  router.use(
    '/api-docs/swagger',
    SwaggerUI.serve,
    SwaggerUI.setup(OpenApiSpec),
  );
  return router;
}

export default docs;