# Default goal is to launch the app using `up` which creates & starts the stack using docker compose
.DEFAULT_GOAL := up

### Control

# Create & start the stack
.PHONY: up
up: docker-compose
	$(DOCKER_COMPOSE) up

# Stops the stack
.PHONY: stop
stop: docker-compose
	$(DOCKER_COMPOSE) stop

# Stop & destroy the stack
.PHONY: down
down: docker-compose
	$(DOCKER_COMPOSE) down

.PHONY: restart
restart: down up


### Tools

DOCKER_COMPOSE = bin/docker-compose
.PHONY: docker-compose
docker-compose: $(DOCKER_COMPOSE)
$(DOCKER_COMPOSE):
	$(SHELL) scripts/install_docker-compose.sh