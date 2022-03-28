class conf:
    SQLALCHEMY_DATABASE_URI="sqlite:///flash.sqlite3"
    DEBUG= True
    SECURITY_PASSWORD_SALT="somethingverysecret"
    SQLALCHEMY_TRACK_MODIFICATOINS=False
    SECRET_KEY="flaskislove"
    CELERY_BROKER_URL="redis://localhost:6379/1"
    CELERY_RESULT_BACKEND="redis://localhost:6379/2"
