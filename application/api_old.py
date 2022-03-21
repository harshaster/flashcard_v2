from flask_restful import Resource,Api,marshal_with
from flask import current_app as app
from application.fieldsandparser import *
from application.models import *

api=Api(app)

#fields : user_fields, deck_fields, deck_fields
#parser: deck_parse, card_parse

user_decks={}

def get_all_users():
    global user_decks
    all_users=User.query.all()
    for user in all_users:
        all_decks=[]
        for deck in user.decks:
            all_decks.append(deck.id)
        user_decks[user.username]=all_decks
    return

deck_cards={}

def get_all_decks():
    global deck_cards
    all_decks=decks.query.all()
    for deck in all_decks:
        all_cards=[]
        for card in deck.cards:
            all_cards.append(card.id)
        deck_cards[deck.id]=all_cards
    return

def user_exists(username):
    if username in user_decks.keys():
        return True
    return False

def user_has_deck(username,deck_id):
        if deck_id in user_decks[username]:
            return True
        return False

def deck_exists(deck_id):
    if deck_id in deck_cards.keys():
        return True
    return False

def deck_has_card(deck_id,card_id):
    
        if card_id in deck_cards[deck_id]:
            return True
        return False

get_all_decks()
get_all_users()


class Userdet(Resource):
    global get_all_decks,get_all_users,deck_has_card,user_has_deck
    
    #gets all decks of the user
    @marshal_with(user_fields)
    def get(self,username):
        if user_exists(username):
            user=User.query.filter(User.username==username).first()
            return user
        else:
            return None
            #write your exception handling here
    
    #deletes user from Db
    def delete(self,username):
        if user_exists(username):
            user=User.query.filter(User.username==username).first()
            db.session().delete(user)
            db.session().commit()
            get_all_users()
            return f"DELETED USERNAME {username}"
        else:
            return None
            #HERE tooooo


    #adds a new deck to the database and also associates that with the given username. Ideally,
    #this should have been under Deck resource but due to being a different request to just the same url,
    #I have to add it here.
    @marshal_with(deck_fields)
    def post(self,username):
        if user_exists(username):
            args=deck_parse.parse_args()
            name=args.get("deck_name")
            new_deck=decks(name=name)

            user_we_want=User.query.filter(User.username==username).first()
            user_we_want.decks.append(new_deck)

            db.session.add(new_deck)
            db.session.commit()
            new=decks.query.filter(decks.name==name).first()
            get_all_decks()
            return new
        else:
            return None
            #HERERRRERERE


class Deck(Resource):
    #Gets all the card of the deck
    @marshal_with(deck_fields)
    def get(self,username,deck_id):
        if user_exists(username):
            if user_has_deck(username,int(deck_id)):
                new=decks.query.filter(decks.id==deck_id).first()
                return new
            else:
                return None
                #deck does not exist
        else:
            return None
            #user does not exist

    #updates the deck
    @marshal_with(deck_lite)
    def put(self,username,deck_id):
        if user_exists(username):
            if user_has_deck(username,int(deck_id)):
                new=decks.query.filter(decks.id==deck_id).first()
                args=deck_parse.parse_args()
                new.name=args.get("deck_name")
                db.session.commit()
                new=decks.query.filter(decks.id==deck_id).first()
                get_all_decks()
                return new
                
            else:
                return None
                #deck does not exist
        else:
            return None
            #user does not exist
        
    #Adds a new card into the DB but also associates that to the given deck, this happens
    #just because of the same reason in the previous case.
    @marshal_with(card_fields)
    def post(self,username,deck_id):
        if user_exists(username):
            if user_has_deck(username,int(deck_id)):
                deck_we_want=decks.query.filter(decks.id==deck_id).first()
                args=card_parse.parse_args()
                qstn,ans=args.get("card_front"),args.get("card_back")
                new_card=cards(question=qstn,answer=ans)
                deck_we_want.cards.append(new_card)
                db.session.add(new_card)
                db.session.commit()
                card_we_added=decks.query.filter(decks.id==deck_id).first().cards[-1]
                get_all_decks()
                return card_we_added
                
            else:
                return None
                #deck does not exist
        else:
            return None
            #user does not exist

    def delete(self,username,deck_id):
        if user_exists(username):
            if user_has_deck(username,int(deck_id)):
                deck_we_want=decks.query.filter(decks.id==deck_id).first()
                name=deck_we_want.name
                db.session.delete(deck_we_want)
                db.session.commit()
                get_all_decks()
                return f"deleted the deck {name}"
            else:
                return None
                #deck does not exist
        else:
            return None

class Card(Resource):
    #Gets the details of a given card with card_id
    @marshal_with(card_fields)
    def get(self,username,deck_id,card_id):
        if user_exists(username):
            if user_has_deck(username,int(deck_id)):
                if deck_has_card(int(deck_id),int(card_id)):
                    card_we_want=cards.query.filter(cards.id==card_id).first()
                    return card_we_want
                else:
                    return None
                    #card does not exist
            else:
                return None
                #deck not there
        else:
            return None
            #no such user


    #Updates a card:
    @marshal_with(card_fields)
    def put(self,username,deck_id,card_id):
        if user_exists(username):
            if user_has_deck(username,int(deck_id)):
                if deck_has_card(int(deck_id),int(card_id)):
                    card_we_want=cards.query.filter(cards.id==card_id).first()

                    args=card_parse.parse_args()
                    qstn,ans=args.get("card_front"),args.get("card_back")
                    card_we_want.question=qstn
                    card_we_want.answer=ans
                    db.session.commit()

                    card_we_want=cards.query.filter(cards.id==card_id).first()
                    return card_we_want
                else:
                    return None
                    #card does not exist
            else:
                return None
                #deck not there
        else:
            return None
            #no such user


    #Deletes the card
    def delete(self,username,deck_id,card_id):
        if user_exists(username):
            if user_has_deck(username,int(deck_id)):
                if deck_has_card(int(deck_id),int(card_id)):
                    card_we_want=cards.query.filter(cards.id==card_id).first()
                    db.session.delete(card_we_want)
                    db.session.commit()
                    get_all_decks()
                    return f"deleted card {card_we_want.id}"
                else:
                    return None
                    #card does not exist
            else:
                return None
                #deck not there
        else:
            return None
            #no such user


api.add_resource(Userdet,"/api/<string:username>" )
api.add_resource(Deck,"/api/<string:username>/<deck_id>")
api.add_resource(Card,"/api/<username>/<deck_id>/<card_id>")
