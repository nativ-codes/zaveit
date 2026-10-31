.PHONY: deploy deploy-prod stop logs status test check-sources

deploy:
	docker compose up -d --build

deploy-prod:
	git pull --ff-only
	docker compose -f compose.prod.yaml up -d --build

stop:
	docker compose down

logs:
	docker compose logs -f

status:
	docker compose ps

test:
	go test ./...

check-sources:
	@go run ./cmd/check-sources
