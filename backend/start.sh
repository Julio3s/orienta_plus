#!/usr/bin/env sh
set -eu

python manage.py migrate
python manage.py collectstatic --noinput
exec gunicorn orienta_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000}
