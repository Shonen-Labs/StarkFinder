#!/bin/bash

# Integration Test Runner for StarkFinder Backend
# This script sets up the test environment and runs the integration tests

set -e

echo "🚀 Starting StarkFinder Backend Integration Tests"

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Error: Please run this script from the anon/backend directory"
    exit 1
fi

# Set default test database URL if not provided
if [ -z "$TEST_DATABASE_URL" ]; then
    export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/starkfinder_test"
    echo "📝 Using default test database URL: $TEST_DATABASE_URL"
fi

# Ensure DATABASE_URL is set for Rust/sqlx
export DATABASE_URL="$TEST_DATABASE_URL"
echo "🔗 DATABASE_URL set to: $DATABASE_URL"

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ Error: PostgreSQL is not running on localhost:5432"
    echo "Please start PostgreSQL and try again"
    exit 1
fi

# Reset test database (drop + create fresh)
echo "🗄️  Resetting test database..."
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS starkfinder_test;"
psql -h localhost -U postgres -c "CREATE DATABASE starkfinder_test;"

# Run migrations
echo "📦 Running database migrations..."
sqlx migrate run --database-url "$TEST_DATABASE_URL" || {
    echo "❌ Error: Failed to run migrations"
    exit 1
}

# Run tests
echo "🧪 Running integration tests..."
cargo test -- --test-threads=1 --nocapture

echo "✅ Tests completed successfully!"
