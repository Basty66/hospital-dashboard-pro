#!/usr/bin/env python
import os
import sys

os.chdir(os.path.join(os.path.dirname(__file__), 'api'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_api.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
