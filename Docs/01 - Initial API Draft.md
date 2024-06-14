# Routes

Informal plan of what the API could look like

```text
/api-doc
  GET: (swagger ui)
  /v1
    /openapi
/healthyz
  GET 200 system is healthy
/alivez
  GET 200 system is alive
/v1
  /user
    /{emailORUsernameOrId}
      GET - get user information (must be admin or current user)
      PATCH - update user information (must be admin or current user)
      DELETE - delete user by id (must be admin or current user)
    GET - get current user information
    PATCH - update current user information
    POST - register new user
    DELETE - delete current user account (must be at least 1 admin)
    /auth
      POST - login or refresh token
  /activities
    GET - list all activities, ?completed to filter
    POST - create new activity (requires admin)
    /{slugOrId}
      /completed
        GET - is completed
        PATCH - set completed
      GET - get the activity
      PATCH - update the activity data (requires admin) OR set completed state (not-admin)
      DELETE - delete the activity (requires admin)
  /categories
    /{slugOrId}  
      GET - get this category
      PATCH - update this category (requires admin)
      DELETE - delete this category (requires admin)
      /activities
        GET - list activities in this category, ?completed to filter
    GET - list all categories
    POST - create a new category (admin)
```
