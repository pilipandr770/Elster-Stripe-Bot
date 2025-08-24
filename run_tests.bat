@echo off
SETLOCAL

REM Run frontend tests
echo Running Frontend Tests...
call npm test

REM Run backend tests
echo Running Backend Tests...
python -m pytest tests/backend -v

REM Run integration tests (optional, as these might need services running)
echo Running Integration Tests...
REM Comment this out if you want to skip integration tests by default
REM python -m pytest tests/integration -v

REM Generate coverage report
echo Generating Coverage Report...
python -m pytest --cov=backend/app tests/backend

echo All tests completed!

ENDLOCAL
