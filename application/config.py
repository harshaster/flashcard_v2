import os

class local_conf:
    SQLALCHEMY_DATABASE_URI="sqlite:///flash.sqlite3"
    DEBUG= True
    SQLALCHEMY_TRACK_MODIFICATOINS=True
    BASE_URL="http://localhost:5000"
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY")
    CELERY_BROKER_URL="redis://localhost:6379/1"
    CELERY_RESULT_BACKEND="redis://localhost:6379/2"


class prod_conf:
    SQLALCHEMY_DATABASE_URI="sqlite:///flash.sqlite3"
    DEBUG= False
    SQLALCHEMY_TRACK_MODIFICATOINS=True
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY")
    BASE_URL=os.getenv("BASE_URL")
    CELERY_BROKER_URL="redis://thefp2.herokuapp.com:6379/1"
    CELERY_RESULT_BACKEND="redis://thefp2.herokuapp.com:6379/2"
