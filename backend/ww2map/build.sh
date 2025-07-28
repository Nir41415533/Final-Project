#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit  # exit on error

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build completed successfully!"
echo "Note: To load your data, run 'python load_data.py' after deployment" 