from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Development uses the PostgreSQL configuration from base.py.
# Configure DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, and DB_PORT in .env.

# Dummy cache for dev to prevent stale cached API responses
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

CORS_ALLOW_ALL_ORIGINS = True

# Email: Print to console during dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

INSTALLED_APPS += ['django_extensions']

# Disable whitenoise for dev
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
