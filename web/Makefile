.PHONY: deploy-prod

deploy-prod:
	git pull --ff-only
	docker compose -f compose.prod.yaml up -d --build
