from datetime import datetime
import json
import requests
import time
import timeago
from datetime import datetime as dt
from flask_restful import Resource,Api,marshal_with,request
import jwt
from flask import current_app as app, send_from_directory
from flask import render_template
from application.fieldsandparser import *
from application.models import *
from application import tasks
from application.exceptions import AuthError, NotFoundError, ValidationError, InternalError
from application.jwt_setup import auth_required,get_username_with_token,get_token


#####    PROGRESS    ######

# * have to implement update requests only, rest is super cool.

api=Api(app)
baseURL=app.config["BASE_URL"]

@app.route("/hello", methods=["GET"])
def hello():
    now=datetime.now()
    print("now_in_flask = ", now)
    dt_string= now.strftime("%d/%m/%y %H:%M:%S")
    print("date and time ", dt_string)
    job = tasks.print_current_time_job.apply_async(countdown=10)
    result=job.wait()
    return str(result), 200

@app.route("/api/<string:username>/<int:deck_id>/export", methods=["GET"])
def export_deck_job(username,deck_id):
    token=get_token()
    deck_data=requests.get(url=f"http://localhost:5000/api/{username}/{deck_id}",headers={'Authorization':token})
    mydeck=deck_data.json()
    job=tasks.export_csv.delay(mydeck,username,deck_id)
    return send_from_directory("csvs",f"{username}_{deck_id}.csv")

@app.route("/api/<string:username>/export", methods=["GET"])
def export_all_decks(username):
    token=get_token()
    decks_data=requests.get(url=f"http://localhost:5000/api/{username}",headers={'Authorization':token})
    mydecks=decks_data.json()
    job=tasks.export_all_decks.delay(mydecks)
    result=job.wait()
    return send_from_directory("csvs",f"{username}_all.csv")

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

def user_object_if_username_exists_else_err(username):
    try:
        if username==get_username_with_token():
            user_we_want = User.query.filter(User.username==username).first()
            if user_we_want:
                return user_we_want
            else:
                raise NotFoundError(404,"Username is incorrect or does not exist")
        else:
            raise AuthError("Token is not valid for resource requeested", "UNAUTH")
    except:
        raise InternalError()



def deck_object_if_user_has_else_err(username,deck_id):
        user_we_want = user_object_if_username_exists_else_err(username)
        found=False
        for deck in user_we_want.decks:
            if deck.id==deck_id:
                found=True
                return deck

        if not found:
            raise ValidationError(404, f"{username} have no such deck", "NODEK")

def card_object_if_deck_has_else_err(username,deck_id,card_id):
        deck_we_want = deck_object_if_user_has_else_err(username,deck_id)
        found=False
        for card in deck_we_want.cards:
            if card.id==card_id:
                found=True
                return card

        if not found:
            raise ValidationError(404, f"{deck_we_want.name} have no such card", "NOCRD")

# ###########################################################################

class Login(Resource):
    def post(self):
        try:
            if request.headers.get('Content-Type')=='application/json':
                args=json.loads(request.data)
            else:
                args=request.form
            uname=args["username"]
            pswd=args["pswd"]
        except:
            raise InternalError()
        
        if uname is None or pswd is None:
            raise ValidationError(status_code= 400,error_message= "Username or password can't be empty", error_code="EMPFLD")
        user_we_want = User.query.filter(User.username==uname).first()
        if user_we_want:
            if user_we_want.password==pswd: #we can add some hasning things here later.
                return {
                    "token": jwt.encode({"username" : user_we_want.username, "iat": time.time(),"exp":time.time()+1800},key=app.config["SECRET_KEY"]).decode('utf-8'),
                    "username": user_we_want.username,
                    "name": user_we_want.name,
                    "email": user_we_want.email
                }
            else:
                raise ValidationError(status_code=400,error_message="Incorrect Password",error_code="INCPW")
        else:
            raise NotFoundError(404,"Usrename does not exist or incorrect")
 
    
##########################################################################

