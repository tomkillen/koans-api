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

  // route '/api-docs' to return the OpenAPI spec
  router.get('/api-docs', function(req, res) {
    if (req.accepts('yaml')) {
      // See https://www.rfc-editor.org/rfc/rfc9512.html
      // Defines the mimetype yaml as 'application/yaml'
      // as of February 2024 so we should prefer that now
      res.setHeader('Content-Type', 'text/yaml');
      res.status(200).send(YAML.stringify(OpenApiSpec, null, 2));
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(OpenApiSpec, null, 2));
    }
  });

  // route '/api-docs/swagger' to return Swagger UI
  router.use(
    '/api-docs/swagger',
    SwaggerUI.serve,
    SwaggerUI.setup(OpenApiSpec),
  );
  return router;
}

export default docs;