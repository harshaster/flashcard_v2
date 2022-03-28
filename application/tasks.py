from application.workers import celery
from datetime import datetime
# @celery.on_after_finalize.connect
# def setup_periodic_tasks(sender, **kwargs):
#     sender.add_periodic_task(10.0, print_current_time_job.s(), name="At every 10 seconds")





@celery.task()
def just_hi(name):
    print("Inside task")
    print("Hello {}".format(name))
    return "Hello {}".format(name)

@celery.task()
def print_current_time_job():
    print("START")
    now=datetime.now()
    print("now_in_task = ", now)
    dt_string= now.strftime("%d/%m/%y %H:%M:%S")
    print("date and time = ", dt_string)
    print("COMPLETE")
    return dt_string

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
    
