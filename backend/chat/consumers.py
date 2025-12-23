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
            reply_to_id = data.get('reply_to')
            property_id = data.get('property')
            
            if not message_content:
                return
            
            # Save message to database
            message = await self.save_message(message_content, reply_to_id, property_id)
            
            if message:
                # Broadcast message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message
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
    def save_message(self, content, reply_to_id=None, property_id=None):
        """Save message to database"""
        try:
            room = ChatRoom.objects.get(pk=self.room_id)
            
            reply_to_message = None
            if reply_to_id:
                try:
                    reply_to_message = Message.objects.get(pk=reply_to_id, room=room)
                except Message.DoesNotExist:
                    pass
            
            property_obj = None
            if property_id:
                from properties.models import Property
                try:
                    property_obj = Property.objects.get(pk=property_id)
                except Property.DoesNotExist:
                    pass

            message = Message.objects.create(
                room=room,
                sender=self.user,
                content=content,
                reply_to=reply_to_message,
                property=property_obj
            )
            
            # Update room's updated_at
            room.save()
            
            response = {
                'id': message.id,
                'content': message.content,
                'sender': message.sender.id, # consistent with serializer
                'sender_id': message.sender.id,
                'sender_email': message.sender.email,
                'sender_name': f"{message.sender.first_name} {message.sender.last_name}".strip() or message.sender.username,
                'timestamp': message.timestamp.isoformat(),
                'is_read': message.is_read,
                'reply_to': message.reply_to.id if message.reply_to else None,
                'reply_to_info': None,
                'property': message.property.id if message.property else None,
                'property_details': None
            }

            if message.reply_to:
                response['reply_to_info'] = {
                    'id': message.reply_to.id,
                    'sender_name': f"{message.reply_to.sender.first_name} {message.reply_to.sender.last_name}".strip() or message.reply_to.sender.username,
                    'content': message.reply_to.content
                }
            
            if message.property:
                response['property_details'] = {
                    'id': message.property.id,
                    'title': message.property.title,
                    'cover_image': message.property.cover_image.url if message.property.cover_image else None
                }
            
            return response
        except ChatRoom.DoesNotExist:
            return None
        except ChatRoom.DoesNotExist:
            return None
