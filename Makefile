# StarkFinder Makefile
# This Makefile provides convenient commands for developing and managing the StarkFinder project

.PHONY: help install build test clean dev start lint type-check db-setup docker-up docker-down contracts-build contracts-test

# Default target
help:
	@echo "StarkFinder Development Commands"
	@echo "================================"
	@echo "make install         - Install all dependencies (npm + scarb)"
	@echo "make build          - Build the entire project (frontend + contracts)"
	@echo "make dev            - Start development server"
	@echo "make test           - Run all tests"
	@echo "make lint           - Run linting"
	@echo "make type-check     - Run TypeScript type checking"
	@echo "make db-setup       - Setup database (generate + migrate)"
	@echo "make db-seed        - Seed the database with initial data"
	@echo "make clean          - Clean build artifacts and dependencies"
	@echo "make docker-up      - Start services with Docker Compose"
	@echo "make docker-down    - Stop Docker Compose services"
	@echo "make contracts-build - Build Starknet contracts"
	@echo "make contracts-test  - Run Starknet contract tests"
	@echo ""

# Install all project dependencies
install:
	@echo "Installing root dependencies..."
	@npm install
	@echo "Installing client dependencies..."
	@cd client && npm install
	@echo "Installing Prisma dependencies..."
	@cd client && npx prisma generate
	@echo "Building Starknet contracts..."
	@if [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ] && command -v scarb >/dev/null 2>&1; then \
		cd client/app/devx/contracts/utility-contracts/fee-deduction && scarb build; \
	elif [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ]; then \
		echo "⚠️  Scarb not found. Please install Scarb to build contracts: https://docs.swmansion.com/scarb/download.html"; \
	fi
	@echo "✅ Installation complete!"

# Build the entire project
build:
	@echo "Building frontend..."
	@cd client && npm run build
	@echo "Building Starknet contracts..."
	@if [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ] && command -v scarb >/dev/null 2>&1; then \
		cd client/app/devx/contracts/utility-contracts/fee-deduction && scarb build; \
	elif [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ]; then \
		echo "⚠️  Scarb not found. Please install Scarb to build contracts: https://docs.swmansion.com/scarb/download.html"; \
	fi
	@echo "✅ Build complete!"

# Start development server
dev:
	@echo "Starting development server..."
	@cd client && npm run dev

# Start production server
start:
	@echo "Starting production server..."
	@cd client && npm run start

# Run all tests
test:
	@echo "Running frontend tests..."
	@cd client && npm run type-check
	@echo "Running Starknet contract tests..."
	@if [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ] && command -v scarb >/dev/null 2>&1; then \
		cd client/app/devx/contracts/utility-contracts/fee-deduction && scarb test; \
	elif [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ]; then \
		echo "⚠️  Scarb not found. Please install Scarb to run contract tests: https://docs.swmansion.com/scarb/download.html"; \
	fi
	@echo "✅ All tests completed!"

# Run linting
lint:
	@echo "Running linter..."
	@cd client && npm run lint

# Run TypeScript type checking
type-check:
	@echo "Running TypeScript type checking..."
	@cd client && npm run type-check

# Setup database (generate Prisma client and run migrations)
db-setup:
	@echo "Setting up database..."
	@cd client && npx prisma generate
	@cd client && npx prisma migrate dev
	@echo "✅ Database setup complete!"

# Seed the database with initial data
db-seed:
	@echo "Seeding database..."
	@cd client && npm run seed
	@echo "✅ Database seeding complete!"

# Clean build artifacts and dependencies
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf client/node_modules
	@rm -rf node_modules
	@rm -rf client/.next
	@rm -rf client/dist
	@if [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ] && command -v scarb >/dev/null 2>&1; then \
		cd client/app/devx/contracts/utility-contracts/fee-deduction && scarb clean; \
	fi
	@echo "✅ Clean complete!"

# Start services with Docker Compose
docker-up:
	@echo "Starting Docker services..."
	@docker-compose up -d
	@echo "✅ Docker services started!"

# Stop Docker Compose services
docker-down:
	@echo "Stopping Docker services..."
	@docker-compose down
	@echo "✅ Docker services stopped!"

# Build Starknet contracts specifically
contracts-build:
	@echo "Building Starknet contracts..."
	@if [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ] && command -v scarb >/dev/null 2>&1; then \
		cd client/app/devx/contracts/utility-contracts/fee-deduction && scarb build; \
	elif [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ]; then \
		echo "⚠️  Scarb not found. Please install Scarb to build contracts: https://docs.swmansion.com/scarb/download.html"; \
	else \
		echo "No Scarb.toml found. Skipping contract build."; \
	fi
	@echo "✅ Contract build complete!"

# Test Starknet contracts specifically
contracts-test:
	@echo "Testing Starknet contracts..."
	@if [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ] && command -v scarb >/dev/null 2>&1; then \
		cd client/app/devx/contracts/utility-contracts/fee-deduction && scarb test; \
	elif [ -f "client/app/devx/contracts/utility-contracts/fee-deduction/Scarb.toml" ]; then \
		echo "⚠️  Scarb not found. Please install Scarb to run contract tests: https://docs.swmansion.com/scarb/download.html"; \
	else \
		echo "No Scarb.toml found. Skipping contract tests."; \
	fi
	@echo "✅ Contract tests complete!"

# Quick setup for new developers
setup: install db-setup
	@echo "✅ Project setup complete! You can now run 'make dev' to start development."

# Full CI/CD pipeline simulation
ci: install lint type-check test build
	@echo "✅ CI pipeline completed successfully!"
