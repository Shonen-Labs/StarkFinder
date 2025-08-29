help:
	@echo "StarkFinder Development Commands"
	@echo "make install  - Install dependencies and build contracts"
	@echo "make build    - Build frontend and Cairo contracts"
	@echo "make test     - Run Cairo contract tests"

install:
	# Install root Node dependencies
	npm install || echo "⚠️  Root npm install failed"

cd client && npm install || echo "⚠️  Frontend npm install failed"

	if command -v scarb >/dev/null 2>&1; then cd contracts && scarb build; else echo "⚠️  Scarb not found. Skipping contract build."; fi


build:
	# Build frontend
	cd client && npm run build || echo "⚠️  Frontend build failed"

	if command -v scarb >/dev/null 2>&1; then cd contracts && scarb build; else echo "⚠️  Scarb not found. Skipping contract build."; fi


	if command -v scarb >/dev/null 2>&1; then cd contracts && scarb test; else echo "⚠️  Scarb not found. Please install Scarb to run tests: https://docs.swmansion.com/scarb/download.html"; fi
