web: gunicorn -b '0.0.0.0:$PORT' app:app
worker: celery -A app.celery worker -l info
worker: celery -A app.celery beat -l info