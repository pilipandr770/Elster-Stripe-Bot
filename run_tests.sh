#!/bin/bash

# Run frontend tests
echo "Running Frontend Tests..."
npm test

# Run backend tests
echo "Running Backend Tests..."
python -m pytest tests/backend -v

# Run integration tests (optional, as these might need services running)
echo "Running Integration Tests..."
# Comment this out if you want to skip integration tests by default
# python -m pytest tests/integration -v

# Generate coverage report
echo "Generating Coverage Report..."
python -m pytest --cov=backend/app tests/backend

echo "All tests completed!"
