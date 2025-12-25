from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.serializers import UserSerializer
from properties.serializers import PropertyListSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    
    sender_name = serializers.SerializerMethodField()
    reply_to_info = serializers.SerializerMethodField()
    property_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'content', 'is_read', 
            'timestamp', 'reply_to', 'reply_to_info', 'attachment',
            'property', 'property_details'
        ]
        read_only_fields = ['id', 'sender', 'timestamp', 'reply_to_info', 'property_details']
    
    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username

    def get_reply_to_info(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'sender_name': f"{obj.reply_to.sender.first_name} {obj.reply_to.sender.last_name}".strip() or obj.reply_to.sender.username,
                'content': obj.reply_to.content
            }
        return None

    def get_property_details(self, obj):
        if obj.property:
            # Use the same logic as PropertyListSerializer to get cover image
            cover = obj.property.images.filter(is_cover=True).first()
            image_url = None
            if cover:
                image_url = cover.image_url
            else:
                first_image = obj.property.images.first()
                if first_image:
                    image_url = first_image.image_url
                    
            return {
                'id': obj.property.id,
                'title': obj.property.title,
                'cover_image': image_url
            }
        return None


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
        last_message = obj.messages.order_by('-timestamp').first()
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
