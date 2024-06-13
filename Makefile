# Normally I would set the default goal to be a no-op OR I would set the default goal to be `build`
# but for this demonstrate it is set to `start` to enable previewing
.DEFAULT_GOAL := start

# Default to "local" stage, with local being a psuedo-stage for running locally
# Typical stages would be `dev`, `qa`, `prod`, and often others such as `pr` or `uat`
# You can toggle which stage is being targeted either by environment variable or by
# setting the STAGE variable before invoking a make command, e.g. `STAGE=dev make start`
STAGE ?= local

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
start: setup-env docker-up

# Similar to start, but more light-weight. Assume the environment is already setup
.PHONY: run
run: docker-up

# Stop the app
.PHONY: stop
stop: docker-stop

# Stop & destroy the running instance
.PHONY: destroy
destroy: docker-down

# Destroy & then start the app for a fresh debugging session, useful for slightly quicker iteration
.PHONY: restart
restart: destroy start

# Clean the working environment, delete build products, aretefacts, etc
.PHONY: clean
clean:
	rm -rf dist

# Clean everything
.PHONY: clean-all
clean-all: clean clean-bin clean-env

### Testing

.PHONY: lint
lint: ; # TODO

.PHONY: test
test: ; # TODO

.PHONY: e2e
e2e: ; # TODO

### Control

# Create & start the stack
.PHONY: docker-up
docker-up: docker-compose
	$(DOCKER_COMPOSE) up

# Stops the stack
.PHONY: docker-stop
docker-stop: docker-compose
	$(DOCKER_COMPOSE) stop

# Stop & destroy the stack
.PHONY: docker-down
docker-down: docker-compose
	$(DOCKER_COMPOSE) down


### Setup & codegen

# Initialize the environment
.PHONY: setup-env
setup-env: .env

# Reset the environment
.PHONY: clean-env
clean-env:
	find . -name ".env*" -not -name "*.template" -maxdepth 1 -delete

# Initialize .env file if it doesn't already exist
.env:
	cp .env.$(STAGE).template .env

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