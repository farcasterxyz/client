BACKEND_PATH ?= ../backend
BACKEND_SRC    = $(BACKEND_PATH)/src
CLIENT_DATA    = packages/farcaster-client-data

.PHONY: sync-api
sync-api:
	@echo "Syncing from $(BACKEND_PATH)…"
	cp "$(BACKEND_SRC)/types.yaml" "$(CLIENT_DATA)/bin/types.yml"
	cp "$(BACKEND_SRC)/api.ts" "$(CLIENT_DATA)/src/types/api.ts"
	cp "$(BACKEND_SRC)/privateTypes.ts" "$(CLIENT_DATA)/src/types/privateTypes.ts"
	pnpm --filter farcaster-client-data run generateFarcasterClient
