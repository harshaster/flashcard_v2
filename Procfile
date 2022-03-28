web: gunicorn -b '0.0.0.0:$PORT' app:app
worker: celery worker --app=app.celery -l info
celery worker --app=app.celery beat -l info 