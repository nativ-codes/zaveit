.PHONY: deploy stop logs status test

deploy:
	docker compose up -d --build

stop:
	docker compose down

logs:
	docker compose logs -f

status:
	docker compose ps

test:
	go test ./...
