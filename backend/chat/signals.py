from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Message
from .serializers import MessageSerializer

@receiver(post_save, sender=Message)
def broadcast_chat_message(sender, instance, created, **kwargs):
    """
    Broadcast message to WebSocket room group when saved in DB.
    This ensures messages created via API (like those with attachments)
    are sent to real-time clients.
    """
    if created:
        channel_layer = get_channel_layer()
        room_group_name = f'chat_{instance.room.id}'
        
        # We need to serialise the message same as the consumer/serializer does
        # Use MessageSerializer for consistency
        serializer = MessageSerializer(instance)
        message_data = serializer.data
        
        # Add extra fields that consumer might expect if any (currently it matches)
        # Note: sender_id, sender_email etc are extra in consumer's response
        # Let's enrich it to be safe or just use serializer data which is the truth
        
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'chat_message',
                'message': message_data
            }
        )
