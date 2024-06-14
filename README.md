# Koans

A REST API designed to promote relaxation, boost self-esteem, improve productivity, enhance physical health, and foster social connections.

A kōan is a story, dialogue, question, or statement from the Chinese Chan-lore, supplemented with commentaries, that is used in Zen Buddhist practice.

## Quick start

```shell
# Build & run the service using docker compose, installing dependencies to ./bin as required
# if make is available, it is preferred to use make since the make command will install a pinned
# version of docker compose to ./bin/docker-compose, which aids future maintenance by using
# pinned tool versions.
make start

# OR, if make is not available, or if you don't want to install a copy of docker-compose to
# `./bin`, you can run the app directly using docker
docker compose up
```

The stack will then launch and the API will be available at <http://localhost/v1/>

Swagger available at <http://localhost/swagger>

## Prerequisites

### Building & running

- [Docker](https://docs.docker.com/engine/install/) to run the stack, developed using version 26.1.4

### Development

Developed on Mac OS 14.2.1, arm64, Node.js 22.3.0

- [Node.js](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs) (version >= 18), developed using version 22.3.0
- Optionally, [make](https://www.gnu.org/software/make/) is used to automate important build tasks & to provide some helpful development utilities. Make can be installed on make using brew `brew install make`. This is an optional dependency because you can still run Docker, Node, and NPM commands directly without make.

### Commentary on other dependencies

So long as Docker is installed on the local machine, this project will run since all other dependencies are installed either to `./bin` as required, or are included as part of the Docker build process.

For projects that will require long term maintenance or support, I like to pin tool versions which means installing them to a local directory named `./bin`. This can avoid breaking changes in required tools so when we revisit this project in several years, we will hopefully have an easier time getting started by not needing to immediately worry about breaking changes in required tools.

## Code comments & commentary

I'm including commentary on various decisions I've made here in my code. Generally I wouldn't write this much commentary but I wanted to include detailed discussions on some decisions made.

For example, in the Dockerfile I write a mini-essay on which is the best base image to use for distributions and I wouldn't normally include those types of discourses, but I wanted to be very explicit about some decisions made and the thought process that goes into them.

These "commentaries" have been tagged so you can differentiate them from regular comments, e.g.:

```js
// Commentary:
// Including detailed discussions about some choices can be interesting, 
// but it isn't really necessary to go into this level of detail and write
// an essay about base images every time you make an Node.js API.
```

## Getting started

### Run for testing & development

```shell
# Deploy the stack locally and run using Docker
# - Intended to enable getting up & running quickly for the purpose of local development & iteration
# - Tests are NOT run automatically here
#   - since the intention is to improve iteration speed via automation, we don't want to inject waits at this point
#   - unit tests, and usually integration tests, should be automatically run in these situations:
#     - pre-commit hook
#     - when creating a PR
#     - after merging a PR 
#     - when creating builds other than for local iteration
#   - e2e tests should be run manually (`make e2e`) by developers as part of their development process
#   - e2e tests should automatically run whenever a stage is deployed, e.g. after deploying to dev
#     - ideally each merge to "develop" / "main" / "release" branches triggers an automated deployment, which triggers e2e tests, meaning e2e will be run once per Pull Request to triangulate problematic commits
# - Setup environment by creating .env, if it does not already exist, using a template such as `.env.local.template`
# - Builds App & Docker images via Docker Compose
# - Runs Docker Compose stack
#   - Creates Mongo
#   - Creates Mongo Express development utility
#   - Creates App server
make start
```

### Tests

Execute tests using

```shell
# run unit & integration tests
make test

# run e2e tests
make e2e
```

### Building & publishing

Publishing this project has been implemented for demonstration purposes while not actually tested.

Normally publishing new images would be a pipeline job, but I would still contain the automation of this process within the Makefile and have the pipeline invoke the Makefile rather than putting the build & publish logic in the pipeline. This aids portability & debugging.

Note that the `docker-publish` and `docker-push` commands will actually fail since I intentionally set the image registry to a fake registry ("my-private-registry.doesntexist") but you can see how this works.

#### Build & push a multi-architecture image

It's often better practice to publish images that support multiple architectures which we can do using docker buildx.

`make docker-publish` will create a virtual build machine as a docker container and then create an image which contains support for all the architectures provided as a build argument.

```shell
# Build multi-architecture docker image
# - Resets local build environment to the targeted stage
#   - deletes .env and recreates .env from the stage-appropriate template (e.g. `.env.dev.template`)
#   - also here is where we would either pull down or inject required build secrets
# - Execute unit & integration tests prior to building (`make test`)
# - Create a virtual build machine
# - Build docker image for several architectures (currently linux/arm64 & linux/amd64)
#   - if `STAGE == qa || STAGE == prod`, we will build without using the docker build cache (--no-cache)
# - Push the image
STAGE=dev VERSION=0.1.0 make docker-publish
```

#### Build & push a single architecture image

```shell
# Build single architecture docker image
# - Resets local build environment to the targeted stage
#   - deletes .env and recreates .env from the stage-appropriate template (e.g. `.env.dev.template`)
#   - also here is where we would either pull down or inject required build secrets
# - Execute unit & integration tests prior to building (`make test`)
# - Build docker image
#   - if `STAGE == qa || STAGE == prod`, we will build without using the docker build cache (--no-cache)
STAGE=dev VERSION=0.1.0 make docker-build

# Push the docker image
STAGE=dev VERSION=0.1.0 make docker-push

# Updating running services with the new image is considered out-of-scope here.
# The scope of build & publish is to publish a new image only. Services can decide how they want to include this update, e.g. via their image tagging strategy or perhaps using some CD system like Flux.
```

## Project structure

- **./bin** is where pinned versions of required tools are installed. The contents of this folder are ignored since binary files should not be included in version control.
- **./dist** - output directory when building the API service
- **./mongo** - support files for mongo
- **./scripts** - utilities that support build & development are included here
- **./src** - sorce code for the API service

Some folders are intended to be empty in version control, e.g. the contents of `./bin` should be excluded from version control. But to maintain & enforce the project structure, I create `.keep` files which are included in version control.

## Quick reference

### Makefile

- `make start` will setup the local environment then build & run the app
- `make stop` will stop the running app
- `make destroy` will stop & delete the running app (e.g. remove docker containers)
- `make test` will execute unit & integration tests
- `make e2e` will execute e2e test suite

### API

Swagger UI available at <http://localhost/swagger>

OpenAPI spec for v1 available at <http://localhost/v1/openapi.json> and <http://localhost/v1/openapi.yaml>

