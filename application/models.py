from application.database  import db

class User(db.Model):
    __tablename__="user"
    username=db.Column(db.String,primary_key=True, nullable=False)
    password=db.Column(db.String(20), nullable=False)
    name=db.Column(db.String,nullable=False)
    email=db.Column(db.String, nullable=False)
    seen_today=db.Column(db.Boolean, default=True)
    decks=db.relationship('decks',secondary='userdeck', lazy=True, backref=db.backref('user',lazy=True))
    def __repr__(self):
        return f"<USER {self.username}>"

class decks(db.Model):
    __tablename__="decks"
    id=db.Column(db.Integer, autoincrement=True, primary_key=True)
    name=db.Column(db.String, nullable=False,unique=True)
    cards=db.relationship('cards',secondary='deck_cards', lazy=True, backref=db.backref('decks',lazy=True))
    last_seen=db.Column(db.String, nullable=False)
    def __repr__(self):
        return f"{self.name}"

class cards(db.Model):
    id=db.Column(db.Integer, autoincrement=True, primary_key=True)
    question=db.Column(db.Text, nullable=False)
    answer=db.Column(db.Text, nullable=False)
    score=db.Column(db.Integer,nullable=False)
    def __repr__(self):
        return f"{self.question}"

userdecks = db.Table('userdeck',
    db.Column('username', db.String, db.ForeignKey('user.username'), primary_key=True),
    db.Column('deck_id', db.Integer, db.ForeignKey('decks.id'), primary_key=True)
)

deck_cards = db.Table('deck_cards',
    db.Column('deck_id', db.String, db.ForeignKey('decks.id'), primary_key=True),
    db.Column('card_id', db.Integer, db.ForeignKey('cards.id'), primary_key=True))