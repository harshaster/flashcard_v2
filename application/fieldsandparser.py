
from flask_restful import fields

# deck_parse=reqparse.RequestParser()
# deck_parse.add_argument("deck_name")

# login_parser=reqparse.RequestParser()
# login_parser.add_argument("username")
# login_parser.add_argument("pswd")

# signup_parser=reqparse.RequestParser()
# signup_parser.add_argument("name")
# signup_parser.add_argument("username")
# signup_parser.add_argument("pswd")
# signup_parser.add_argument("email")


# card_parse=reqparse.RequestParser()
# card_parse.add_argument("card_front")
# card_parse.add_argument("card_back")


login_signup_response={
    "username": fields.String,
    "name": fields.String,
    "email": fields.String,
    "token": fields.String(attribute="fs_uniquifier")
}

card_fields={
    "card_id": fields.Integer(attribute="id"),
    "card_question": fields.String(attribute="question"),
    "card_answer": fields.String(attribute="answer"),
    "query_url": fields.String(attribute="query_url")
}

deck_cards_fields={
    "deck_id": fields.Integer(attribute="id"),
    "deck_name":fields.String(attribute="name"),
    "deck_score":fields.Integer(attribute="score"),
    "deck_cards": fields.List(fields.Nested(card_fields),attribute="cards")
}

deck_lite={
    "deck_id": fields.Integer(attribute="id"),
    "deck_name":fields.String(attribute="name"),
    "deck_score":fields.Integer(attribute="score"),
    "query_url":fields.String(attribute="query_url"),
    "last_seen":fields.String(attribute="last_seen")
}

user_decks={
    "deck_id": fields.Integer(attribute="id"),
    "deck_name":fields.String(attribute="name"),
}


user_fields={
    "username": fields.String,
    # "name": fields.String,
    "decks": fields.List(fields.Nested(deck_lite))
}
