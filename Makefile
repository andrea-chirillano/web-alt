COMPOSE := docker compose

.PHONY: dev prod stop logs

dev:
	$(COMPOSE) --profile dev up --build -d
	@echo "Dev server: http://localhost:5173 (make logs to follow, make stop to stop)"

prod:
	$(COMPOSE) --profile prod up --build -d
	@echo "Production build: http://localhost:8080"

stop:
	$(COMPOSE) --profile dev --profile prod down

logs:
	$(COMPOSE) --profile dev logs -f
