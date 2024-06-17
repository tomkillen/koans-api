import { Router } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import SwaggerUI from 'swagger-ui-express';
import YAML from 'yaml';
import Config from "../../config/Config";

/**
 * Creates a router that handles serving api documentation
 * route '/api-docs' serves the OpenAPI specification
 * route '/api-docs/swagger' serves Swagger UI
 * @returns Router for the API
 */

const docs = (config: Config): Router => {
  const router = Router();

  // Configure our API spec
  const apiSpec = swaggerJSDoc({
    failOnErrors: true,
    definition: {
      openapi: '3.1.0',
      host: config.hostname,
      basePath: config.hostname,
      info: {
        title: 'Koans API',
        description: 'A REST API designed to promote relaxation, boost self-esteem, improve productivity, enhance physical health, and foster social connections.',
        version: '0.1.0',
      },
      components: {
        securitySchemes: {
          basicAuth: {
            type: 'http',
            scheme: 'basic',
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
        },
      },
      servers: [{
        url: `http://${config.hostname}/v1`,
      }],
    },
    apis: [ '**/index.js', '**/index.ts' ],
  });

  // route '/api-docs' to return the OpenAPI spec
  router.get('/api-docs', function(req, res) {
    if (req.accepts('yaml')) {
      // See https://www.rfc-editor.org/rfc/rfc9512.html
      // Defines the mimetype yaml as 'application/yaml'
      // as of February 2024 so we should prefer that now
      res.setHeader('Content-Type', 'application/yaml');
      res.status(200).send(YAML.stringify(apiSpec, null, 2));
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(apiSpec, null, 2));
    }
  });

  // route '/api-docs/swagger' to return Swagger UI
  router.use(
    '/api-docs/swagger',
    SwaggerUI.serve,
    SwaggerUI.setup(apiSpec),
  );

  return router;
}


export default docs;