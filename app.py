from application.config import conf
from flask import Flask
from application.database import db
from application.workers import celery,ContextTask
# from flask_security import Security, SQLAlchemySessionUserDatastore, SQLAlchemyUserDatastore


def create_app():
    app=Flask(__name__)
    app.config.from_object(conf)
    db.init_app(app)
    app.app_context().push()
    # user_datastore=SQLAlchemySessionUserDatastore(db.session,)
    # security=Security(app)
    return app

app=create_app()


@app.before_first_request
def db_create():
    db.create_all()


from application.models import *
from application.api import *

celery=celery

celery.conf.update(
    broker_url=app.config["CELERY_BROKER_URL"],
    result_backend=app.config["CELERY_RESULT_BACKEND"],
    timezone="Asia/Kolkata"
)

celery.Task = ContextTask

if __name__=="__main__":
    app.run()