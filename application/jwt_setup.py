# from flask_jwt import JWT, jwt_required, current_identity
# from werkzeug.security import safe_str_cmp
# from flask import current_app as app
# from application.api import user_object_if_username_exists_else_err

# from application.models import *

# def authenticate(uname,pswd):
#     user=user_object_if_username_exists_else_err(uname)
#     if user and safe_str_cmp(user.password.encode('utf-8'),pswd.encode('utf-8')):
#         return user

# def identity(payload):
#     username=payload['identity']
#     return user_object_if_username_exists_else_err(username)


# jwt = JWT(app,authenticate,identity)
from functools import wraps
from flask import request
import jwt
from application.exceptions import AuthError
from flask import current_app as app

def auth_required(f):
    @wraps(f)
    def check_token(*args, **kwargs):
        token=request.headers.get('Authorization')
        if not(token):
            raise AuthError("Authorization header not present or method not allowed.", "UNAUTH")
        parts=token.split(" ")
        if len(parts)==2:
            my_jwt=parts[1]
        elif len(parts)==1:
            my_jwt=parts[0]
        else:
            raise AuthError("Token format not valid", "UNAUTH")
        try:
            decoded=jwt.decode(my_jwt,app.config["SECRET_KEY"])
        except jwt.ExpiredSignatureError as expired:
            raise AuthError("session expired", "SESEXP")
        except:
            raise AuthError("Invalid token or token expired", "UNAUTH")
        if decoded:
            return f(*args, **kwargs)
    return check_token

def get_username_with_token():
    token=request.headers.get('Authorization')
    if not(token):
        raise AuthError("Authorization header not present.", "UNAUTH")
    parts=token.split(" ")
    if len(parts)==2:
        my_jwt=parts[1]
    elif len(parts)==1:
        my_jwt=parts[0]
    else:
        raise AuthError("Token format not valid", "UNAUTH")
    try:
        decoded=jwt.decode(my_jwt,app.config["SECRET_KEY"])
    except:
        raise AuthError("Invalid token or token expired", "UNAUTH")
    if decoded:
        return decoded["username"]
    else:
        return None

def get_token():
    token=request.headers.get('Authorization')
    if not(token):
        raise AuthError("Authorization header not present.", "UNAUTH")
    parts=token.split(" ")
    if len(parts)==2:
        my_jwt=parts[1]
    elif len(parts)==1:
        my_jwt=parts[0]
    else:
        raise AuthError("Token format not valid", "UNAUTH")
    try:
        decoded=jwt.decode(my_jwt,app.config["SECRET_KEY"])
    except:
        raise AuthError("Invalid token or token expired", "UNAUTH")
    if decoded:
        return token
    else:
        return None
