import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat.
    URL: ws/chat/<room_id>/
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']
        
        # Verify user is authenticated
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Verify user is part of this chat room
        room_exists = await self.verify_room_access()
        if not room_exists:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_content = data.get('message', '').strip()
            
            if not message_content:
                return
            
            # Save message to database
            message = await self.save_message(message_content)
            
            if message:
                # Broadcast message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': {
                            'id': message['id'],
                            'content': message['content'],
                            'sender_id': message['sender_id'],
                            'sender_email': message['sender_email'],
                            'sender_name': message['sender_name'],
                            'timestamp': message['timestamp'],
                            'is_read': message['is_read']
                        }
                    }
                )
        except json.JSONDecodeError:
            pass
    
    async def chat_message(self, event):
        """Send message to WebSocket"""
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))
    
    @database_sync_to_async
    def verify_room_access(self):
        """Verify user has access to this chat room"""
        try:
            room = ChatRoom.objects.get(pk=self.room_id)
            return self.user == room.landlord or self.user == room.tenant
        except ChatRoom.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content):
        """Save message to database"""
        try:
            room = ChatRoom.objects.get(pk=self.room_id)
            message = Message.objects.create(
                room=room,
                sender=self.user,
                content=content
            )
            
            # Update room's updated_at
            room.save()
            
            return {
                'id': message.id,
                'content': message.content,
                'sender_id': message.sender.id,
                'sender_email': message.sender.email,
                'sender_name': f"{message.sender.first_name} {message.sender.last_name}".strip() or message.sender.username,
                'timestamp': message.timestamp.isoformat(),
                'is_read': message.is_read
            }
        except ChatRoom.DoesNotExist:
            return None
