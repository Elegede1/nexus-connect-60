from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.serializers import UserSerializer
from properties.serializers import PropertyListSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'content', 'is_read', 'timestamp']
        read_only_fields = ['id', 'sender', 'timestamp']
    
    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username


class ChatRoomSerializer(serializers.ModelSerializer):
    """Serializer for chat rooms"""
    
    landlord = UserSerializer(read_only=True)
    tenant = UserSerializer(read_only=True)
    property = PropertyListSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = [
            'id', 'landlord', 'tenant', 'property',
            'last_message', 'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0


class ChatRoomCreateSerializer(serializers.Serializer):
    """Serializer for creating/getting a chat room"""
    
    property_id = serializers.IntegerField()
