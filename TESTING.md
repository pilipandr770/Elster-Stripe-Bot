# Testing Guide

This project includes a comprehensive testing setup for both frontend and backend components.

## Directory Structure

```
tests/
├── frontend/     # React component tests using Vitest and React Testing Library
├── backend/      # Python backend tests using pytest
└── integration/  # End-to-end tests that test frontend and backend together
```

## Frontend Tests

Frontend tests use Vitest with React Testing Library and jest-dom for assertions.

### Running Frontend Tests

```bash
# Run all frontend tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Key Test Files
- `tests/frontend/setup.ts` - Test configuration
- Component tests for Button, Input, Header, etc.

## Backend Tests

Backend tests use pytest with coverage reporting.

### Running Backend Tests

```bash
# Run all backend tests
python -m pytest tests/backend

# Run with coverage report
python -m pytest tests/backend --cov=backend/app
```

### Key Test Files
- `tests/backend/conftest.py` - Test fixtures
- Tests for Flask application, API endpoints, and services

## Integration Tests

Integration tests verify that frontend and backend work together correctly. These tests require both services to be running.

### Running Integration Tests

```bash
# Run integration tests
python -m pytest tests/integration
```

## Running All Tests

For convenience, you can run all tests using the provided scripts:

```bash
# On Linux/Mac
./run_tests.sh

# On Windows
run_tests.bat
```

## Continuous Integration

GitHub Actions is configured to run tests automatically on push and pull requests to the main branch. See `.github/workflows/tests.yml` for the configuration.