class Signup(Resource):
    def post(self):
        if request.headers.get('Content-Type')=='application/json':
            args=json.loads(request.data)
        else:
            args=request.form
        if args["username"] is None or args["name"]is None or args["email"]is None or args["pswd"] is None:
            raise ValidationError(status_code= 400,error_message= "one or more fields couldn't be empty",error_code="EMPFLD")
            #raise an error if fields are empty
        user_requested=User.query.filter(User.username==args["username"]).first()
        if user_requested:
            #if user is found
            raise ValidationError(status_code= 409,error_message="Username exists",error_code="UNAEX")
        # try:
        new_user= User(username=args["username"], name=args["name"], password=args["pswd"], email=args["email"],seen_today=True)
        db.session.add(new_user)
        db.session.commit()
        return {
            "token": jwt.encode({"username" : new_user.username, "iat": time.time(),"exp":time.time()+1800},key=app.config["SECRET_KEY"]).decode('utf-8'),
            "username": new_user.username,
            "name": new_user.name,
            "email": new_user.email
        }
        # except:
        #     raise InternalError()

############################################################################## 

class Deck_details_with_username(Resource):
    @auth_required
    def post(self,username):

        """ Create a new deck for the given username"""

        if request.headers.get('Content-Type')=='application/json':
            args=json.loads(request.data)
        else:
            args=request.form
        user_we_want=user_object_if_username_exists_else_err(username)
        try:
            new_deck=decks(name=args["name"],last_seen=dt.now().strftime("%I:%M:%S %p %d-%b-%Y"))
            user_we_want.decks.append(new_deck)
            db.session.add(new_deck)
            db.session.commit()
        except:
            raise InternalError()
        return ({
            "username": username,
            "status": f"Added new deck {new_deck.name}",
            "new_deck":{
                "deck_id": new_deck.id,
                "deck_name":new_deck.name,
                "deck_score":0,
                "last_seen_human":timeago.format(dt.strptime(new_deck.last_seen, '%I:%M:%S %p %d-%b-%Y') , dt.now())
                }
        })
    
    @auth_required
    @marshal_with(user_fields) 
    def get(self,username):

        """ Returns all the decks for a username """

        user_we_want=user_object_if_username_exists_else_err(username)
        if user_we_want:
            user_we_want.seen_today=True
            db.session.commit()
            for dk in user_we_want.decks:
                t_score=0
                for card in dk.cards:
                    t_score+=card.score
                try:
                    dk.score="%.1f"%(t_score/len(dk.cards))
                except:
                    dk.score=0
                dk.last_seen_human=timeago.format(dt.strptime(dk.last_seen, '%I:%M:%S %p %d-%b-%Y') , dt.now())
                dk.query_url=f"{baseURL}/api/{username}/{dk.id}"
            return user_we_want
        else:
            raise NotFoundError(404,"Username is incorrect or does not exist")


###############################################################################################

class card_details_with_deck(Resource):
    @auth_required
    @marshal_with(deck_cards_fields)
    def get(self,username,deck_id):

        """ Returns all the cards of given deck id which must be associated with given information. If it is not linked, it throws an error."""

        deck_we_want=deck_object_if_user_has_else_err(username,deck_id)
        try:
            deck_we_want.last_seen=dt.now().strftime("%I:%M:%S %p %d-%b-%Y")
            db.session.commit()
            t_score=0
            for cd in deck_we_want.cards:
                t_score+=cd.score
                cd.query_url=f"{baseURL}/api/{username}/{deck_id}/{cd.id}"
            deck_we_want.score=t_score
            return deck_we_want
        except:
            raise InternalError()

    @auth_required
    def post(self,username,deck_id):

        """ Creates a new card in the deck with given deck_id. If the deck is not associated with the given username, it throws an error."""

        deck_we_want=deck_object_if_user_has_else_err(username,deck_id)
        try:
            if request.headers.get('Content-Type')=='application/json':
                args=json.loads(request.data)
            else:
                args=request.form
            new_card=cards(question=args["question"],answer=args["answer"],score=0)
            deck_we_want.cards.append(new_card)
            db.session.add(new_card)
            db.session.commit()
        except:
            raise InternalError()
        return ({
            "username": username,
            "deck_id": deck_we_want.id,
            "deck_name": deck_we_want.name,
            "card": {
                "question": new_card.question,
                "answer": new_card.answer
            },
            "status": f"New card created in deck {deck_we_want.name}"
        })
    
    @auth_required
    def patch(self,username,deck_id):

        """ Renames the deck with given deck_id which must be associated with given username, else error !!"""

        if request.headers.get('Content-Type')=='application/json':
            args=json.loads(request.data)
        else:
            args=request.form
        deck_we_want=deck_object_if_user_has_else_err(username,deck_id)
        try:
            deck_we_want.name=args["new_name"]
            db.session.commit()
        except:
            raise InternalError()
        return ({
            "status": f"updated deck with id {deck_id}",
            "updated_deck": {
                "deck_id": deck_we_want.id,
                "deck_name": deck_we_want.name
            }
        })
    
    @auth_required
    def delete(self,username,deck_id):

        """Deletes the deck with given deck_id. If given deck is not associated with given username, it throws an error."""

        deck_we_want=deck_object_if_user_has_else_err(username,deck_id)
        try:
            db.session.delete(deck_we_want)
            db.session.commit()
        except:
            raise InternalError()
        return ({
            "message": "Deleted deck",
            "deck_name":deck_we_want.name,
            "deck_id":deck_we_want.id
        })
    
