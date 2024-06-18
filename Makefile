# Normally I would set the default goal to be a no-op OR I would set the default goal to be `build`
# but for this demonstrate it is set to `start` to enable previewing
.DEFAULT_GOAL := start

# Default to "local" stage, with local being a psuedo-stage for running locally
# Typical stages would be `dev`, `qa`, `prod`, and often others such as `pr` or `uat`
# You can toggle which stage is being targeted either by environment variable or by
# setting the STAGE variable before invoking a make command, e.g. `STAGE=dev make start`
STAGE ?= local

# VERSION should be updated whenever we deploy
# Follow semantic versioning conventions MAJOR.MINOR.PATCH
# https://semver.org/
VERSION ?= 0.1.0

# IMG defines what how we tag our image and which registry we push it to
ifeq ($(STAGE), prod)
IMG ?= my-private-registry.doesntexist/koans-api:$(VERSION)
else
IMG ?= my-private-registry.doesntexist/koans-api:$(VERSION)-$(STAGE)
endif

DOCKER_BUILD_FLAGS =
ifneq ($(STAGE), prod)
ifneq ($(STAGE), qa)
DOCKER_BUILD_FLAGS = --no-cache
endif
endif

# Commentary:
# I like to use Makefiles as a highly portable automation tool.
# For most projects, I like to have a set of standard make commands, as applicable:
# - `make start` - enable a new developer with no experience to run the app with a 1-shot command
#		- setup the local environment (e.g. create `.env` with functional defaults if possible)
#		- if applicable, fetch required runtime secrets (prompt developer to authenticate if necessary) and save secrets to `./secrets` which is ignored in version control
#		- install toolchain dependencies, as required, using pinned tool versions to `./bin`
#		- build everything and assemble the runtime
#		- start the runtime
#	- `make setup-env` - initialize the working environment for the current stage, see $(STAGE)
#	- `make run` - a lighter version of "start" that isn't as exhaustive with setup for rapid iteration cycles
# - `make stop` - stop the runtime (e.g. stop running docker containers)
# - `make destroy` - stop & delete the runtime (e.g. stop & remove running docker containers)
# - `make restart` - call destroy & then start to launch a fresh debugging session
# - `make build` - compile everything (e.g. build source and/or docker images)
# - `make lint` - linting, often invoked by a precommit hook
# - `make test` - execute unit tests & probably also integration tests, sometimes e2e as well if practical
# - `make e2e` - execute e2e test suite
# - `make deploy`
#		- send the app live to the targeted environment (e.g. `STAGE=dev make deploy` to deploy to dev stage)
#		- this could mean any or some of
#			- build & tag docker images, 
#			- push images,
#			- update deployment stage or trigger CD, etc
#			- publish npm package
#			- perhaps create a merge request, in some use cases (e.g. Flux)
#		- targeting PROD or stages other than DEV would usually be protected
#		- generally it is a good idea to automatically run at least unit & integration tests, 
#			and ideally some e2e if practical, and require these to succeed before allowing deploy to proceed
#			but it might be preferred to run tests using some other tool or in a pipeline rather than here
#		- what exactly "deploy" means is very contextual
# - `make clean` - clean the local working structure, deleting all build artefacts, logs, secrets
# - `make clean-bin` - delete toolchain dependencies
# - `make clean-env` - reverse of setup-env
# - `make clean-all` - execute all cleans

# Do everything required to setup & run the app, including initializing the current working environment
.PHONY: start
start: setup-env docker-compose-build-nocache docker-compose-up

# Similar to start, but more light-weight. Assume the environment is already setup
.PHONY: run
run: docker-compose-up

# Stop the app
.PHONY: stop
stop: docker-compose-stop

# Stop & destroy the running instance
.PHONY: destroy
destroy: docker-compose-down

# Destroy & then start the app for a fresh debugging session, useful for slightly quicker iteration
.PHONY: restart
restart: destroy docker-compose-build-nocache docker-compose-up

# Clean the working environment, delete build products, aretefacts, etc
.PHONY: clean
clean:
	rm -rf dist

# Clean everything
.PHONY: clean-all
clean-all: clean clean-bin clean-env

### Testing

.PHONY: lint
lint:
	npm run lint

.PHONY: test
test:
	npm test

