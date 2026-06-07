FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

ARG DJANGO_SECRET_KEY=build-time-placeholder
ENV DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . .

# Create non-root user
RUN addgroup --system zenco && adduser --system --ingroup zenco zenco
RUN chown -R zenco:zenco /app
USER zenco

# Create necessary directories
RUN mkdir -p /app/logs /app/media /app/staticfiles

# Collect static files (production)
RUN python manage.py collectstatic --noinput --settings=config.settings.production || true

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--timeout", "60", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
