if [ -d "env" ];
then
    echo "Enabling virtual env"
else
    echo "No virtual env"
    exit 1
fi

source ./env/bin/activate

celery -A app.celery worker -l info &
celery -A app.celery beat -l info &
python app.py

deactivate