.PHONY: e2e
e2e: ; # TODO

### Docker

# Support docker-compose in a self-contained fashion by using the pinned version of docker-compose

# Create & start the stack
.PHONY: docker-compose-up
docker-compose-up: docker-compose
	$(DOCKER_COMPOSE) up

# Build the stack
.PHONY: docker-compose-build
docker-compose-build:
	$(DOCKER_COMPOSE) build

# Build the stack without cache
.PHONY: docker-compose-build-nocache
docker-compose-build-nocache:
	$(DOCKER_COMPOSE) build --no-cache

# Start the stack
.PHONY: docker-compose-start
docker-compose-start: docker-compose
	$(DOCKER_COMPOSE) start

# Stops the stack
.PHONY: docker-compose-stop
docker-compose-stop: docker-compose
	$(DOCKER_COMPOSE) stop

# Stop & destroy the stack
.PHONY: docker-compose-down
docker-compose-down: docker-compose
	$(DOCKER_COMPOSE) down

# Build a new docker image
.PHONY: docker-build
docker-build: check-stage-env test
	docker build $(DOCKER_BUILD_FLAGS) \
		--progress=plain \
		-t $(IMG) \
		. 

# Push the built image
# Note that this command will actually fail since I intentionally set the image registry
# to a fake registry ("my-private-registry.doesntexist") but you can see how this works
.PHONY: docker-push
docker-push:
	docker push $(IMG)

# For published images, it is usually good practice to support several architectures
# which we can do using buildx, creating a virtual build machine as a docker container
# Note that this command will actually fail since I intentionally set the image registry
# to a fake registry ("my-private-registry.doesntexist") but you can see how this works
.PHONY: docker-publish
docker-publish: check-stage-env test
	docker buildx create \
		--name build-multiplatform \
		--driver docker-container \
		--bootstrap \
		--use
	docker buildx build $(DOCKER_BUILD_FLAGS) \
		--platform linux/arm64 linux/amd64 \
		--progress=plain \
		-t $(IMG) \
		. \
		--push \ 
		|| echo "Failed to build & publish docker image using buildx"
	docker buildx rm build-multiplatform

### Building

.PHONY: build
build:
	npm run build

### Setup & codegen

# Initialize the environment
.PHONY: setup-env
setup-env: .env

# Reset the environment
.PHONY: clean-env
clean-env:
	find . -name ".env*" -not -name "*.template" -maxdepth 1 -delete

# Initialize .env file if it doesn't already exist
# Don't fail if no template for the stage exists since
# these values might be provided by other means
.env:
	cp .env.$(STAGE).template .env || true

# Utility that resets the environment if we are targeting a non-development stages
.PHONY: check-stage-env
check-stage-env:
ifneq ($(STAGE), local)
ifneq ($(STAGE), dev)
# Since we are targeting a non-development stage, ensure state is reset
	$(MAKE) clean-env
endif
endif
	$(MAKE) setup-env

### Development - commands that enable running locally outside of docker
.PHONY: dev-start
dev-start:
	$(MAKE) dev-mongo-up
	npm run start:dev:watch || true
	$(MAKE) dev-mongo-stop

# Run an exposed mongo db instance for local development purposes
.PHONY: dev-mongo-up
dev-mongo-up:
	$(DOCKER_COMPOSE) -f docker-compose-mongo.yaml up --detach

# Stop & destroy development mongo do
.PHONY: dev-mongo-stop
dev-mongo-stop:
	$(DOCKER_COMPOSE) -f docker-compose-mongo.yaml stop

# Stop & destroy development mongo do
.PHONY: dev-mongo-down
dev-mongo-down:
	$(DOCKER_COMPOSE) -f docker-compose-mongo.yaml down

### Tools

# Delete tools from ./bin, but preserve .keep
.PHONY: clean-bin
clean-bin:
	find ./bin -not -name ".keep" -delete

# ==== Docker Compose ====
# Pin a version of docker compose for a reliable toolchain
# Also enables others to run this project without too many prerequisite dependencies since we are self-contained
DOCKER_COMPOSE = bin/docker-compose
.PHONY: docker-compose
docker-compose: $(DOCKER_COMPOSE)
$(DOCKER_COMPOSE):
	$(SHELL) scripts/install_docker-compose.sh