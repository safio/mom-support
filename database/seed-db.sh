#!/bin/bash

# Database connection parameters
DB_NAME="mom_support"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
SEED_FILE="./seed-data.sql"

# Check if seed file exists
if [ ! -f "$SEED_FILE" ]; then
  echo "Error: Seed file $SEED_FILE not found!"
  exit 1
fi

echo "=== Running seed script for Mom Support App ==="
echo "This will populate the database with initial data."

# Run the seed SQL file
echo "Applying seed data from $SEED_FILE..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SEED_FILE

if [ $? -eq 0 ]; then
  echo "✅ Seed data successfully applied!"
else
  echo "❌ Error applying seed data. Check the error messages above."
  exit 1
fi

echo ""
echo "You may need to adjust database connection parameters in this script"
echo "if they differ from the defaults (host=$DB_HOST, user=$DB_USER, db=$DB_NAME)."
echo ""
echo "To run this script with custom parameters:"
echo "DB_NAME=your_db DB_USER=your_user DB_HOST=your_host ./seed-db.sh" 