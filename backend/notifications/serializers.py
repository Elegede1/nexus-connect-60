from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'is_read',
            'related_property_id', 'related_chat_id', 'related_review_id',
            'sender_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_sender_name(self, obj):
        """Get sender's display name"""
        if obj.sender:
            return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username
        return None
