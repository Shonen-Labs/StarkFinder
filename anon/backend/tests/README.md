# Integration Tests

This directory contains integration tests for the backend API endpoints.

## Test Structure

- `generate_contract_test.rs` - Tests for the POST /generate endpoint
- `test_config.rs` - Test configuration and database setup utilities
- `mod.rs` - Test module organization

## Setup

### 1. Database Setup

Create a test database:

```sql
CREATE DATABASE starkfinder_test;
```

### 2. Environment Variables

Set the test database URL:

```bash
export TEST_DATABASE_URL="postgresql://username:password@localhost:5432/starkfinder_test"
```

Or create a `.env.test` file:

```env
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/starkfinder_test
```

### 3. Run Migrations

The tests will automatically run migrations, but you can also run them manually:

```bash
cd anon/backend
sqlx migrate run --database-url $TEST_DATABASE_URL
```

## Running Tests

### Run all tests

```bash
cd anon/backend
cargo test
```

### Run specific test file

```bash
cargo test generate_contract_test
```

### Run with output

```bash
cargo test -- --nocapture
```

### Run in parallel

```bash
cargo test -- --test-threads=1
```

## Test Coverage

The integration tests cover:

### POST /generate Endpoint Tests

1. **Success Cases:**
   - Full request with all fields
   - Minimal request with required fields only
   - Multiple contracts for same user

2. **Validation Tests:**
   - Missing required fields (user_id, contract_type, contract_name)
   - Empty/whitespace-only fields
   - Field length validation (contract_type, contract_name, description, template_id)
   - Invalid JSON payload

3. **Error Handling:**
   - User not found (404)
   - Bad request validation errors (400)
   - Invalid JSON parsing (422)

4. **Database Persistence:**
   - Verify data is stored correctly
   - Verify generated code structure
   - Verify multiple contracts can be created

5. **Response Structure:**
   - Verify all response fields are present
   - Verify generated code contains expected elements
   - Verify timestamps are set correctly

## Test Helpers

- `create_test_server()` - Creates a test server with database connection
- `create_test_user()` - Creates a test user for testing
- `cleanup_test_data()` - Cleans up test data after each test

## Notes

- Tests use a separate test database to avoid affecting development data
- Each test cleans up after itself to ensure isolation
- Tests run asynchronously using tokio
- Database migrations are run automatically before tests
