from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.db import close_old_connections
from jwt import decode as jwt_decode
from django.conf import settings
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Decode the access token
        decoded_data = jwt_decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded_data.get('user_id')
        return User.objects.get(id=user_id)
    except Exception as e:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware to authenticate WebSocket connections using JWT token in query string.
    """
    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        # Get query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)
