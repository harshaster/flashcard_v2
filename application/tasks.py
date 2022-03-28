import json
from application.workers import celery
from application.database import db
import requests
from application.sendMails import send_email
from jinja2 import Template
from celery.schedules import crontab
from application.models import User

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour="16",minute="45",day_of_month="1"),monthly_report.s("Harshit"), name="monthly report")
    sender.add_periodic_task(
        crontab(hour="17",minute="0"),daily_reminder.s(), name="daily reminder"
    )
    sender.add_periodic_task(
        crontab(hour="17",minute="0"),daily_reminder_by_email.s(), name="daily reminder by email"
    )
    sender.add_periodic_task(
        crontab(hour="0",minute="0"),set_seen_today_false.s(), name="set seen_today to false"
    )


@celery.task()
def export_csv(deck_we_want,username,deck_id):
    with open(f"csvs/{username}_{deck_id}.csv", 'w') as mycsv:
        mycsv.write('')
    with open(f"csvs/{username}_{deck_id}.csv", 'a') as mycsv:
        mycsv.write("S.No,card_question,card_answer,score\n")
        for i in range(len(deck_we_want["deck_cards"])):
            card=deck_we_want["deck_cards"][i]
            mycsv.write(f'{i+1},{card["card_question"]},{card["card_answer"]},{card["score"]}\n')


@celery.task()
def export_all_decks(user_we_want):
    with open(f'csvs/{user_we_want["username"]}_all.csv', 'w') as mycsv:
        mycsv.write('')
    with open(f'csvs/{user_we_want["username"]}_all.csv', 'a') as mycsv:
        mycsv.write("S.No,Deck Name,Score\n")
        for i in range(len(user_we_want["decks"])):
            deck=user_we_want["decks"][i]
            mycsv.write(f'{i+1},{deck["deck_name"]},{deck["deck_score"]}\n')
    
@celery.task()
def monthly_report():
    with open("templates/progress.html", 'r') as progress_temp:
        temp=Template(progress_temp.read())
    user=User.query.filter(User.username=="hk3112").first()
    # for user in all_users:
    send_email(to_address=user.email,message=temp.render(username=user.name),subject="Your flashcard monthly progress report")
    
@celery.task()
def daily_reminder():
    push=requests.post("https://chat.googleapis.com/v1/spaces/AAAA1iL2-Hc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=dFXBI7-gzFzv6DNdjH5GTprmPP-UW1xd4-ag5kDtKZ8%3D",data=json.dumps({"text": "Hi users, Have your revised yor flashcards today ?"}))
    return push.json()

@celery.task()
def daily_reminder_by_email():
    all_users=User.query.all()
    with open("templates/not-seen-today.html", 'r') as not_seen:
        temp=Template(not_seen.read())
    for user in all_users:
        if not(user.seen_today):
            send_email(user.email,message=temp.render(usrename=user.name),subject="Revise your decks on FlashCard")


@celery.task()
def set_seen_today_false():
    all_users=User.query.all()
    for user in all_users:
        user.seen_today=False
        db.session.commit()