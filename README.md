# Koans

A REST API designed to promote relaxation, boost self-esteem, improve productivity, enhance physical health, and foster social connections.

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

## Prerequisites

### Building & running

- [Docker](https://docs.docker.com/engine/install/) to run the stack, developed using version 26.1.4

### Development

Developed on Mac OS 14.2.1, arm64

- [Node.js](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs) (version >= 18), developed using version 22.3.0
- [make](https://www.gnu.org/software/make/) is used to automate important build tasks & to provide some helpful development utilities. Make can be installed on make using brew `brew install make`

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

TODO - write detailed run instructions

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