#######################################################################################

class individual_card(Resource):
    @auth_required
    @marshal_with(card_fields)
    def get(self,username,deck_id,card_id):

        """ Returns the details for a given card_id associated with given deck_id which in turn
        must be associated with given username. If this is not the case, it throws error """

        card_we_want=card_object_if_deck_has_else_err(username,deck_id,card_id)
        try:
            card_we_want.query_url=f"{baseURL}/api/{username}/{deck_id}/{card_id}"
            return card_we_want
        except:
            raise InternalError
    
    #-------------------------------------------------------------------------
    @auth_required
    def put(self,username,deck_id,card_id):
        if request.headers.get('Content-Type')=='application/json':
            args=json.loads(request.data)
        else:
            args=request.form
        card_we_want=card_object_if_deck_has_else_err(username,deck_id,card_id)
        try:
            card_we_want.question=args["question"]
            card_we_want.answer=args["answer"]
            db.session.commit()
        except:
            raise InternalError()
        return ({
            "status": f"updated card with id {card_id}",
            "updated_card": {
                "card_id": card_we_want.id,
                "question": card_we_want.question,
                "answer": card_we_want.answer
            }
        })

    #-------------------------------------------------------
    @auth_required
    def patch(self,username,deck_id,card_id):
        if request.headers.get('Content-Type')=='application/json':
            args=json.loads(request.data)
        else:
            args=request.form
        card_we_want=card_object_if_deck_has_else_err(username,deck_id,card_id)
        try:
            card_we_want.score=args["score"]
            db.session.commit()
        except:
            raise InternalError()
        return ({
            "status": f"updated score of card with id {card_id}",
            "updated_card": {
                "card_id": card_we_want.id,
                "question": card_we_want.question,
                "answer": card_we_want.answer,
                "new_card_score": card_we_want.score
            }
        })

    #-------------------------------------------------------------

    @auth_required
    def delete(self,username,deck_id,card_id):

        """Deletes the card with given card_if if it is associated with the given deck_id which
        in turn must be associated with the given username. In either non-associated case, it throws
        suitable error."""

        card_we_want=card_object_if_deck_has_else_err(username,deck_id,card_id)
        try:
            db.session.delete(card_we_want)
            db.session.commit()
        except:
            raise InternalError()
        return ({
            "message": f"Deleted card",
            "deleted_card":{
                "card_id": card_we_want.id,
                "question": card_we_want.question,
                "answer": card_we_want.answer
            }
        })

class isauth(Resource):
    @auth_required
    def get(self):
        return ({
            "auth": True,
            "username": get_username_with_token()
        })

        

api.add_resource(Login,"/api/login")
api.add_resource(Signup,"/api/signup")
api.add_resource(Deck_details_with_username,"/api/<string:username>")
api.add_resource(card_details_with_deck,"/api/<string:username>/<int:deck_id>")
api.add_resource(individual_card,"/api/<string:username>/<int:deck_id>/<int:card_id>")
api.add_resource(isauth,"/api/isAuth")