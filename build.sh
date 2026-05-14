#!/usr/bin/env bash
set -o errexit 2>/dev/null || exit 1

pip install -r api/requirements.txt
npm install
npm run build
cd api
python manage.py collectstatic --noinput
