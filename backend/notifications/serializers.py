from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'is_read',
            'related_property_id', 'related_chat_id', 'related_review_id',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
