from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Use SQLite for quick local dev (override to PostgreSQL if needed)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Simple in-memory cache for dev
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

CORS_ALLOW_ALL_ORIGINS = True

# Email: Print to console during dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

INSTALLED_APPS += ['django_extensions']

# Disable whitenoise for dev
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
