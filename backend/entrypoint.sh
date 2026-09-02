#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Wait for DB to be ready just in case
echo "Waiting for database to be fully initialized..."

# Check if alembic/versions has any python files. If not, generate initial revision
if [ -z "$(find /app/alembic/versions -name '*.py')" ]; then
  echo "No migrations found. Generating initial auto-migration..."
  alembic revision --autogenerate -m "Initial schema"
fi

echo "Applying migrations..."
alembic upgrade head

echo "Seeding user accounts..."
python app/scripts/seed.py

echo "Executing clinical dataset ingestion (ETL)..."
python app/scripts/ingest.py

echo "Starting FastAPI application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
